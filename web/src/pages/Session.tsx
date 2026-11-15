import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SessionData {
  id: string;
  user_alias: string;
  listener_name?: string;
  status: string;
  started_at?: string;
  category: string;
}

interface Msg {
  id: string;
  sender: 'caller' | 'listener' | 'system';
  content: string;
  created_at: string;
}

export default function Session() {
  const { id } = useParams<{ id: string }>();
  const { authFetch } = useAuth();
  const nav = useNavigate();
  const [session, setSession] = useState<SessionData | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [extending, setExtending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [showExtend, setShowExtend] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [storageDown, setStorageDown] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const loadSession = useCallback(async () => {
    try {
      const r = await authFetch(`/sessions/${id}`);
      if (!r.ok) return;
      const d = await r.json();
      if (d.session) setSession(d.session);
    } catch { /* keep last */ }
  }, [authFetch, id]);

  useEffect(() => {
    loadSession();
    // Poll session status so the caller sees when a listener claims (pending → active).
    const t = setInterval(loadSession, 4000);
    return () => clearInterval(t);
  }, [loadSession]);

  const loadMessages = useCallback(async () => {
    try {
      const r = await authFetch(`/sessions/${id}/messages`);
      if (!r.ok) return;
      const d = await r.json();
      if (Array.isArray(d.messages)) setMessages(d.messages);
    } catch { /* keep last */ }
  }, [authFetch, id]);

  useEffect(() => {
    loadMessages();
    const t = setInterval(loadMessages, 3000);
    return () => clearInterval(t);
  }, [loadMessages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function send() {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setDraft('');
    // Optimistic append
    setMessages(m => [...m, { id: `tmp-${Date.now()}`, sender: 'caller', content, created_at: new Date().toISOString() }]);
    try {
      const r = await authFetch(`/sessions/${id}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
      if (r.status === 503) {
        setStorageDown(true);
        // Roll back the optimistic message — it wasn't persisted.
        setMessages(m => m.filter(x => x.content !== content || !x.id.startsWith('tmp-')));
        return;
      }
      setStorageDown(false);
      await loadMessages();
    } catch { /* will retry on next poll */ } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (session?.status !== 'active') return;
    intervalRef.current = setInterval(() => {
      setElapsed(e => {
        if (e === 25 * 60) setShowExtend(true);
        return e + 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [session?.status]);

  async function endSession() {
    setEnding(true);
    try {
      const r = await authFetch(`/sessions/${id}/end`, { method: 'POST' });
      const d = await r.json().catch(() => ({}));
      const due = Math.round(Number(d?.billing?.amount_inr) || 0);
      if (due > 0) { setSettleDue(due); setEnding(false); return; } // show settle before review
      nav(`/review/${id}`);
    } catch {
      nav('/');
    }
  }

  // Settle-on-end (₹1/min) via UPI
  const [settleDue, setSettleDue] = useState(0);
  const [settleOrder, setSettleOrder] = useState<any | null>(null);
  const [settleUtr, setSettleUtr] = useState('');
  const [settleBusy, setSettleBusy] = useState(false);

  async function startSettle() {
    setSettleBusy(true);
    try {
      const r = await authFetch(`/sessions/${id}/settle`, { method: 'POST' });
      const d = await r.json().catch(() => ({}));
      if (d.nothing_due) { nav(`/review/${id}`); return; }
      if (r.ok) { setSettleOrder(d); setSettleUtr(''); }
    } finally { setSettleBusy(false); }
  }

  async function confirmSettle() {
    if (!settleOrder) return;
    setSettleBusy(true);
    try {
      const r = await authFetch(`/sessions/${id}/settle-confirm`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txn_ref: settleOrder.txn_ref, upi_txn_id: settleUtr.trim() }),
      });
      if (r.ok) nav(`/review/${id}`);
    } finally { setSettleBusy(false); }
  }

  async function extendSession() {
    setExtending(true);
    setShowExtend(false);
    setTimeout(() => setExtending(false), 1000);
  }

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="anim-gradient" style={{
        background: 'linear-gradient(160deg, #0f2744 0%, #1A3C5E 40%, #17A589 100%)',
        borderRadius: 24,
        padding: '52px 48px',
        width: '100%',
        maxWidth: 520,
        textAlign: 'center',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Floating watermark */}
        <div style={{ position: 'absolute', top: -24, left: -10, fontSize: 130, opacity: 0.1, animation: 'float 6s ease-in-out infinite', pointerEvents: 'none' }}>🎧</div>

        {/* Crisis button */}
        <button
          onClick={() => setCrisisOpen(true)}
          style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, padding: '6px 12px', color: 'white', fontSize: 13, cursor: 'pointer' }}
        >
          🛡️ Crisis help
        </button>

        {/* Listener avatar */}
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 40, border: '3px solid rgba(255,255,255,0.3)' }}>
          🎧
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{session?.listener_name || 'Your Listener'}</h2>
        <p style={{ opacity: 0.75, fontSize: 14, marginBottom: session && session.status !== 'active' ? 16 : 28 }}>Speaking with you anonymously as <strong>{session?.user_alias || '…'}</strong></p>

        {session && session.status !== 'active' && (
          <div style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 14, padding: '14px 18px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <span className="spinner" style={{ borderTopColor: 'white' }} />
            <span style={{ fontSize: 14, opacity: 0.9 }}>Connecting you to a listener… billing starts at ₹1/min only once they join. You can start typing anytime.</span>
          </div>
        )}

        {/* Timer */}
        <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 16, padding: '20px 32px', marginBottom: session?.status === 'active' ? 14 : 36, display: 'inline-block' }}>
          <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: 2, fontVariantNumeric: 'tabular-nums' }}>{timeStr}</div>
          <p style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>Session time</p>
        </div>

        {/* Live ₹1/min billing meter — only while connected to a listener */}
        {session?.status === 'active' && (
          <div style={{ marginBottom: 30, display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 999, padding: '8px 16px', fontSize: 14 }}>
            <span style={{ opacity: 0.85 }}>💬 ₹1/min ·</span>
            <strong style={{ fontVariantNumeric: 'tabular-nums' }}>₹{Math.ceil(elapsed / 60) * 1} so far</strong>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 32 }}>
          {[
            { icon: muted ? '🔇' : '🎤', label: muted ? 'Unmute' : 'Mute', action: () => setMuted(m => !m), active: muted },
            { icon: speaker ? '🔊' : '🔈', label: speaker ? 'Speaker on' : 'Speaker off', action: () => setSpeaker(s => !s), active: !speaker },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.action}
              style={{
                background: btn.active ? 'rgba(231,76,60,0.25)' : 'rgba(255,255,255,0.12)',
                border: `1.5px solid ${btn.active ? 'rgba(231,76,60,0.6)' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: 12,
                padding: '14px 20px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                fontSize: 24,
                transition: 'all 0.15s',
                minWidth: 80,
              }}
            >
              {btn.icon}
              <span style={{ fontSize: 11, opacity: 0.8 }}>{btn.label}</span>
            </button>
          ))}
        </div>

        <button
          className="btn btn-danger btn-lg"
          onClick={endSession}
          disabled={ending}
          style={{ width: '100%', fontSize: 16 }}
        >
          {ending ? <span className="spinner" /> : '📞 End session'}
        </button>

        {/* Live text transcript */}
        <div style={{ marginTop: 28, textAlign: 'left' }}>
          <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 8, textAlign: 'center' }}>💬 Or type with your listener</p>
          <div
            ref={scrollRef}
            style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 14, padding: 14, height: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {messages.length === 0 ? (
              <p style={{ opacity: 0.55, fontSize: 13, margin: 'auto', textAlign: 'center' }}>
                No messages yet. Say hello whenever you're ready.
              </p>
            ) : messages.map(m => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.sender === 'caller' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  background: m.sender === 'caller' ? 'rgba(23,165,137,0.85)' : 'rgba(255,255,255,0.16)',
                  borderRadius: 12,
                  padding: '8px 12px',
                  fontSize: 14,
                  lineHeight: 1.4,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {m.sender === 'system' && <span style={{ opacity: 0.7, fontSize: 11, display: 'block' }}>system</span>}
                {m.content}
              </div>
            ))}
          </div>
          {storageDown && (
            <div style={{ marginTop: 10, background: 'rgba(231,76,60,0.18)', border: '1px solid rgba(231,76,60,0.5)', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, lineHeight: 1.45 }}>
              ⚠️ Text chat isn't available yet — transcript storage hasn't been set up. Your voice session is unaffected.
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Type a message…"
              style={{ flex: 1, borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.1)', color: 'white', padding: '10px 14px', fontSize: 14, outline: 'none' }}
            />
            <button
              onClick={send}
              disabled={sending || !draft.trim()}
              className="btn btn-accent"
              style={{ padding: '0 18px', opacity: sending || !draft.trim() ? 0.5 : 1 }}
            >
              {sending ? <span className="spinner" /> : 'Send'}
            </button>
          </div>
        </div>

        {/* 25-min extend prompt */}
        {showExtend && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
            <p style={{ fontSize: 20, fontWeight: 700 }}>25 minutes passed ⏰</p>
            <p style={{ opacity: 0.8, fontSize: 15 }}>Would you like to continue?</p>
            <button className="btn btn-accent btn-lg" onClick={extendSession} style={{ width: '100%' }}>Continue session</button>
            <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', width: '100%' }} onClick={endSession}>End now</button>
          </div>
        )}
      </div>

      {/* Settle-on-end modal */}
      {settleDue > 0 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card fade-in" style={{ maxWidth: 400, width: '100%', padding: 26, textAlign: 'center', maxHeight: '90vh', overflowY: 'auto' }}>
            {!settleOrder ? (
              <>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🧾</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Settle your session</h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>Your live session with a listener was <strong>₹1/min</strong>.</p>
                <div style={{ fontSize: 40, fontWeight: 800, margin: '8px 0 16px' }}>₹{settleDue}</div>
                <button onClick={startSettle} disabled={settleBusy} className="btn btn-primary btn-full" style={{ marginBottom: 8 }}>
                  {settleBusy ? <span className="spinner" /> : `Pay ₹${settleDue} via UPI`}
                </button>
                <button onClick={() => nav(`/review/${id}`)} className="btn btn-ghost btn-full">Pay later</button>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>Pay ₹{settleOrder.amount_inr}</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>Scan or tap to pay via any UPI app.</p>
                {settleOrder.qr_data_url && <img src={settleOrder.qr_data_url} alt="UPI QR" style={{ width: 200, height: 200, borderRadius: 12, border: '1px solid var(--border)' }} />}
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '12px 0' }}>Paying to <strong style={{ color: 'var(--text-primary)' }}>{settleOrder.payee_vpa}</strong></p>
                <a href={settleOrder.upi_uri} className="btn btn-primary btn-full" style={{ marginBottom: 14 }}>📲 Open UPI app to pay</a>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, textAlign: 'left' }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>After paying, enter your UPI reference / UTR</label>
                  <input value={settleUtr} onChange={e => setSettleUtr(e.target.value)} placeholder="e.g. 4319XXXXXX12"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, marginBottom: 10 }} />
                  <button onClick={confirmSettle} disabled={settleBusy || settleUtr.trim().length < 6} className="btn btn-accent btn-full">
                    {settleBusy ? <span className="spinner" /> : "I've paid"}
                  </button>
                  <button onClick={() => nav(`/review/${id}`)} className="btn btn-ghost btn-full" style={{ marginTop: 8 }}>Pay later</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Crisis modal */}
      {crisisOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card fade-in" style={{ maxWidth: 440, width: '100%', padding: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--danger)' }}>🛡️ Crisis Resources</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>If you're in immediate danger or need urgent support:</p>
            {[
              { name: 'Tele-MANAS · Govt of India', desc: 'Call 14416 · 24/7', color: '#E74C3C' },
              { name: 'KIRAN Helpline', desc: 'Call 1800-599-0019', color: '#E67E22' },
              { name: 'Emergency Services', desc: 'Call 112', color: '#C0392B' },
            ].map(r => (
              <div key={r.name} style={{ background: '#FEF9F9', border: '1px solid #FADBD8', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
                <p style={{ fontWeight: 600, fontSize: 15, color: r.color }}>{r.name}</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{r.desc}</p>
              </div>
            ))}
            <button className="btn btn-ghost btn-full" style={{ marginTop: 8 }} onClick={() => setCrisisOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
