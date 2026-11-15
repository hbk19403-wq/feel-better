import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

function safeUser(u: any) {
  const { password_hash, ...rest } = u;
  return rest;
}

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data, error } = await getDb().from('users').select('*').eq('id', req.user!.sub).single();
    if (error || !data) return res.status(404).json({ error: 'User not found' });
    res.json(safeUser(data));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  age_segment: z.enum(['16_25', '26_35', '36_50', '51_plus']).optional(),
  profession: z.string().optional(),
  language_preference: z.string().optional(),
  anonymous_mode: z.boolean().optional(),
  consent_analytics: z.boolean().optional(),
  consent_marketing: z.boolean().optional(),
});

router.patch('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const parse = updateSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.issues });
    const fields = parse.data;
    if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'No fields to update' });

    const { data, error } = await getDb()
      .from('users')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', req.user!.sub)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(safeUser(data));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
