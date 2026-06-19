import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { dbGet, dbRun } from '../config/database';
import { signAccessToken, signRefreshToken, storeRefreshToken, validateRefreshToken, revokeRefreshToken, verifyRefreshToken } from '../services/jwtService';
import { requireAuth } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  preferredLanguage: z.string().optional(),
  is_minor: z.boolean().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function safeUser(u: any) {
  const { password_hash, ...rest } = u;
  return rest;
}

router.post('/register', async (req: Request, res: Response) => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.issues });

    const { email, password, name, is_minor, preferredLanguage } = parse.data;
    const existing = await dbGet('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const user = await dbGet<any>(
      'INSERT INTO users (email, password_hash, name, is_minor, language_preference) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [email, hash, name, is_minor ?? false, preferredLanguage || 'English']
    );

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
    await storeRefreshToken(user.id, refreshToken);

    res.status(201).json({ user: safeUser(user), accessToken, refreshToken });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.issues });

    const { email, password } = parse.data;
    const user = await dbGet<any>('SELECT * FROM users WHERE email = $1', [email]);
    if (!user || !user.password_hash) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
    await storeRefreshToken(user.id, refreshToken);

    res.json({ user: safeUser(user), accessToken, refreshToken });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: 'refresh_token required' });
  try {
    const payload = verifyRefreshToken(refresh_token);
    const valid = await validateRefreshToken(refresh_token);
    if (!valid) return res.status(401).json({ error: 'Refresh token invalid or expired' });
    await revokeRefreshToken(refresh_token);
    const user = await dbGet<any>('SELECT id, role FROM users WHERE id = $1', [payload.sub]);
    if (!user) return res.status(401).json({ error: 'User not found' });
    const newAccess = signAccessToken({ sub: user.id, role: user.role });
    const newRefresh = signRefreshToken({ sub: user.id, role: user.role });
    await storeRefreshToken(user.id, newRefresh);
    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  if (refresh_token) await revokeRefreshToken(refresh_token);
  res.json({ message: 'Logged out' });
});

export default router;
