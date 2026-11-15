import crypto from 'crypto';
import https from 'https';

/**
 * Fetches one k-anonymity range ("first 5 hash chars") from the HaveIBeenPwned
 * Pwned Passwords API. Injectable so tests don't hit the network.
 */
export type RangeFetcher = (prefix: string) => Promise<string>;

/**
 * Checks a password against the HaveIBeenPwned "Pwned Passwords" range API using
 * k-anonymity: the password is SHA-1 hashed locally and only the first 5 hex
 * chars of that hash ever leave this server. Returns the number of breaches the
 * password appears in (0 = not found).
 *
 * Fails OPEN (returns 0) on any network/API error so that an HIBP outage can
 * never block legitimate sign-ups. No API key required.
 */
export async function pwnedPasswordCount(
  password: string,
  fetchRange: RangeFetcher = fetchHibpRange
): Promise<number> {
  const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  try {
    const body = await fetchRange(prefix);
    for (const line of body.split('\n')) {
      const [hashSuffix, count] = line.trim().split(':');
      if (hashSuffix === suffix) return parseInt(count, 10) || 0;
    }
    return 0;
  } catch {
    return 0; // fail open — never block sign-up on an HIBP outage
  }
}

export async function isPasswordLeaked(
  password: string,
  fetchRange: RangeFetcher = fetchHibpRange
): Promise<boolean> {
  return (await pwnedPasswordCount(password, fetchRange)) > 0;
}

const fetchHibpRange: RangeFetcher = (prefix) =>
  httpsGet(`https://api.pwnedpasswords.com/range/${prefix}`);

function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        // Add-Padding makes every response a uniform size to defeat traffic analysis.
        headers: { 'Add-Padding': 'true', 'User-Agent': '1800-feelbetter-backend' },
        timeout: 3000,
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HIBP responded ${res.statusCode}`));
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      }
    );
    req.on('timeout', () => req.destroy(new Error('HIBP request timed out')));
    req.on('error', reject);
  });
}
