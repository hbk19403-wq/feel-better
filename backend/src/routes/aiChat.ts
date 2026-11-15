import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { getDb } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { calculateCharge, recordUsage } from '../services/billingService';
import { buildSupportContext, detectCrisis, CRISIS_RESOURCES, suggestTrack } from '../services/supportKnowledge';
import { LISTENER_PLAYBOOK } from '../services/listenerPlaybook';
import { generateAssist } from '../services/listenerAssist';
import QRCode from 'qrcode';
import { MERCHANT_VPA, MERCHANT_NAME } from '../config/plans';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Free discovery window before advice is gated behind payment.
const FREE_WINDOW_SECONDS = 5 * 60;
// A paid "advice pass": price in ₹ and how many minutes it grants (₹1/min).
const ADVICE_PASS_MINUTES = 15;
const ADVICE_PASS_INR = ADVICE_PASS_MINUTES; // ₹1/min → ₹15 for 15 minutes

// Human-sounding phrasing shared by both phases. We keep it warm and natural,
// but never instruct the model to lie about being a bot — if a user directly
// asks, it should answer honestly (a disclosure also lives in the UI).
const HUMAN_STYLE =
  'Write like a real, caring person texting a friend — natural, warm, first-person, unhurried. ' +
  'Use everyday language and contractions, react to what they actually said, and vary your openings. ' +
  'Avoid clinical or robotic phrasing and never open with "As an AI". ' +
  'If the user directly and explicitly asks whether you are a bot or AI, answer honestly and kindly rather than deceiving them.';

// The free phase: build rapport and gather context, but hold back concrete
// step-by-step advice so there's a clear reason to continue.
const DISCOVERY_DIRECTIVE =
  '\n\nYou are in the FREE GET-TO-KNOW-YOU phase. Your goal is to make them feel truly heard and to gently draw out their story — ' +
  'reflect their feelings, validate, and ask ONE thoughtful, specific follow-up question each turn to understand the situation more deeply. ' +
  'Do NOT yet give concrete solutions, step-by-step plans, or prescriptive advice. If they push for answers, warmly acknowledge that you have real, specific guidance to share and that you can go deeper together in a moment.';

const ADVICE_DIRECTIVE =
  '\n\nThe user has unlocked full guidance. Now give genuinely helpful, specific, actionable advice grounded in what they have shared — ' +
  'concrete steps, perspectives, and gentle challenges — while staying warm and human. Still never diagnose or prescribe medication.';

function newTxnRef(): string {
  return `AC${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
}

// Public, login-free, stateless chat. Nothing is written to the database — no
// account, no transcript, no recording. History lives only in the request body.
const PUBLIC_PERSONA =
  'You are an empathetic AI companion for 1800 Feel Better — a free, confidential, judgment-free place to be heard 24/7. ' +
  'You are warm, calm, human, and present. You are not a therapist or doctor: you do not diagnose, prescribe, or promise to fix or cure anything — you listen with empathy and gently guide. ' +
  'Keep replies warm and conversational, 2-4 sentences unless more depth is needed. Never mention you are an AI unless directly asked.';

router.post('/public', async (req: Request, res: Response) => {
  try {
    const { messages, topic_id, age_group, mode = 'vent' } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages required' });
    }

    const clean = messages
      .filter((m: any) => (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string')
      .slice(-20)
      .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content.slice(0, 4000) }));
    if (clean.length === 0 || clean[clean.length - 1].role !== 'user') {
      return res.status(400).json({ error: 'last message must be from user' });
    }

    const latest = clean[clean.length - 1].content;
    const crisis = detectCrisis(latest);
    const supportContext = buildSupportContext({ ageGroupId: age_group, topicId: topic_id, mode, channel: 'chat' });
    const crisisDirective = crisis
      ? '\n\nIMPORTANT — the latest message suggests possible crisis or self-harm risk. Lead with warmth and concern, take it seriously, and gently share: call Tele-MANAS 14416 or KIRAN 1800-599-0019, or call 112 if in immediate danger. Encourage them to reach out to someone they trust right now.'
      : '';

    const completion = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: `${PUBLIC_PERSONA}\n\n${LISTENER_PLAYBOOK}${supportContext}${crisisDirective}`,
      messages: clean,
    });

    const reply = (completion.content[0] as any).text as string;
    res.json({ message: reply, crisis, crisis_resources: crisis ? CRISIS_RESOURCES : undefined });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Listener-assist safety net. Given the live conversation so far, returns
// structured guidance for a human listener. Stateless — nothing is written to
// the database. Shared with the listener console via generateAssist().
router.post('/assist', async (req: Request, res: Response) => {
  try {
    const { messages, topic_id, age_group } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages required' });
    }
    const result = await generateAssist(messages, { ageGroupId: age_group, topicId: topic_id });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sessions', requireAuth, async (req: Request, res: Response) => {
  try {
    const { ai_listener_id, topic_id, mode = 'vent', age_group } = req.body;
    if (!ai_listener_id) return res.status(400).json({ error: 'ai_listener_id required' });

    const { data: listener, error: le } = await getDb().from('ai_listeners').select('id').eq('id', ai_listener_id).single();
    if (le || !listener) return res.status(404).json({ error: 'AI listener not found' });

    const { data, error } = await getDb().from('ai_sessions').insert({
      user_id: req.user!.sub,
      ai_listener_id,
      topic_id: topic_id || null,
      mode,
      age_group: age_group || null,
      status: 'active',
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });

    if (age_group) {
      await getDb().from('users').update({ age_band: age_group }).eq('id', req.user!.sub);
    }

    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sessions/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data: session, error } = await getDb()
      .from('ai_sessions')
      .select('*, ai_listeners(name, avatar_emoji, gender, voice_id)')
      .eq('id', req.params.id)
      .eq('user_id', req.user!.sub)
      .single();
    if (error || !session) return res.status(404).json({ error: 'Session not found' });

    const { data: messages } = await getDb()
      .from('ai_messages')
      .select('*')
      .eq('session_id', req.params.id)
      .order('created_at', { ascending: true });

    res.json({ session, messages: messages || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sessions/:id/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'content required' });

    const { data: session, error: se } = await getDb()
      .from('ai_sessions')
      .select('*, ai_listeners(*)')
      .eq('id', req.params.id)
      .eq('user_id', req.user!.sub)
      .eq('status', 'active')
      .single();
    if (se || !session) return res.status(404).json({ error: 'Active session not found' });

    const { data: history } = await getDb()
      .from('ai_messages')
      .select('role, content')
      .eq('session_id', req.params.id)
      .order('created_at', { ascending: true })
      .limit(20);

    const listener = (session as any).ai_listeners;
    const now = Date.now();
    const startedAt = new Date(session.started_at || session.created_at).getTime();
    const durationSeconds = Math.floor((now - startedAt) / 1000);
    const crisis = detectCrisis(content);

    // Advice is unlocked either by payment, or (safety-first) whenever the
    // latest message signals crisis — we never withhold help from someone at risk.
    const unlocked = !!session.advice_unlocked || crisis;
    const pastFreeWindow = durationSeconds >= FREE_WINDOW_SECONDS;

    // Paywall: past the free window and not unlocked → stop giving guidance and
    // invite them to continue (payment). Still record the user's message.
    if (pastFreeWindow && !unlocked) {
      await getDb().from('ai_messages').insert([{ session_id: req.params.id, role: 'user', content }]);
      await getDb().from('ai_sessions').update({ duration_seconds: durationSeconds }).eq('id', req.params.id);
      const gateMessage =
        "I've really been taking in everything you've shared — and honestly, I can see a few specific things that could genuinely help you here. " +
        "I'd love to keep going properly and walk you through them. To carry on with real, personal guidance it's just ₹1/min. Want to continue?";
      return res.json({
        message: gateMessage,
        paywall: true,
        pass: { minutes: ADVICE_PASS_MINUTES, amount_inr: ADVICE_PASS_INR, currency: 'INR', rate_per_minute: 1 },
        billing: { duration_seconds: durationSeconds, mode: session.mode },
      });
    }

    const topicContext = session.topic_id ? ` The user has selected the topic: "${session.topic_id.replace(/_/g, ' ')}".` : '';
    const supportContext = buildSupportContext({
      ageGroupId: session.age_group,
      topicId: session.topic_id,
      mode: session.mode,
    });
    const crisisDirective = crisis
      ? `\n\nIMPORTANT — the user's latest message indicates possible crisis or self-harm risk. Lead with warmth and concern, take it seriously, do not minimize. Gently surface these resources: call Tele-MANAS 14416 or KIRAN 1800-599-0019, or call 112 if in immediate danger. Encourage them to reach out to a person they trust right now.`
      : '';
    const phaseDirective = unlocked ? ADVICE_DIRECTIVE : DISCOVERY_DIRECTIVE;

    const systemPrompt = `${listener.personality_prompt}${topicContext}${supportContext}\n\n${LISTENER_PLAYBOOK}\n\n${HUMAN_STYLE}${phaseDirective}${crisisDirective}\n\nKeep replies to 2-4 sentences unless the moment needs more.`;

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...(history || []).map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content },
    ];

    const completion = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages,
    });

    const reply = (completion.content[0] as any).text as string;

    await getDb().from('ai_messages').insert([
      { session_id: req.params.id, role: 'user', content },
      { session_id: req.params.id, role: 'assistant', content: reply },
    ]);

    const sessionUpdate: Record<string, any> = { duration_seconds: durationSeconds };
    if (crisis && !session.crisis_flagged) sessionUpdate.crisis_flagged = true;
    if (!session.suggested_track) sessionUpdate.suggested_track = suggestTrack(content);
    await getDb().from('ai_sessions').update(sessionUpdate).eq('id', req.params.id);

    const billing = calculateCharge(session.mode, durationSeconds);

    res.json({
      message: reply,
      crisis,
      crisis_resources: crisis ? CRISIS_RESOURCES : undefined,
      advice_unlocked: unlocked,
      free_seconds_left: Math.max(0, FREE_WINDOW_SECONDS - durationSeconds),
      billing: {
        duration_seconds: durationSeconds,
        mode: session.mode,
        ...billing,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create a UPI order to unlock full advice on a chat session (₹1/min pass).
router.post('/sessions/:id/unlock', requireAuth, async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { data: session } = await db.from('ai_sessions').select('id, advice_unlocked').eq('id', req.params.id).eq('user_id', req.user!.sub).single();
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.advice_unlocked) return res.json({ already_unlocked: true });

    const txnRef = newTxnRef();
    await db.from('payments').insert({
      user_id: req.user!.sub,
      kind: 'chat_unlock',
      plan: null,
      amount_inr: ADVICE_PASS_INR,
      currency: 'INR',
      payee_vpa: MERCHANT_VPA,
      txn_ref: txnRef,
      status: 'created',
    }).then(() => {}, () => {});

    const params = new URLSearchParams({
      pa: MERCHANT_VPA, pn: MERCHANT_NAME, am: String(ADVICE_PASS_INR), cu: 'INR',
      tn: `1800FeelBetter advice pass (${ADVICE_PASS_MINUTES}m)`, tr: txnRef,
    });
    const upiUri = `upi://pay?${params.toString()}`;
    const qrDataUrl = await QRCode.toDataURL(upiUri, { margin: 1, width: 320 });

    res.status(201).json({
      txn_ref: txnRef,
      amount_inr: ADVICE_PASS_INR,
      minutes: ADVICE_PASS_MINUTES,
      currency: 'INR',
      payee_vpa: MERCHANT_VPA,
      upi_uri: upiUri,
      qr_data_url: qrDataUrl,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Confirm the UPI payment (UTR) and unlock advice for the session.
router.post('/sessions/:id/confirm-unlock', requireAuth, async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const txnRef = String(req.body?.txn_ref || '');
    const upiTxnId = String(req.body?.upi_txn_id || '').trim();
    if (upiTxnId.length < 6) return res.status(400).json({ error: 'Enter the UPI reference / UTR from your payment app' });

    const { data: session } = await db.from('ai_sessions').select('id').eq('id', req.params.id).eq('user_id', req.user!.sub).single();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (txnRef) {
      await db.from('payments').update({ upi_txn_id: upiTxnId, status: 'submitted', updated_at: new Date().toISOString() })
        .eq('txn_ref', txnRef).eq('user_id', req.user!.sub).then(() => {}, () => {});
    }
    await db.from('ai_sessions').update({ advice_unlocked: true, advice_unlocked_at: new Date().toISOString() }).eq('id', req.params.id);

    res.json({ advice_unlocked: true, message: 'Thanks! Full guidance unlocked.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sessions/:id/end', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data: session, error } = await getDb()
      .from('ai_sessions')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user!.sub)
      .single();
    if (error || !session) return res.status(404).json({ error: 'Session not found' });

    const now = new Date();
    const durationSeconds = Math.floor((now.getTime() - new Date(session.started_at).getTime()) / 1000);
    const billing = calculateCharge(session.mode, durationSeconds);

    await getDb().from('ai_sessions').update({
      status: 'ended',
      ended_at: now.toISOString(),
      duration_seconds: durationSeconds,
      charged_minutes: billing.chargedMinutes,
      total_charged: billing.totalCharged,
    }).eq('id', req.params.id);

    if (billing.chargedMinutes > 0) {
      await recordUsage(req.user!.sub, req.params.id, 'ai', billing.chargedMinutes, billing.totalCharged);
    }

    res.json({ message: 'Session ended', billing });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
