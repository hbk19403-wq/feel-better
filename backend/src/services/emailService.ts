import https from 'https';

/**
 * Email delivery.
 *
 * Uses Resend's REST API (https://resend.com) when RESEND_API_KEY is configured
 * — called directly over https so no SDK dependency is required. When no key is
 * set (e.g. local dev) it logs the reset link instead.
 *
 * This function NEVER throws: a delivery failure must not turn into a
 * user-enumeration signal on the password-reset endpoint.
 *
 * Required env when using Resend:
 *   RESEND_API_KEY   your Resend API key
 *   EMAIL_FROM       verified sender, e.g. "1800-FeelBetter <noreply@yourdomain.com>"
 *   WEB_APP_URL      public URL of the web app (for the reset link)
 */
export async function sendPasswordResetEmail(email: string, rawToken: string): Promise<void> {
  const base = process.env.WEB_APP_URL || 'http://localhost:5173';
  const resetLink = `${base}/reset-password?token=${rawToken}`;
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[emailService] (no RESEND_API_KEY) Password reset link for ${email}: ${resetLink}`);
    return;
  }

  const from = process.env.EMAIL_FROM || '1800-FeelBetter <onboarding@resend.dev>';
  const html =
    `<p>We received a request to reset your 1800-FeelBetter password.</p>` +
    `<p><a href="${resetLink}">Click here to choose a new password</a>. ` +
    `This link expires in 1 hour.</p>` +
    `<p>If you didn't request this, you can safely ignore this email.</p>`;

  try {
    await postJson(
      'https://api.resend.com/emails',
      { from, to: [email], subject: 'Reset your 1800-FeelBetter password', html },
      apiKey
    );
  } catch (err: any) {
    // Log and swallow — keep the reset endpoint's response uniform.
    console.error(`[emailService] Failed to send reset email to ${email}: ${err?.message || err}`);
  }
}

function postJson(url: string, body: unknown, apiKey: string): Promise<void> {
  const payload = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 5000,
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) resolve();
          else reject(new Error(`Resend responded ${res.statusCode}: ${data}`));
        });
      }
    );
    req.on('timeout', () => req.destroy(new Error('Resend request timed out')));
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}
