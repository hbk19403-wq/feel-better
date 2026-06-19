import { Router, Request, Response } from 'express';
import { getDb } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data: workshops } = await getDb()
      .from('workshops')
      .select('*, support_categories(name)')
      .gt('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true });

    res.json({ workshops: (workshops || []).map((w: any) => ({ ...w, category_name: w.support_categories?.name })) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/register', requireAuth, async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { data: w } = await db.from('workshops').select('*').eq('id', req.params.id).single();
    if (!w) return res.status(404).json({ error: 'Workshop not found' });
    const maxCap = w.max_attendees || w.max_participants;
    if (maxCap && w.registered_count >= maxCap) return res.status(400).json({ error: 'Workshop is full' });
    await db.from('workshop_registrations').upsert({ user_id: req.user!.sub, workshop_id: req.params.id });
    await db.from('workshops').update({ registered_count: (w.registered_count || 0) + 1 }).eq('id', req.params.id);
    res.json({ message: 'Registered successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
