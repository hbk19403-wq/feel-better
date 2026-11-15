import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { pwnedPasswordCount, isPasswordLeaked } from './passwordSecurity';

function sha1Upper(pw: string): string {
  return crypto.createHash('sha1').update(pw).digest('hex').toUpperCase();
}

test('requests the correct 5-char prefix and returns the breach count for a match', async () => {
  const pw = 'password';
  const full = sha1Upper(pw);
  const suffix = full.slice(5);
  let requestedPrefix = '';

  const count = await pwnedPasswordCount(pw, async (prefix) => {
    requestedPrefix = prefix;
    // HIBP returns SUFFIX:COUNT lines (CRLF-terminated), prefix stripped.
    return `00000000000000000000000000000000000:7\r\n${suffix}:24230577\r\n`;
  });

  assert.equal(requestedPrefix, full.slice(0, 5));
  assert.equal(count, 24230577);
});

test('isPasswordLeaked is true when the suffix appears in the range', async () => {
  const suffix = sha1Upper('password').slice(5);
  const leaked = await isPasswordLeaked('password', async () => `${suffix}:1`);
  assert.equal(leaked, true);
});

test('returns 0 when the suffix is not present in the range', async () => {
  const count = await pwnedPasswordCount('a-very-unlikely-passphrase', async () =>
    'DEADBEEFDEADBEEFDEADBEEFDEADBEEFDEAD:3\r\nCAFEBABECAFEBABECAFEBABECAFEBABECAFE:9'
  );
  assert.equal(count, 0);
});

test('fails open (returns 0) when the HIBP request errors', async () => {
  const count = await pwnedPasswordCount('password', async () => {
    throw new Error('network down');
  });
  assert.equal(count, 0);
});
