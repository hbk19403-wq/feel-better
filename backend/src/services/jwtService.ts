import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JwtPayload } from '../types';
import { dbGet, dbRun } from '../config/database';

const ACCESS_SECRET = process.env.JWT_SECRET || 'dev-access-secret-change-in-prod';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-prod';

export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
}

export function signRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '30d' });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}

export async function storeRefreshToken(userId: string, token: string): Promise<void> {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await dbRun(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)',
    [userId, hash, expiresAt]
  );
}

export async function validateRefreshToken(token: string): Promise<boolean> {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const row = await dbGet(
    'SELECT id FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW()',
    [hash]
  );
  return !!row;
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  await dbRun('DELETE FROM refresh_tokens WHERE token_hash = $1', [hash]);
}
