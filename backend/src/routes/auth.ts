import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getDb } from '../config/database';
import { signAccessToken, signRefreshToken, storeRefreshToken, validateRefreshToken, revokeRefreshToken, verifyRefreshToken } from '../services/jwtService';
import { isPasswordLeaked } from '../services/passwordSecurity';
import { createPasswordResetToken, consumeResetTokenUserId } from '../services/passwordResetService';
import { sendPasswordResetEmail } from '../services/emailService';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Tight limiter for the reset endpoints to blunt enumeration/brute-force.
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

// Blunt credential brute-force / signup spam without blocking normal use.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});

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

router.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.issues });

    const { email, password, name, is_minor, preferredLanguage } = parse.data;
    const db = getDb();

    const { data: existing } = await db.from('users').select('id').eq('email', email).single();
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    if (await isPasswordLeaked(password)) {
      return res.status(400).json({
        error: 'This password has appeared in a known data breach. Please choose a different one.',
      });
    }

    const hash = await bcrypt.hash(password, 10);
    const { data: user, error } = await db.from('users').insert({
      email, password_hash: hash, name,
      is_minor: is_minor ?? false,
      language_preference: preferredLanguage || 'English',
    }).select().single();

    if (error?.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    if (error || !user) return res.status(500).json({ error: error?.message || 'Failed to create user' });

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
    await storeRefreshToken(user.id, refreshToken);

    res.status(201).json({ user: safeUser(user), accessToken, refreshToken });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.issues });

    const { email, password } = parse.data;
    const db = getDb();

    const { data: user } = await db.from('users').select('*').eq('email', email).single();
    if (!user || !user.password_hash) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
    await storeRefreshToken(user.id, refreshToken);

    res.json({ user: safeUser(user), accessToken, refreshToken });
  } catch (err: any) {
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
    const { data: user } = await getDb().from('users').select('id, role').eq('id', payload.sub).single();
    if (!user) return res.status(401).json({ error: 'User not found' });
    const newAccess = signAccessToken({ sub: user.id, role: user.role });
    const newRefresh = signRefreshToken({ sub: user.id, role: user.role });
    await storeRefreshToken(user.id, newRefresh);
    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

const requestResetSchema = z.object({ email: z.string().email() });
const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

// Always responds 200 with a generic message so it can't be used to enumerate
// which emails are registered.
router.post('/request-password-reset', resetLimiter, async (req: Request, res: Response) => {
  const generic = { message: 'If an account exists for that email, a reset link has been sent.' };
  try {
    const parse = requestResetSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.issues });

    const { email } = parse.data;
    const { data: user } = await getDb().from('users').select('id').eq('email', email).single();

    if (user) {
      const rawToken = await createPasswordResetToken(user.id);
      await sendPasswordResetEmail(email, rawToken);
    }

    return res.json(generic);
  } catch {
    // Never leak internal errors here — keep the response uniform.
    return res.json(generic);
  }
});

router.post('/reset-password', resetLimiter, async (req: Request, res: Response) => {
  try {
    const parse = resetPasswordSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.issues });

    const { token, password } = parse.data;

    if (await isPasswordLeaked(password)) {
      return res.status(400).json({
        error: 'This password has appeared in a known data breach. Please choose a different one.',
      });
    }

    const userId = await consumeResetTokenUserId(token);
    if (!userId) return res.status(400).json({ error: 'Invalid or expired reset token' });

    const hash = await bcrypt.hash(password, 10);
    const { error } = await getDb().from('users').update({ password_hash: hash }).eq('id', userId);
    if (error) return res.status(500).json({ error: error.message });

    // Force re-login everywhere: invalidate all existing refresh tokens.
    await getDb().from('refresh_tokens').delete().eq('user_id', userId);

    return res.json({ message: 'Password updated. Please sign in with your new password.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  if (refresh_token) await revokeRefreshToken(refresh_token);
  res.json({ message: 'Logged out' });
});

export default router;
