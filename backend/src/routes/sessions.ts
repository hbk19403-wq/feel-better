import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

function generateAlias(): string {
  const adj = ['Brave', 'Gentle', 'Calm', 'Kind', 'Warm', 'Bold', 'Soft', 'Clear'];
  const noun = ['River', 'Sky', 'Star', 'Moon', 'Wind', 'Leaf', 'Stone', 'Wave'];
  return `${adj[Math.floor(Math.random() * adj.length)]}${noun[Math.floor(Math.random() * noun.length)]}`;
}

const requestSchema = z.object({
  category: z.string().optional(),
  category_id: z.string().optional(),
  session_type: z.enum(['voice', 'text', 'scheduled']).default('voice'),
  listener_id: z.string().uuid().optional(),
  preferred_language: z.string().optional(),
  mood_before: z.number().int().min(1).max(5).optional(),
});

router.post('/request', requireAuth, async (req: Request, res: Response) => {
  try {
    const parse = requestSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.issues });

    const { session_type, listener_id, mood_before } = parse.data;
    const category_id = parse.data.category_id || parse.data.category || 'venting_general';
    const db = getDb();

    const { data: session, error } = await db.from('sessions').insert({
      user_id: req.user!.sub,
      category_id,
      session_type,
      status: listener_id ? 'active' : 'pending',
      user_alias: generateAlias(),
      listener_id: listener_id || null,
      mood_before: mood_before || null,
      started_at: listener_id ? new Date().toISOString() : null,
    }).select().single();

    if (error || !session) return res.status(500).json({ error: error?.message });

    if (listener_id) {
      await db.from('listeners').update({ active_session_count: db.from('listeners') })
        .eq('id', listener_id);
      // Simple increment
      await db.rpc('increment_listener_sessions', { listener_id });
    }

    // Fetch with listener name
    const { data: full } = await db.from('sessions')
      .select('*, listeners(alias, display_name), support_categories(name)')
      .eq('id', session.id)
      .single();

    const enriched = {
      ...(full || session),
      listener_name: (full as any)?.listeners?.display_name || (full as any)?.listeners?.alias,
      category_name: (full as any)?.support_categories?.name,
    };

    res.status(201).json({ session: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', requireAuth, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const { data: sessions } = await getDb()
      .from('sessions')
      .select('*, listeners(alias, display_name), support_categories(name)')
      .eq('user_id', req.user!.sub)
      .order('created_at', { ascending: false })
      .limit(limit);

    const enriched = (sessions || []).map((s: any) => ({
      ...s,
      listener_name: s.listeners?.display_name || s.listeners?.alias,
      category_name: s.support_categories?.name,
    }));

    res.json({ sessions: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data: session } = await getDb()
      .from('sessions')
      .select('*, listeners(alias, display_name, specializations, average_rating), support_categories(name)')
      .eq('id', req.params.id)
      .eq('user_id', req.user!.sub)
      .single();

    if (!session) return res.status(404).json({ error: 'Session not found' });

    res.json({
      session: {
        ...session,
        listener_name: (session as any).listeners?.display_name || (session as any).listeners?.alias,
        category_name: (session as any).support_categories?.name,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/end', requireAuth, async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { data: session } = await db.from('sessions').select('*').eq('id', req.params.id).eq('user_id', req.user!.sub).single();
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status === 'completed') return res.status(400).json({ error: 'Session already ended' });

    const startedAt = session.started_at ? new Date(session.started_at) : new Date();
    const duration = Math.floor((Date.now() - startedAt.getTime()) / 1000);

    await db.from('sessions').update({ status: 'completed', ended_at: new Date().toISOString(), duration_seconds: duration }).eq('id', req.params.id);

    if (session.listener_id) {
      await db.rpc('decrement_listener_sessions', { listener_id: session.listener_id });
    }

    const { data: updated } = await db.from('sessions').select('*').eq('id', req.params.id).single();
    res.json({ session: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const reviewSchema = z.object({
  listener_rating: z.number().int().min(1).max(5).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  mood_after: z.number().int().min(1).max(5).optional(),
  session_comment: z.string().max(500).optional(),
  comment: z.string().max(500).optional(),
});

router.post('/:id/review', requireAuth, async (req: Request, res: Response) => {
  try {
    const parse = reviewSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.issues });

    const rating = parse.data.listener_rating || parse.data.rating;
    const { mood_after } = parse.data;
    const comment = parse.data.session_comment || parse.data.comment;
    const db = getDb();

    const { data: session } = await db.from('sessions').select('listener_id').eq('id', req.params.id).eq('user_id', req.user!.sub).single();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    await db.from('sessions').update({ rating: rating || null, mood_after: mood_after || null, rating_comment: comment || null }).eq('id', req.params.id);

    if (session.listener_id && rating) {
      await db.rpc('update_listener_rating', { listener_id: session.listener_id, new_rating: rating });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
