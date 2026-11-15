import { Router, Request, Response } from 'express';
import QRCode from 'qrcode';
import { getDb } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { PLANS, PAYABLE_PLAN_IDS, getPlan, MERCHANT_VPA, MERCHANT_NAME } from '../config/plans';

const router = Router();

// Build a standard UPI deep link (works with GPay / PhonePe / Paytm / any UPI app).
function buildUpiUri(amountInr: number, txnRef: string, note: string): string {
  const params = new URLSearchParams({
    pa: MERCHANT_VPA,
    pn: MERCHANT_NAME,
    am: String(amountInr),
    cu: 'INR',
    tn: note,
    tr: txnRef,
  });
  return `upi://pay?${params.toString()}`;
}

function newTxnRef(): string {
  return `FB${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
}

// Public: list plans so the pricing/plans page can render them.
router.get('/plans', (_req: Request, res: Response) => {
  res.json({ plans: PLANS, currency: 'INR' });
});

// Current user's plan + status.
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data } = await getDb()
      .from('users')
      .select('subscription_plan, subscription_status, plan_started_at, plan_expires_at')
      .eq('id', req.user!.sub)
      .single();
    const planId = data?.subscription_plan ?? 'free';
    const plan = getPlan(planId) || getPlan('free')!;
    res.json({
      plan: planId,
      plan_name: plan.name,
      status: data?.subscription_status ?? 'active',
      included_minutes: plan.included_minutes,
      started_at: data?.plan_started_at ?? null,
      expires_at: data?.plan_expires_at ?? null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create a UPI payment order for a paid plan. Returns a UPI deep link + QR image.
router.post('/checkout', requireAuth, async (req: Request, res: Response) => {
  try {
    const plan = String(req.body?.plan || '');
    if (!PAYABLE_PLAN_IDS.includes(plan)) return res.status(400).json({ error: 'Invalid plan' });
    const planDef = getPlan(plan)!;
    const txnRef = newTxnRef();
    const note = `1800FeelBetter ${planDef.name} plan`;

    const { error } = await getDb().from('payments').insert({
      user_id: req.user!.sub,
      kind: 'subscription',
      plan,
      amount_inr: planDef.price_inr,
      currency: 'INR',
      payee_vpa: MERCHANT_VPA,
      txn_ref: txnRef,
      status: 'created',
    });
    if (error) return res.status(500).json({ error: error.message });

    const upiUri = buildUpiUri(planDef.price_inr, txnRef, note);
    const qrDataUrl = await QRCode.toDataURL(upiUri, { margin: 1, width: 320 });

    res.status(201).json({
      txn_ref: txnRef,
      plan,
      plan_name: planDef.name,
      amount_inr: planDef.price_inr,
      currency: 'INR',
      payee_vpa: MERCHANT_VPA,
      payee_name: MERCHANT_NAME,
      upi_uri: upiUri,
      qr_data_url: qrDataUrl,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Payer submits their UPI transaction reference (UTR) after paying. We record it
// and activate the plan for 30 days. Verification against the bank is manual /
// out of band for now — the UTR gives an audit trail to reconcile against.
router.post('/confirm', requireAuth, async (req: Request, res: Response) => {
  try {
    const txnRef = String(req.body?.txn_ref || '');
    const upiTxnId = String(req.body?.upi_txn_id || '').trim();
    if (!txnRef) return res.status(400).json({ error: 'txn_ref required' });
    if (upiTxnId.length < 6) return res.status(400).json({ error: 'Enter the UPI reference / UTR number from your payment app' });
    const db = getDb();

    const { data: payment } = await db
      .from('payments')
      .select('*')
      .eq('txn_ref', txnRef)
      .eq('user_id', req.user!.sub)
      .single();
    if (!payment) return res.status(404).json({ error: 'Payment order not found' });
    if (payment.status === 'submitted' || payment.status === 'verified') {
      return res.status(409).json({ error: 'This payment was already submitted' });
    }

    await db.from('payments').update({
      upi_txn_id: upiTxnId,
      status: 'submitted',
      updated_at: new Date().toISOString(),
    }).eq('id', payment.id);

    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await db.from('users').update({
      subscription_plan: payment.plan,
      subscription_status: 'active',
      plan_started_at: now.toISOString(),
      plan_expires_at: expires.toISOString(),
      updated_at: now.toISOString(),
    }).eq('id', req.user!.sub);

    const planDef = getPlan(payment.plan)!;
    res.json({
      plan: payment.plan,
      plan_name: planDef.name,
      status: 'active',
      expires_at: expires.toISOString(),
      message: `${planDef.name} plan activated. Thank you!`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Payment history for the account.
router.get('/payments', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data } = await getDb()
      .from('payments')
      .select('txn_ref, plan, amount_inr, currency, status, upi_txn_id, created_at')
      .eq('user_id', req.user!.sub)
      .order('created_at', { ascending: false })
      .limit(50);
    res.json({ payments: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    await getDb().from('users').update({
      subscription_plan: 'free',
      subscription_status: 'active',
      plan_expires_at: null,
      updated_at: new Date().toISOString(),
    }).eq('id', req.user!.sub);
    res.json({ message: 'Subscription cancelled. Moved to the free pay-as-you-go plan.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
