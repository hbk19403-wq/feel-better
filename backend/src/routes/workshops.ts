import { Router, Request, Response } from 'express';
import { dbAll, dbGet, dbRun } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const workshops = await dbAll(
      `SELECT w.*, sc.name as category_name,
       EXISTS(SELECT 1 FROM workshop_registrations wr WHERE wr.workshop_id = w.id AND wr.user_id = $1) as registered
       FROM workshops w LEFT JOIN support_categories sc ON w.category_id = sc.id
       WHERE w.scheduled_at > NOW() ORDER BY w.scheduled_at ASC`,
      [req.user!.sub]
    );
    res.json({ workshops });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/register', requireAuth, async (req: Request, res: Response) => {
  try {
    const w = await dbGet<any>('SELECT * FROM workshops WHERE id = $1', [req.params.id]);
    if (!w) return res.status(404).json({ error: 'Workshop not found' });
    const maxCap = w.max_attendees || w.max_participants;
    if (maxCap && w.registered_count >= maxCap) return res.status(400).json({ error: 'Workshop is full' });
    await dbRun(
      'INSERT INTO workshop_registrations (user_id, workshop_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.user!.sub, req.params.id]
    );
    await dbRun('UPDATE workshops SET registered_count = registered_count + 1 WHERE id = $1', [req.params.id]);
    res.json({ message: 'Registered successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
