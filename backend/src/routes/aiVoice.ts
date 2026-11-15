import { Router, Request, Response } from 'express';
import { getDb } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { calculateCharge, recordUsage } from '../services/billingService';
import { buildSupportContext } from '../services/supportKnowledge';
import { LISTENER_PLAYBOOK_VOICE } from '../services/listenerPlaybook';

const router = Router();

// Voices accepted by the OpenAI Realtime API. Anything else (e.g. legacy TTS
// voices like 'fable', 'nova', 'onyx') is rejected, so we map to a close match.
const REALTIME_VOICES = new Set(['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'marin', 'cedar']);
const VOICE_FALLBACKS: Record<string, string> = {
  nova: 'shimmer',
  fable: 'sage',
  onyx: 'ash',
};
function safeVoice(voice?: string | null): string {
  if (voice && REALTIME_VOICES.has(voice)) return voice;
  if (voice && VOICE_FALLBACKS[voice]) return VOICE_FALLBACKS[voice];
  // 'marin' is the most natural, warm Realtime voice — best default for a
  // mental-health listener (far less robotic than the old 'alloy').
  return 'marin';
}

// Natural-sounding voices we expose for the caller to pick from, warmest first.
const SELECTABLE_VOICES = [
  { id: 'marin', label: 'Marin — warm & natural' },
  { id: 'cedar', label: 'Cedar — calm & grounded' },
  { id: 'shimmer', label: 'Shimmer — soft & soothing' },
  { id: 'coral', label: 'Coral — gentle & bright' },
];

// Lets the mobile/web client fetch the list for a voice picker.
router.get('/voices', (_req: Request, res: Response) => {
  res.json({ voices: SELECTABLE_VOICES });
});

router.post('/token', requireAuth, async (req: Request, res: Response) => {
  try {
    const { ai_listener_id, topic_id, mode = 'advisory', age_group, voice } = req.body;
    if (!ai_listener_id) return res.status(400).json({ error: 'ai_listener_id required' });
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Voice service not configured' });

    const { data: listener, error: le } = await getDb().from('ai_listeners').select('*').eq('id', ai_listener_id).single();
    if (le || !listener) return res.status(404).json({ error: 'AI listener not found' });

    const topicContext = topic_id ? ` The caller wants to discuss: "${topic_id.replace(/_/g, ' ')}".` : '';
    const supportContext = buildSupportContext({ ageGroupId: age_group, topicId: topic_id, mode, channel: 'voice' });
    const instructions = `${listener.personality_prompt}${topicContext}${supportContext}\n\n${LISTENER_PLAYBOOK_VOICE}\n\nSpeak naturally and warmly, like a real person — never robotic or scripted. Keep responses concise in voice — 1-3 sentences. Never mention you are an AI unless the caller directly and explicitly asks, in which case answer honestly and kindly.`;

    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model: 'gpt-realtime-mini',
          instructions,
          audio: {
            input: { transcription: { model: 'whisper-1' } },
            output: { voice: safeVoice(voice || listener.voice_id) },
          },
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: `OpenAI error: ${err}` });
    }

    const session = await response.json() as { value: string; session: { id: string } };

    const { data: aiSession } = await getDb().from('ai_sessions').insert({
      user_id: req.user!.sub,
      ai_listener_id,
      topic_id: topic_id || null,
      mode,
      age_group: age_group || null,
      status: 'active',
    }).select().single();

    if (age_group) {
      await getDb().from('users').update({ age_band: age_group }).eq('id', req.user!.sub);
    }

    res.json({
      token: session.value,
      openai_session_id: session.session?.id,
      ai_session_id: aiSession?.id,
      listener: { name: listener.name, avatar_emoji: listener.avatar_emoji, voice_id: listener.voice_id },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sessions/:id/end', requireAuth, async (req: Request, res: Response) => {
  try {
    const { duration_seconds = 0 } = req.body;
    const { data: session } = await getDb().from('ai_sessions').select('*').eq('id', req.params.id).eq('user_id', req.user!.sub).single();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const billing = calculateCharge(session.mode, duration_seconds);
    await getDb().from('ai_sessions').update({
      status: 'ended',
      ended_at: new Date().toISOString(),
      duration_seconds,
      charged_minutes: billing.chargedMinutes,
      total_charged: billing.totalCharged,
    }).eq('id', req.params.id);

    if (billing.chargedMinutes > 0) {
      await recordUsage(req.user!.sub, req.params.id, 'ai_voice', billing.chargedMinutes, billing.totalCharged);
    }

    res.json({ billing });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
