import { Router, Request, Response } from 'express';
import { getDb } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { generateAssist, generateSummary, AssistMessage } from '../services/listenerAssist';
import { CATEGORY_GUIDANCE } from '../services/supportKnowledge';

const router = Router();

// All routes require an authenticated user who is also a registered listener.
// Resolves the listener row for the current user, or null.
async function getListener(userId: string) {
  const { data } = await getDb()
    .from('listeners')
    .select('id, user_id, alias, display_name, specializations, languages, is_online, average_rating')
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

function isMissingTable(err: any): boolean {
  const m = `${err?.message || err?.code || ''}`.toLowerCase();
  return m.includes('does not exist') || err?.code === '42p01' || m.includes('could not find the table');
}

router.use(requireAuth);

// Listener identity — frontend uses this to gate the console.
router.get('/me', async (req: Request, res: Response) => {
  try {
    const listener = await getListener(req.user!.sub);
    if (!listener) return res.status(403).json({ error: 'Not a registered listener' });
    res.json({ listener });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Queue: unassigned pending sessions + this listener's own active sessions.
router.get('/queue', async (req: Request, res: Response) => {
  try {
    const listener = await getListener(req.user!.sub);
    if (!listener) return res.status(403).json({ error: 'Not a registered listener' });
    const db = getDb();

    const { data: pending } = await db
      .from('sessions')
      .select('id, user_alias, category_id, session_type, status, age_group, created_at, mood_before')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50);

    const { data: mine } = await db
      .from('sessions')
      .select('id, user_alias, category_id, session_type, status, age_group, created_at, started_at, mood_before')
      .eq('listener_id', listener.id)
      .eq('status', 'active')
      .order('started_at', { ascending: true })
      .limit(50);

    res.json({ pending: pending || [], active: mine || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Claim an unassigned session.
router.post('/sessions/:id/claim', async (req: Request, res: Response) => {
  try {
    const listener = await getListener(req.user!.sub);
    if (!listener) return res.status(403).json({ error: 'Not a registered listener' });
    const db = getDb();

    const { data: session } = await db.from('sessions').select('id, status, listener_id').eq('id', req.params.id).single();
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status !== 'pending' && session.listener_id !== listener.id) {
      return res.status(409).json({ error: 'Session already claimed by another listener' });
    }

    const { data: updated, error } = await db
      .from('sessions')
      .update({ listener_id: listener.id, status: 'active', started_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ session: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Caller overview + transcript for the console.
router.get('/sessions/:id', async (req: Request, res: Response) => {
  try {
    const listener = await getListener(req.user!.sub);
    if (!listener) return res.status(403).json({ error: 'Not a registered listener' });
    const db = getDb();

    const { data: session } = await db
      .from('sessions')
      .select('*, support_categories(name)')
      .eq('id', req.params.id)
      .single();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Caller profile (best-effort, anonymized).
    let caller: any = null;
    if (session.user_id) {
      const { data: u } = await db.from('users').select('age_band, language_preference, created_at').eq('id', session.user_id).maybeSingle();
      const { data: prior } = await db.from('sessions').select('id', { count: 'exact', head: true }).eq('user_id', session.user_id);
      caller = {
        age_group: session.age_group || u?.age_band || null,
        language: u?.language_preference || 'English',
        returning: Array.isArray(prior) ? prior.length > 1 : false,
      };
    }

    let messages: any[] = [];
    try {
      const { data, error } = await db
        .from('session_messages')
        .select('id, sender, content, created_at')
        .eq('session_id', req.params.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      messages = data || [];
    } catch (e) {
      if (!isMissingTable(e)) throw e;
      // Migration 002 not applied yet — degrade to empty transcript.
    }

    const cat = (session as any).category_id;
    res.json({
      session: { ...session, category_name: (session as any).support_categories?.name },
      caller,
      messages,
      categoryGuidance: cat && CATEGORY_GUIDANCE[cat] ? CATEGORY_GUIDANCE[cat] : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Listener posts a reply into the transcript.
router.post('/sessions/:id/messages', async (req: Request, res: Response) => {
  try {
    const listener = await getListener(req.user!.sub);
    if (!listener) return res.status(403).json({ error: 'Not a registered listener' });
    const content = (req.body?.content || '').toString().trim();
    if (!content) return res.status(400).json({ error: 'content required' });

    const { data, error } = await getDb()
      .from('session_messages')
      .insert({ session_id: req.params.id, sender: 'listener', content: content.slice(0, 4000) })
      .select()
      .single();
    if (error) {
      if (isMissingTable(error)) return res.status(503).json({ error: 'Transcript storage not set up. Apply migration 002_listener_console.sql.' });
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json({ message: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AI assist over the current transcript.
router.post('/sessions/:id/assist', async (req: Request, res: Response) => {
  try {
    const listener = await getListener(req.user!.sub);
    if (!listener) return res.status(403).json({ error: 'Not a registered listener' });
    const db = getDb();

    const { data: session } = await db.from('sessions').select('category_id, age_group').eq('id', req.params.id).single();

    let rows: any[] = [];
    try {
      const { data, error } = await db
        .from('session_messages')
        .select('sender, content')
        .eq('session_id', req.params.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      rows = data || [];
    } catch (e) {
      if (!isMissingTable(e)) throw e;
    }

    const messages: AssistMessage[] = rows.map(r => ({
      role: r.sender === 'caller' ? 'user' : 'listener',
      content: r.content,
    }));
    // Allow ad-hoc preview text from the body if the transcript is empty.
    if (messages.length === 0 && typeof req.body?.draft === 'string' && req.body.draft.trim()) {
      messages.push({ role: 'user', content: req.body.draft.trim() });
    }
    if (messages.length === 0) return res.status(400).json({ error: 'No conversation yet' });

    const result = await generateAssist(messages, {
      ageGroupId: session?.age_group || undefined,
      topicId: session?.category_id || undefined,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save private notes / risk level / escalation flag.
router.post('/sessions/:id/notes', async (req: Request, res: Response) => {
  try {
    const listener = await getListener(req.user!.sub);
    if (!listener) return res.status(403).json({ error: 'Not a registered listener' });

    const update: Record<string, any> = {};
    if (typeof req.body?.listener_notes === 'string') update.listener_notes = req.body.listener_notes.slice(0, 8000);
    if (['low', 'medium', 'high'].includes(req.body?.risk_level)) update.risk_level = req.body.risk_level;
    if (typeof req.body?.escalated === 'boolean') update.escalated = req.body.escalated;
    if (Object.keys(update).length === 0) return res.status(400).json({ error: 'nothing to update' });

    const { error } = await getDb().from('sessions').update(update).eq('id', req.params.id).eq('listener_id', listener.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// End the session and generate an after-call summary.
router.post('/sessions/:id/end', async (req: Request, res: Response) => {
  try {
    const listener = await getListener(req.user!.sub);
    if (!listener) return res.status(403).json({ error: 'Not a registered listener' });
    const db = getDb();

    const { data: session } = await db.from('sessions').select('category_id, age_group, risk_level').eq('id', req.params.id).single();

    let rows: any[] = [];
    try {
      const { data } = await db.from('session_messages').select('sender, content').eq('session_id', req.params.id).order('created_at', { ascending: true });
      rows = data || [];
    } catch { /* table may not exist */ }

    const messages: AssistMessage[] = rows.map(r => ({ role: r.sender === 'caller' ? 'user' : 'listener', content: r.content }));
    const summaryResult = messages.length > 0
      ? await generateSummary(messages, { ageGroupId: session?.age_group || undefined, topicId: session?.category_id || undefined })
      : { summary: 'No transcript captured.', emotions: [], riskLevel: 'low' as const, recommendedFollowUp: '' };

    // The human listener's final risk judgment wins. The AI's risk assessment is
    // only a fallback when the listener never set one on the session.
    const finalRiskLevel = session?.risk_level || summaryResult.riskLevel;

    await db.from('sessions').update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      summary: summaryResult.summary,
      risk_level: finalRiskLevel,
    }).eq('id', req.params.id).eq('listener_id', listener.id);

    res.json({ ...summaryResult, riskLevel: finalRiskLevel, aiRiskLevel: summaryResult.riskLevel });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
