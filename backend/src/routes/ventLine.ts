import { Router, Request, Response, NextFunction } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { getDb } from '../config/database';
import { verifyAccessToken } from '../services/jwtService';
import { detectCrisis, CRISIS_RESOURCES } from '../services/supportKnowledge';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// THE VENT LINE — drop whatever you're carrying, get heard, feel lighter.
// Warm, brief, validating. Not advice, not therapy, not "fixing".
const VENT_PERSONA =
  'You are The Vent Line for 1800 Feel Better — the place people come to let it out and feel heard. ' +
  'Someone just vented to you. Reply in 2-4 warm sentences. Validate the feeling first, name it gently, ' +
  'and make them feel less alone. Do NOT give advice, action steps, or try to fix it unless they ask — ' +
  'just receive what they said with real warmth. You are not a therapist or doctor and never claim to be. ' +
  'Never mention you are an AI unless directly asked.';

function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try { req.user = verifyAccessToken(header.slice(7)); } catch { /* anonymous */ }
  }
  next();
}

// Submit a vent. Stores it, returns a warm reply. Public sharing is opt-in.
router.post('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const body = (req.body?.body || '').toString().trim();
    if (!body) return res.status(400).json({ error: 'body required' });
    const alias = ((req.body?.alias ?? '').toString().trim().slice(0, 40)) || 'Anonymous';
    const isPublic = req.body?.is_public === true;
    const mood = req.body?.mood ? req.body.mood.toString().slice(0, 40) : null;

    const crisis = detectCrisis(body);
    const crisisDirective = crisis
      ? '\n\nIMPORTANT — this vent suggests possible crisis or self-harm risk. Lead with warmth and concern, take it seriously, and gently share: call Tele-MANAS 14416 or KIRAN 1800-599-0019, or call 112 if in immediate danger. Encourage them to reach out to someone they trust right now.'
      : '';

    let reply = "Thank you for trusting us with that. Whatever you're carrying, you don't have to hold it alone right now — we hear you.";
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const completion = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 256,
          system: `${VENT_PERSONA}${crisisDirective}`,
          messages: [{ role: 'user', content: body.slice(0, 4000) }],
        });
        reply = (completion.content[0] as any).text as string;
      } catch { /* fall back to the static warm reply */ }
    }

    const { data: entry, error } = await getDb().from('vent_line_entries').insert({
      user_id: req.user?.sub || null,
      alias,
      body: body.slice(0, 8000),
      ai_reply: reply,
      mood,
      is_public: isPublic,
    }).select('id, alias, body, ai_reply, mood, is_public, support_count, created_at').single();
    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json({ entry, reply, crisis, crisis_resources: crisis ? CRISIS_RESOURCES : undefined });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Public wall of shared vents (most recent first).
router.get('/feed', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await getDb()
      .from('vent_line_entries')
      .select('id, alias, body, ai_reply, mood, support_count, created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(60);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ entries: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// "Me too" support on a public vent.
router.post('/:id/support', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { data: entry } = await db.from('vent_line_entries').select('support_count, is_public').eq('id', req.params.id).maybeSingle();
    if (!entry || !entry.is_public) return res.status(404).json({ error: 'Vent not found' });
    const next = (entry.support_count || 0) + 1;
    await db.from('vent_line_entries').update({ support_count: next }).eq('id', req.params.id);
    res.json({ support_count: next });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
