import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface Plan {
  id: string;
  name: string;
  price_inr: number;
  included_minutes: number;
  tagline: string;
  features: string[];
  highlight?: boolean;
}

interface Me {
  plan: string;
  plan_name: string;
  status: string;
  expires_at: string | null;
}

interface Order {
  txn_ref: string;
  plan: string;
  plan_name: string;
  amount_inr: number;
  payee_vpa: string;
  payee_name: string;
  upi_uri: string;
  qr_data_url: string;
}

const GRADS: Record<string, string> = {
  free: 'linear-gradient(135deg,#64748B,#475569)',
  basic: 'linear-gradient(135deg,#2E75B6,#1A3C5E)',
  standard: 'linear-gradient(135deg,#17A589,#0e7a5f)',
  premium: 'linear-gradient(135deg,#8B5CF6,#6D28D9)',
};

export default function Plans() {
  const { authFetch } = useAuth();
  const jsonHeaders = { 'Content-Type': 'application/json' };

  const [plans, setPlans] = useState<Plan[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [order, setOrder] = useState<Order | null>(null);
  const [checkingOut, setCheckingOut] = useState('');
  const [utr, setUtr] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState('');
  const [copied, setCopied] = useState(false);

  async function safeJson(res: Response) {
    const t = await res.text();
    try { return t ? JSON.parse(t) : {}; } catch { return {}; }
  }

  async function load() {
    setLoading(true);
    try {
      const [pr, mr] = await Promise.all([
        authFetch('/subscriptions/plans'),
        authFetch('/subscriptions/me'),
      ]);
      const pd = await safeJson(pr);
      const md = await safeJson(mr);
      setPlans(Array.isArray(pd.plans) ? pd.plans : []);
      if (mr.ok) setMe(md);
    } catch {
      setError('Could not load plans. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function checkout(planId: string) {
    setCheckingOut(planId);
    setError('');
    try {
      const res = await authFetch('/subscriptions/checkout', {
        method: 'POST', headers: jsonHeaders, body: JSON.stringify({ plan: planId }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || 'Could not start checkout');
      setOrder(data);
      setUtr('');
    } catch (err: any) {
      setError(err.message || 'Could not start checkout');
    } finally {
      setCheckingOut('');
    }
  }

  async function confirm() {
    if (!order) return;
    setConfirming(true);
    setError('');
    try {
      const res = await authFetch('/subscriptions/confirm', {
        method: 'POST', headers: jsonHeaders,
        body: JSON.stringify({ txn_ref: order.txn_ref, upi_txn_id: utr.trim() }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || 'Could not confirm payment');
      setDone(data.message || 'Plan activated!');
      setOrder(null);
      await load();
    } catch (err: any) {
      setError(err.message || 'Could not confirm payment');
    } finally {
      setConfirming(false);
    }
  }

  async function cancelPlan() {
    setError('');
    try {
      const res = await authFetch('/subscriptions/cancel', { method: 'POST', headers: jsonHeaders });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || 'Could not cancel');
      setDone(data.message || 'Moved to free plan.');
      await load();
    } catch (err: any) {
      setError(err.message || 'Could not cancel');
    }
  }

  return (
    <div className="fade-in">
      {/* Hero */}
      <div className="anim-gradient" style={{ background: 'linear-gradient(120deg,#1A3C5E,#2E75B6,#17A589)', borderRadius: 24, padding: '36px 40px', marginBottom: 28, color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -28, right: -8, fontSize: 150, opacity: 0.13, animation: 'float 6s ease-in-out infinite' }}>⭐</div>
        <div style={{ position: 'relative' }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.85 }}>Plans & Pricing</span>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '10px 0 8px' }}>Support that fits your budget</h1>
          <p style={{ fontSize: 16, opacity: 0.92, maxWidth: 560, lineHeight: 1.5 }}>
            Always pay-as-you-go at just <strong>₹1/min</strong> — or subscribe for bundled minutes &amp; perks. Pay securely over <strong>UPI</strong>.
          </p>
          {me && (
            <div style={{ marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.18)', borderRadius: 999, padding: '8px 16px', fontSize: 14, fontWeight: 600 }}>
              Current plan: {me.plan_name}
              {me.expires_at && <span style={{ opacity: 0.85, fontWeight: 500 }}>· renews {new Date(me.expires_at).toLocaleDateString('en-IN')}</span>}
            </div>
          )}
        </div>
      </div>

      {done && <div style={{ background: 'var(--accent-light)', color: '#065F46', padding: 14, borderRadius: 12, marginBottom: 16, fontSize: 14, fontWeight: 600 }}>✅ {done}</div>}
      {error && <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: 14, borderRadius: 12, marginBottom: 16, fontSize: 14 }}>{error}</div>}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="card" style={{ height: 360, background: 'var(--surface-hover)' }} />)}
        </div>
      ) : (
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {plans.map(p => {
            const isCurrent = me?.plan === p.id;
            const grad = GRADS[p.id] || GRADS.basic;
            return (
              <div key={p.id} style={{
                borderRadius: 20, overflow: 'hidden', background: 'white', boxShadow: 'var(--shadow)',
                display: 'flex', flexDirection: 'column', position: 'relative',
                border: p.highlight ? '2px solid var(--accent)' : '1px solid var(--border)',
              }}>
                {p.highlight && (
                  <div style={{ position: 'absolute', top: 14, right: -30, background: 'var(--accent)', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 36px', transform: 'rotate(45deg)', letterSpacing: 0.5 }}>POPULAR</div>
                )}
                <div style={{ background: grad, padding: '22px 20px', color: 'white' }}>
                  <p style={{ fontSize: 13, opacity: 0.9, fontWeight: 600 }}>{p.name}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '6px 0 2px' }}>
                    <span style={{ fontSize: 34, fontWeight: 800 }}>₹{p.price_inr}</span>
                    <span style={{ fontSize: 14, opacity: 0.85 }}>{p.price_inr > 0 ? '/mo' : ''}</span>
                  </div>
                  <p style={{ fontSize: 12.5, opacity: 0.85 }}>{p.tagline}</p>
                </div>
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    {p.features.map(f => (
                      <li key={f} style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 8, lineHeight: 1.4 }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <button className="btn btn-outline btn-full" disabled style={{ marginTop: 8 }}>Current plan</button>
                  ) : p.price_inr === 0 ? (
                    me && me.plan !== 'free' ? (
                      <button className="btn btn-ghost btn-full" style={{ marginTop: 8 }} onClick={cancelPlan}>Downgrade to Free</button>
                    ) : (
                      <button className="btn btn-outline btn-full" disabled style={{ marginTop: 8 }}>Included</button>
                    )
                  ) : (
                    <button
                      className="btn btn-full"
                      style={{ marginTop: 8, background: grad, color: 'white', border: 'none' }}
                      disabled={!!checkingOut}
                      onClick={() => checkout(p.id)}
                    >
                      {checkingOut === p.id ? <span className="spinner" /> : `Pay ₹${p.price_inr} via UPI`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* UPI payment modal */}
      {order && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card fade-in" style={{ maxWidth: 420, width: '100%', padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Pay ₹{order.amount_inr} for {order.plan_name}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Scan the QR with any UPI app, or tap to open it.</p>
              <img src={order.qr_data_url} alt="UPI QR code" style={{ width: 220, height: 220, borderRadius: 12, border: '1px solid var(--border)' }} />
              <div style={{ margin: '14px 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                Paying to <strong style={{ color: 'var(--text-primary)' }}>{order.payee_vpa}</strong>
                <button
                  onClick={() => { navigator.clipboard?.writeText(order.payee_vpa); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                  className="btn btn-ghost btn-sm" style={{ marginLeft: 8, padding: '2px 8px', fontSize: 12 }}
                >{copied ? 'Copied ✓' : 'Copy'}</button>
              </div>
              <a href={order.upi_uri} className="btn btn-primary btn-full" style={{ marginBottom: 8 }}>📲 Open UPI app to pay</a>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0', paddingTop: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>After paying, enter your UPI reference / UTR</label>
              <input
                value={utr}
                onChange={e => setUtr(e.target.value)}
                placeholder="e.g. 4319XXXXXX12"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, marginBottom: 6 }}
              />
              <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 12 }}>You'll find this 12-digit reference in your UPI app's payment receipt.</p>
              <button className="btn btn-accent btn-full" disabled={confirming || utr.trim().length < 6} onClick={confirm}>
                {confirming ? <span className="spinner" /> : "I've paid — activate my plan"}
              </button>
              <button className="btn btn-ghost btn-full" style={{ marginTop: 8 }} onClick={() => setOrder(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
