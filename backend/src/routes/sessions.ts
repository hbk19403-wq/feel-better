import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { RATE_PER_MINUTE } from '../services/billingService';
import QRCode from 'qrcode';
import { MERCHANT_VPA, MERCHANT_NAME } from '../config/plans';

function newSettleRef(): string {
  return `LS${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
}

const router = Router();

function generateAlias(): string {
  const adj = ['Brave', 'Gentle', 'Calm', 'Kind', 'Warm', 'Bold', 'Soft', 'Clear'];
  const noun = ['River', 'Sky', 'Star', 'Moon', 'Wind', 'Leaf', 'Stone', 'Wave'];
  return `${adj[Math.floor(Math.random() * adj.length)]}${noun[Math.floor(Math.random() * noun.length)]}`;
}

const requestSchema = z.object({
  category: z.string().optional(),
  category_id: z.string().optional(),
  session_type: z.enum(['voice', 'text', 'scheduled']).default('voice'),
  listener_id: z.string().uuid().optional(),
  preferred_language: z.string().optional(),
  mood_before: z.number().int().min(1).max(5).optional(),
});

router.post('/request', requireAuth, async (req: Request, res: Response) => {
  try {
    const parse = requestSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.issues });

    const { session_type, listener_id, mood_before } = parse.data;
    const category_id = parse.data.category_id || parse.data.category || 'venting_general';
    const db = getDb();

    // Caller-initiated sessions always enter the queue as `pending` so that any
    // online listener can see and claim them from the console. A chosen
    // listener_id is recorded as a *preference* only — the session is not made
    // active (and the timer/transcript don't really start) until a human
    // listener actually claims it. Hard-assigning an active session here meant
    // it never showed up in any listener's queue, so nobody ever replied.
    const { data: session, error } = await db.from('sessions').insert({
      user_id: req.user!.sub,
      category_id,
      session_type,
      status: 'pending',
      user_alias: generateAlias(),
      listener_id: listener_id || null,
      mood_before: mood_before || null,
      started_at: null,
    }).select().single();

    if (error || !session) return res.status(500).json({ error: error?.message });

    // Fetch with listener name
    const { data: full } = await db.from('sessions')
      .select('*, listeners(alias, display_name), support_categories(name)')
      .eq('id', session.id)
      .single();

    const enriched = {
      ...(full || session),
      listener_name: (full as any)?.listeners?.display_name || (full as any)?.listeners?.alias,
      category_name: (full as any)?.support_categories?.name,
    };

    res.status(201).json({ session: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', requireAuth, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const { data: sessions } = await getDb()
      .from('sessions')
      .select('*, listeners(alias, display_name), support_categories(name)')
      .eq('user_id', req.user!.sub)
      .order('created_at', { ascending: false })
      .limit(limit);

    const enriched = (sessions || []).map((s: any) => ({
      ...s,
      listener_name: s.listeners?.display_name || s.listeners?.alias,
      category_name: s.support_categories?.name,
    }));

    res.json({ sessions: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data: session } = await getDb()
      .from('sessions')
      .select('*, listeners(alias, display_name, specializations, average_rating), support_categories(name)')
      .eq('id', req.params.id)
      .eq('user_id', req.user!.sub)
      .single();

    if (!session) return res.status(404).json({ error: 'Session not found' });

    res.json({
      session: {
        ...session,
        listener_name: (session as any).listeners?.display_name || (session as any).listeners?.alias,
        category_name: (session as any).support_categories?.name,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/end', requireAuth, async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { data: session } = await db.from('sessions').select('*').eq('id', req.params.id).eq('user_id', req.user!.sub).single();
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status === 'completed') return res.status(400).json({ error: 'Session already ended' });

    // Billing runs only for time actually connected to a human listener — i.e.
    // from started_at (set when the listener claims). A never-claimed session
    // has no started_at, so it's free. Rate: ₹1 per minute, rounded up.
    const connected = !!session.started_at && !!session.listener_id;
    const startedAt = session.started_at ? new Date(session.started_at) : new Date();
    const duration = connected ? Math.floor((Date.now() - startedAt.getTime()) / 1000) : 0;
    const billableMinutes = connected ? Math.ceil(duration / 60) : 0;
    const amountCharged = billableMinutes * RATE_PER_MINUTE;

    await db.from('sessions').update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      duration_seconds: duration,
      amount_charged: amountCharged,
    }).eq('id', req.params.id);

    if (amountCharged > 0) {
      // Best-effort usage record; ignore if the billing table isn't present.
      await db.from('billing_usage').insert({
        user_id: req.user!.sub,
        session_id: req.params.id,
        session_kind: 'live_listener',
        minutes_used: billableMinutes,
        amount_charged: amountCharged,
        status: 'pending',
      }).then(() => {}, () => {});
    }

    if (session.listener_id) {
      await db.rpc('decrement_listener_sessions', { listener_id: session.listener_id }).then(() => {}, () => {});
    }

    const { data: updated } = await db.from('sessions').select('*').eq('id', req.params.id).single();
    res.json({ session: updated, billing: { minutes: billableMinutes, amount_inr: amountCharged, currency: 'INR', rate_per_minute: RATE_PER_MINUTE } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create a UPI order to settle the amount owed on an ended live session.
router.post('/:id/settle', requireAuth, async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { data: session } = await db.from('sessions').select('id, amount_charged').eq('id', req.params.id).eq('user_id', req.user!.sub).single();
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const amount = Math.round(Number(session.amount_charged) || 0);
    if (amount <= 0) return res.json({ nothing_due: true });

    const txnRef = newSettleRef();
    await db.from('payments').insert({
      user_id: req.user!.sub,
      kind: 'session_settle',
      plan: null,
      amount_inr: amount,
      currency: 'INR',
      payee_vpa: MERCHANT_VPA,
      txn_ref: txnRef,
      status: 'created',
    }).then(() => {}, () => {});

    const params = new URLSearchParams({
      pa: MERCHANT_VPA, pn: MERCHANT_NAME, am: String(amount), cu: 'INR',
      tn: '1800FeelBetter listener session', tr: txnRef,
    });
    const upiUri = `upi://pay?${params.toString()}`;
    const qrDataUrl = await QRCode.toDataURL(upiUri, { margin: 1, width: 320 });

    res.status(201).json({ txn_ref: txnRef, amount_inr: amount, currency: 'INR', payee_vpa: MERCHANT_VPA, upi_uri: upiUri, qr_data_url: qrDataUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Confirm the settle payment (UTR) and mark the session's usage as paid.
router.post('/:id/settle-confirm', requireAuth, async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const txnRef = String(req.body?.txn_ref || '');
    const upiTxnId = String(req.body?.upi_txn_id || '').trim();
    if (upiTxnId.length < 6) return res.status(400).json({ error: 'Enter the UPI reference / UTR from your payment app' });

    const { data: session } = await db.from('sessions').select('id').eq('id', req.params.id).eq('user_id', req.user!.sub).single();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (txnRef) {
      await db.from('payments').update({ upi_txn_id: upiTxnId, status: 'submitted', updated_at: new Date().toISOString() })
        .eq('txn_ref', txnRef).eq('user_id', req.user!.sub).then(() => {}, () => {});
    }
    await db.from('billing_usage').update({ status: 'paid' }).eq('session_id', req.params.id).then(() => {}, () => {});

    res.json({ settled: true, message: 'Payment recorded. Thank you!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

function isMissingTable(err: any): boolean {
  const m = `${err?.message || err?.code || ''}`.toLowerCase();
  return m.includes('does not exist') || err?.code === '42p01' || m.includes('could not find the table');
}

// Caller posts a message into their live session transcript.
router.post('/:id/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const content = (req.body?.content || '').toString().trim();
    if (!content) return res.status(400).json({ error: 'content required' });
    const db = getDb();
    const { data: session } = await db.from('sessions').select('id').eq('id', req.params.id).eq('user_id', req.user!.sub).single();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const { data, error } = await db
      .from('session_messages')
      .insert({ session_id: req.params.id, sender: 'caller', content: content.slice(0, 4000) })
      .select()
      .single();
    if (error) {
      if (isMissingTable(error)) return res.status(503).json({ error: 'Transcript storage not set up. Apply migration 002_listener_console.sql.' });
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json({ message: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Caller reads their session transcript (poll for listener replies).
router.get('/:id/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { data: session } = await db.from('sessions').select('id').eq('id', req.params.id).eq('user_id', req.user!.sub).single();
    if (!session) return res.status(404).json({ error: 'Session not found' });
    try {
      const { data, error } = await db
        .from('session_messages')
        .select('id, sender, content, created_at')
        .eq('session_id', req.params.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      res.json({ messages: data || [] });
    } catch (e) {
      if (isMissingTable(e)) return res.json({ messages: [] });
      throw e;
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const reviewSchema = z.object({
  listener_rating: z.number().int().min(1).max(5).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  mood_after: z.number().int().min(1).max(5).optional(),
  session_comment: z.string().max(500).optional(),
  comment: z.string().max(500).optional(),
});

router.post('/:id/review', requireAuth, async (req: Request, res: Response) => {
  try {
    const parse = reviewSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.issues });

    const rating = parse.data.listener_rating || parse.data.rating;
    const { mood_after } = parse.data;
    const comment = parse.data.session_comment || parse.data.comment;
    const db = getDb();

    const { data: session } = await db.from('sessions').select('listener_id').eq('id', req.params.id).eq('user_id', req.user!.sub).single();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    await db.from('sessions').update({ rating: rating || null, mood_after: mood_after || null, rating_comment: comment || null }).eq('id', req.params.id);

    if (session.listener_id && rating) {
      await db.rpc('update_listener_rating', { listener_id: session.listener_id, new_rating: rating });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
