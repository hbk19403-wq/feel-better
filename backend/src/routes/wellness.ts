import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

const checkinSchema = z.object({
  mood_score: z.number().int().min(1).max(5).optional(),
  mood: z.number().int().min(1).max(5).optional(),
  note: z.string().max(500).optional(),
});

async function createCheckin(req: Request, res: Response) {
  try {
    const parse = checkinSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.issues });
    const mood = parse.data.mood_score || parse.data.mood;
    if (!mood) return res.status(400).json({ error: 'mood required' });
    const { data, error } = await getDb().from('wellness_checkins').insert({
      user_id: req.user!.sub, mood, note: parse.data.note || null,
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

router.post('/checkins', requireAuth, createCheckin);
router.post('/checkin', requireAuth, createCheckin);

router.get('/checkins', requireAuth, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 90);
    const { data: checkins } = await getDb()
      .from('wellness_checkins')
      .select('*')
      .eq('user_id', req.user!.sub)
      .order('checked_in_at', { ascending: false })
      .limit(limit);
    res.json({ checkins: checkins || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/trends', requireAuth, async (req: Request, res: Response) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await getDb()
      .from('wellness_checkins')
      .select('mood, checked_in_at')
      .eq('user_id', req.user!.sub)
      .gte('checked_in_at', since)
      .order('checked_in_at', { ascending: true });
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
