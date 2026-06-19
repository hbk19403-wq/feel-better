import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { dbGet, dbRun, dbAll } from '../config/database';
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
  scheduled_at: z.string().optional(),
  mood_before: z.number().int().min(1).max(5).optional(),
});

router.post('/request', requireAuth, async (req: Request, res: Response) => {
  try {
    const parse = requestSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.issues });

    const { session_type, listener_id, scheduled_at, mood_before } = parse.data;
    const category_id = parse.data.category_id || parse.data.category || 'venting_general';
    const alias = generateAlias();
    const status = listener_id ? 'active' : 'pending';
    const startedAt = listener_id ? new Date().toISOString() : null;

    const session = await dbGet<any>(
      `INSERT INTO sessions (user_id, category_id, session_type, status, user_alias, listener_id, scheduled_at, mood_before, started_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user!.sub, category_id, session_type, status, alias, listener_id ?? null, scheduled_at ?? null, mood_before ?? null, startedAt]
    );

    if (listener_id) {
      await dbRun('UPDATE listeners SET active_session_count = active_session_count + 1 WHERE id = $1', [listener_id]);
    }

    // Fetch with listener name
    const full = await dbGet<any>(
      `SELECT s.*, l.alias as listener_name, l.display_name, sc.name as category_name
       FROM sessions s
       LEFT JOIN listeners l ON s.listener_id = l.id
       LEFT JOIN support_categories sc ON s.category_id = sc.id
       WHERE s.id = $1`,
      [session.id]
    );

    res.status(201).json({ session: { ...full, listener_name: full?.display_name || full?.listener_name } });
  } catch (err: any) {
    console.error('Session request error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', requireAuth, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const sessions = await dbAll(
      `SELECT s.*, l.alias as listener_name, l.display_name, sc.name as category_name
       FROM sessions s
       LEFT JOIN listeners l ON s.listener_id = l.id
       LEFT JOIN support_categories sc ON s.category_id = sc.id
       WHERE s.user_id = $1 ORDER BY s.created_at DESC LIMIT $2 OFFSET $3`,
      [req.user!.sub, limit, offset]
    );
    res.json({ sessions, limit, offset });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const session = await dbGet<any>(
      `SELECT s.*, l.alias as listener_name, l.display_name, l.specializations, l.average_rating, sc.name as category_name
       FROM sessions s
       LEFT JOIN listeners l ON s.listener_id = l.id
       LEFT JOIN support_categories sc ON s.category_id = sc.id
       WHERE s.id = $1 AND s.user_id = $2`,
      [req.params.id, req.user!.sub]
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ session: { ...session, listener_name: session.display_name || session.listener_name } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/end', requireAuth, async (req: Request, res: Response) => {
  try {
    const session = await dbGet<any>('SELECT * FROM sessions WHERE id = $1 AND user_id = $2', [req.params.id, req.user!.sub]);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status === 'completed') return res.status(400).json({ error: 'Session already ended' });

    const startedAt = session.started_at ? new Date(session.started_at) : new Date();
    const duration = Math.floor((Date.now() - startedAt.getTime()) / 1000);

    await dbRun(
      "UPDATE sessions SET status = 'completed', ended_at = NOW(), duration_seconds = $1 WHERE id = $2",
      [duration, req.params.id]
    );
    if (session.listener_id) {
      await dbRun(
        'UPDATE listeners SET active_session_count = GREATEST(0, active_session_count - 1), total_sessions = total_sessions + 1 WHERE id = $1',
        [session.listener_id]
      );
    }
    const updated = await dbGet<any>('SELECT * FROM sessions WHERE id = $1', [req.params.id]);
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

    const session = await dbGet<any>('SELECT * FROM sessions WHERE id = $1 AND user_id = $2', [req.params.id, req.user!.sub]);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    await dbRun('UPDATE sessions SET rating = $1, mood_after = $2, rating_comment = $3 WHERE id = $4',
      [rating ?? null, mood_after ?? null, comment ?? null, req.params.id]);

    if (session.listener_id && rating) {
      const l = await dbGet<any>('SELECT average_rating, rating_count FROM listeners WHERE id = $1', [session.listener_id]);
      if (l) {
        const newRating = (Number(l.average_rating) * l.rating_count + rating) / (l.rating_count + 1);
        await dbRun('UPDATE listeners SET average_rating = $1, rating_count = rating_count + 1 WHERE id = $2',
          [newRating.toFixed(2), session.listener_id]);
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
