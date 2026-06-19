import { Router, Request, Response } from 'express';
import { dbAll, dbGet } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { category, type, search } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    if (category) { conditions.push(`category_id = $${i++}`); params.push(category); }
    if (type) { conditions.push(`type = $${i++}`); params.push(type); }
    if (search) { conditions.push(`title ILIKE $${i++}`); params.push(`%${search}%`); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const resources = await dbAll(`SELECT * FROM resources ${where} ORDER BY created_at DESC LIMIT 50`, params);
    res.json({ resources });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const r = await dbGet('SELECT * FROM resources WHERE id = $1', [req.params.id]);
    if (!r) return res.status(404).json({ error: 'Resource not found' });
    res.json(r);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
