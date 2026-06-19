import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { dbRun, dbAll, dbGet } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

const checkinSchema = z.object({
  mood_score: z.number().int().min(1).max(5).optional(),
  mood: z.number().int().min(1).max(5).optional(),
  note: z.string().max(500).optional(),
});

// POST /wellness/checkins
router.post('/checkins', requireAuth, async (req: Request, res: Response) => {
  try {
    const parse = checkinSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.issues });
    const mood = parse.data.mood_score || parse.data.mood;
    if (!mood) return res.status(400).json({ error: 'mood or mood_score is required' });
    const row = await dbGet<any>(
      'INSERT INTO wellness_checkins (user_id, mood, note) VALUES ($1,$2,$3) RETURNING *',
      [req.user!.sub, mood, parse.data.note ?? null]
    );
    res.status(201).json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Legacy alias
router.post('/checkin', requireAuth, async (req: Request, res: Response) => {
  req.url = '/checkins';
  router.handle(req, res, () => {});
});

// GET /wellness/checkins
router.get('/checkins', requireAuth, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 90);
    const checkins = await dbAll(
      `SELECT * FROM wellness_checkins WHERE user_id = $1 ORDER BY checked_in_at DESC LIMIT $2`,
      [req.user!.sub, limit]
    );
    res.json({ checkins });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /wellness/trends
router.get('/trends', requireAuth, async (req: Request, res: Response) => {
  try {
    const trends = await dbAll(
      `SELECT DATE(checked_in_at) as date, AVG(mood)::numeric(3,2) as avg_mood, COUNT(*) as count
       FROM wellness_checkins WHERE user_id = $1 AND checked_in_at > NOW() - INTERVAL '30 days'
       GROUP BY DATE(checked_in_at) ORDER BY date ASC`,
      [req.user!.sub]
    );
    res.json(trends);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
