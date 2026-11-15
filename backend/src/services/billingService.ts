import { getDb } from '../config/database';

// India pricing: ₹1 per minute. Currency is INR throughout.
export const CURRENCY = 'INR';
export const CURRENCY_SYMBOL = '₹';
export const RATE_PER_MINUTE = 1;
export const FREE_VENT_MINUTES = 15;
export const FREE_ADVISORY_MINUTES = 5;

export function calculateCharge(mode: 'vent' | 'advisory', durationSeconds: number) {
  const totalMinutes = Math.ceil(durationSeconds / 60);
  const freeMinutes = mode === 'vent' ? FREE_VENT_MINUTES : FREE_ADVISORY_MINUTES;
  const chargedMinutes = Math.max(0, totalMinutes - freeMinutes);
  // ₹1/min → whole-rupee amounts; no paise.
  const totalCharged = chargedMinutes * RATE_PER_MINUTE;
  return { freeMinutes, chargedMinutes, totalCharged, currency: CURRENCY };
}

export async function recordUsage(
  userId: string,
  sessionId: string,
  sessionKind: string,
  minutesUsed: number,
  amountCharged: number
) {
  await getDb().from('billing_usage').insert({
    user_id: userId,
    session_id: sessionId,
    session_kind: sessionKind,
    minutes_used: minutesUsed,
    amount_charged: amountCharged,
    status: amountCharged > 0 ? 'pending' : 'free',
  });
}
