import { Router, Request, Response } from 'express';
import { getDb } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    let query = getDb().from('resources').select('*').order('created_at', { ascending: false }).limit(50);
    if (req.query.category) query = query.eq('category_id', req.query.category);
    if (req.query.type) query = query.eq('type', req.query.type);
    const { data: resources } = await query;
    res.json({ resources: resources || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data, error } = await getDb().from('resources').select('*').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: 'Resource not found' });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
