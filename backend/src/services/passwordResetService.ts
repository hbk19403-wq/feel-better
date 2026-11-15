import crypto from 'crypto';
import { getDb } from '../config/database';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Creates a single-use password-reset token for a user. Returns the RAW token
 * (to be emailed to the user); only its SHA-256 hash is persisted, mirroring how
 * refresh tokens are stored.
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
  await getDb().from('password_reset_tokens').insert({
    user_id: userId,
    token_hash: hashToken(rawToken),
    expires_at: expiresAt,
  });
  return rawToken;
}

/**
 * Validates a raw reset token. Returns the owning user_id if the token exists,
 * is unexpired, and hasn't been used; otherwise null.
 */
export async function consumeResetTokenUserId(rawToken: string): Promise<string | null> {
  const { data } = await getDb()
    .from('password_reset_tokens')
    .select('id, user_id')
    .eq('token_hash', hashToken(rawToken))
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!data) return null;

  // Mark used immediately so the token can't be replayed.
  await getDb()
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', data.id);

  return data.user_id;
}
