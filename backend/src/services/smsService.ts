// Pluggable OTP SMS sender. Supports MSG91 (India-first, DLT-ready) or Twilio.
// Returns a soft result instead of throwing so the auth route can respond 503
// with a clear "not configured" message until credentials are supplied.

interface SmsResult {
  ok: boolean;
  error?: string;
}

const PROVIDER = (process.env.SMS_PROVIDER || '').toLowerCase(); // 'msg91' | 'twilio' | ''

export async function sendOtpSms(phone: string, code: string): Promise<SmsResult> {
  try {
    if (PROVIDER === 'msg91') return await sendViaMsg91(phone, code);
    if (PROVIDER === 'twilio') return await sendViaTwilio(phone, code);
    // Dev / not-yet-configured: surface the code in server logs so the flow is
    // testable before an SMS provider is wired up. Never do this in production.
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[otp:dev] ${phone} -> ${code}`);
      return { ok: true };
    }
    return { ok: false, error: 'SMS provider not configured' };
  } catch (err: any) {
    console.error('[sms] send failed:', err?.message || err);
    return { ok: false, error: 'Could not send the code. Please try again.' };
  }
}

// MSG91 OTP/flow API. Requires an approved DLT template in India.
async function sendViaMsg91(phone: string, code: string): Promise<SmsResult> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  const sender = process.env.MSG91_SENDER_ID || 'FEELBT';
  if (!authKey || !templateId) return { ok: false, error: 'MSG91 not fully configured' };

  const to = phone.replace('+', '');
  const res = await fetch('https://control.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authkey: authKey },
    body: JSON.stringify({
      template_id: templateId,
      sender,
      short_url: '0',
      recipients: [{ mobiles: to, otp: code }],
    }),
  });
  if (!res.ok) return { ok: false, error: 'MSG91 send failed' };
  return { ok: true };
}

// Twilio SMS fallback.
async function sendViaTwilio(phone: string, code: string): Promise<SmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_SMS_FROM;
  if (!sid || !token || !from) return { ok: false, error: 'Twilio not fully configured' };

  const body = new URLSearchParams({ To: phone, From: from, Body: `Your 1800 FeelBetter code is ${code}. It expires in 5 minutes.` });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}` },
    body: body.toString(),
  });
  if (!res.ok) return { ok: false, error: 'Twilio send failed' };
  return { ok: true };
}
