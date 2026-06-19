import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { dbGet, dbRun } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

function safeUser(u: any) {
  const { password_hash, ...rest } = u;
  return { ...rest, anonymous_mode: !!rest.anonymous_mode, is_minor: !!rest.is_minor };
}

router.get('/me', requireAuth, (req: Request, res: Response) => {
  const user = dbGet<any>('SELECT * FROM users WHERE id = ?', [req.user!.sub]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(safeUser(user));
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

router.patch('/me', requireAuth, (req: Request, res: Response) => {
  const parse = updateSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.issues });

  const fields = parse.data;
  const keys = Object.keys(fields) as (keyof typeof fields)[];
  if (keys.length === 0) return res.status(400).json({ error: 'No fields to update' });

  const setClauses = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => {
    const v = fields[k];
    return typeof v === 'boolean' ? (v ? 1 : 0) : v;
  });

  dbRun(`UPDATE users SET ${setClauses}, updated_at = datetime('now') WHERE id = ?`, [...values, req.user!.sub]);
  const user = dbGet<any>('SELECT * FROM users WHERE id = ?', [req.user!.sub]);
  res.json(safeUser(user!));
});

export default router;
