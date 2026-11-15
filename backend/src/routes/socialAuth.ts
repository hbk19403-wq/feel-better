import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { getDb } from '../config/database';
import { signAccessToken, signRefreshToken, storeRefreshToken } from '../services/jwtService';
import { sendOtpSms } from '../services/smsService';

const router = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '';
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';

function safeUser(u: any) {
  const { password_hash, ...rest } = u;
  return rest;
}

// Issues our app's access + refresh tokens for a user row.
async function issueSession(user: any) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
  await storeRefreshToken(user.id, refreshToken);
  return { user: safeUser(user), accessToken, refreshToken };
}

// Finds an existing user by email or creates one. Links social logins to an
// existing email account (so a password user who later "Sign in with Google"
// lands on the same account rather than a duplicate).
async function upsertByEmail(opts: { email: string; name?: string; provider: string; avatar_url?: string; email_verified?: boolean }) {
  const db = getDb();
  const email = opts.email.toLowerCase().trim();
  const { data: existing } = await db.from('users').select('*').eq('email', email).maybeSingle();
  if (existing) {
    // Backfill avatar / verification without clobbering an existing password login.
    const patch: Record<string, any> = {};
    if (opts.avatar_url && !existing.avatar_url) patch.avatar_url = opts.avatar_url;
    if (opts.email_verified && !existing.email_verified) patch.email_verified = true;
    if (Object.keys(patch).length) await db.from('users').update(patch).eq('id', existing.id);
    return { ...existing, ...patch };
  }
  const { data: created, error } = await db.from('users').insert({
    email,
    name: opts.name || email.split('@')[0],
    auth_provider: opts.provider,
    avatar_url: opts.avatar_url || null,
    email_verified: opts.email_verified ?? true,
    language_preference: 'English',
  }).select().single();
  if (error || !created) throw new Error(error?.message || 'Could not create account');
  return created;
}

// --- Google -----------------------------------------------------------------
router.post('/google', async (req: Request, res: Response) => {
  try {
    if (!GOOGLE_CLIENT_ID) return res.status(503).json({ error: 'Google sign-in is not configured yet.' });
    const idToken = (req.body?.id_token || req.body?.credential || '').toString();
    if (!idToken) return res.status(400).json({ error: 'id_token required' });

    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email) return res.status(401).json({ error: 'Google account has no email' });

    const user = await upsertByEmail({
      email: payload.email,
      name: payload.name,
      provider: 'google',
      avatar_url: payload.picture,
      email_verified: payload.email_verified,
    });
    res.json(await issueSession(user));
  } catch (err: any) {
    res.status(401).json({ error: 'Could not verify Google sign-in' });
  }
});

// --- Facebook ---------------------------------------------------------------
router.post('/facebook', async (req: Request, res: Response) => {
  try {
    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) return res.status(503).json({ error: 'Facebook sign-in is not configured yet.' });
    const accessToken = (req.body?.access_token || '').toString();
    if (!accessToken) return res.status(400).json({ error: 'access_token required' });

    // Verify the token was issued for *our* app before trusting it.
    const appToken = `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`;
    const dbg = await fetch(`https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appToken)}`);
    const dbgData: any = await dbg.json();
    if (!dbgData?.data?.is_valid || dbgData.data.app_id !== FACEBOOK_APP_ID) {
      return res.status(401).json({ error: 'Invalid Facebook token' });
    }

    const meRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${encodeURIComponent(accessToken)}`);
    const me: any = await meRes.json();
    if (!me?.email) return res.status(400).json({ error: 'Your Facebook account has no shared email. Please use another sign-in method.' });

    const user = await upsertByEmail({
      email: me.email,
      name: me.name,
      provider: 'facebook',
      avatar_url: me.picture?.data?.url,
      email_verified: true,
    });
    res.json(await issueSession(user));
  } catch (err: any) {
    res.status(401).json({ error: 'Could not verify Facebook sign-in' });
  }
});

// --- Phone OTP --------------------------------------------------------------
function normalisePhone(raw: string): string | null {
  const t = raw.replace(/[^\d+]/g, '');
  // Accept 10-digit Indian numbers or E.164 (+CC…). Default to +91 for 10-digit.
  if (/^\d{10}$/.test(t)) return `+91${t}`;
  if (/^\+\d{8,15}$/.test(t)) return t;
  return null;
}

router.post('/otp/request', async (req: Request, res: Response) => {
  try {
    const phone = normalisePhone((req.body?.phone || '').toString());
    if (!phone) return res.status(400).json({ error: 'Enter a valid mobile number' });
    const db = getDb();

    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
    const codeHash = await bcrypt.hash(code, 10);
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    await db.from('otp_codes').insert({ phone, code_hash: codeHash, purpose: 'login', expires_at: expires.toISOString() });

    const sent = await sendOtpSms(phone, code);
    if (!sent.ok) return res.status(503).json({ error: sent.error || 'SMS service not configured yet.' });
    res.json({ ok: true, phone, expires_at: expires.toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/otp/verify', async (req: Request, res: Response) => {
  try {
    const phone = normalisePhone((req.body?.phone || '').toString());
    const code = (req.body?.code || '').toString().trim();
    if (!phone || !/^\d{6}$/.test(code)) return res.status(400).json({ error: 'Enter the 6-digit code' });
    const db = getDb();

    const { data: rec } = await db
      .from('otp_codes')
      .select('*')
      .eq('phone', phone)
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!rec) return res.status(400).json({ error: 'Request a new code' });
    if (new Date(rec.expires_at).getTime() < Date.now()) return res.status(400).json({ error: 'Code expired. Request a new one.' });
    if (rec.attempts >= 5) return res.status(429).json({ error: 'Too many attempts. Request a new code.' });

    const valid = await bcrypt.compare(code, rec.code_hash);
    if (!valid) {
      await db.from('otp_codes').update({ attempts: rec.attempts + 1 }).eq('id', rec.id);
      return res.status(401).json({ error: 'Incorrect code' });
    }
    await db.from('otp_codes').update({ consumed_at: new Date().toISOString() }).eq('id', rec.id);

    // Find or create the user by phone.
    let { data: user } = await db.from('users').select('*').eq('phone', phone).maybeSingle();
    if (!user) {
      const { data: created, error } = await db.from('users').insert({
        phone, name: `User ${phone.slice(-4)}`, auth_provider: 'phone', language_preference: 'English',
      }).select().single();
      if (error || !created) return res.status(500).json({ error: error?.message || 'Could not create account' });
      user = created;
    }
    res.json(await issueSession(user));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
