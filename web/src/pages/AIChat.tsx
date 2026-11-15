import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import Disclaimer from '../components/Disclaimer';

interface AIListener { id: string; name: string; avatar_emoji: string; gender: string; specializations: string[]; }
interface Message { role: 'user' | 'assistant'; content: string; created_at?: string; }
interface Session { id: string; mode: 'vent' | 'advisory'; started_at: string; status: string; }

const TOPIC_LABELS: Record<string, string> = {
  relationship_dating: 'Relationships', marriage_commitment: 'Marriage', infidelity_trust: 'Infidelity & Trust',
  career_stress: 'Career Stress', family_pressure: 'Family', societal_peer: 'Peer Pressure',
  emotional_wellness: 'Emotional Wellness', abuse_safety: 'Abuse & Safety', self_discovery: 'Self-Discovery',
  venting_general: 'Venting', students_career: 'Students & Career',
};

const AGE_GROUPS: { id: string; label: string }[] = [
  { id: '13_17', label: '13–17' },
  { id: '18_24', label: '18–24' },
  { id: '25_34', label: '25–34' },
  { id: '35_49', label: '35–49' },
  { id: '50_64', label: '50–64' },
  { id: '65_70', label: '65–70' },
];

const FREE_MINUTES = { vent: 15, advisory: 5 };
const RATE = 1; // ₹1/min (India)

export default function AIChat() {
  const { listenerId } = useParams<{ listenerId: string }>();
  const { token } = useAuth();
  const nav = useNavigate();

  const [listener, setListener] = useState<AIListener | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<'vent' | 'advisory'>('vent');
  const [topic, setTopic] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [crisis, setCrisis] = useState<any>(null);
  const [elapsed, setElapsed] = useState(0);
  const [ending, setEnding] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    fetch(`${API}/ai-listeners/${listenerId}`, { headers: h })
      .then(r => r.json()).then(setListener).catch(() => {});
  }, [listenerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (session?.status === 'active') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [session?.id]);

  const [connecting, setConnecting] = useState(false);
  // Escalate from the AI chat to a live human listener. Creates a session and
  // drops the user straight into the live chat; billing is ₹1/min once a
  // listener joins (shown on that screen).
  async function connectToHuman() {
    if (connecting) return;
    setConnecting(true);
    try {
      const r = await fetch(`${API}/sessions/request`, {
        method: 'POST', headers: h,
        body: JSON.stringify({ category: topic || 'venting_general', session_type: 'text' }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.session?.id) throw new Error(d.error || 'Could not connect');
      nav(`/session/${d.session.id}`);
    } catch {
      setConnecting(false);
    }
  }

  async function startSession() {
    const r = await fetch(`${API}/ai-chat/sessions`, {
      method: 'POST', headers: h,
      body: JSON.stringify({ ai_listener_id: listenerId, topic_id: topic || null, mode, age_group: ageGroup || null }),
    });
    const s = await r.json();
    setSession(s);
    setMessages([{ role: 'assistant', content: `Hi there! I'm ${listener?.name}. I'm here for you — what's on your mind?` }]);
  }

  async function send() {
    if (!input.trim() || !session || sending) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', content: userMsg }]);
    setSending(true);
    try {
      const r = await fetch(`${API}/ai-chat/sessions/${session.id}/messages`, {
        method: 'POST', headers: h, body: JSON.stringify({ content: userMsg }),
      });
      const d = await r.json();
      if (d.message) setMessages(m => [...m, { role: 'assistant', content: d.message }]);
      if (d.crisis) setCrisis(d.crisis_resources || true);
      if (d.paywall) setPaywall(d.pass || { minutes: 15, amount_inr: 15 });
    } catch {}
    setSending(false);
  }

  // Advice paywall + UPI unlock
  const [paywall, setPaywall] = useState<any | null>(null);
  const [order, setOrder] = useState<any | null>(null);
  const [utr, setUtr] = useState('');
  const [unlockBusy, setUnlockBusy] = useState(false);

  async function startUnlock() {
    if (!session) return;
    setUnlockBusy(true);
    try {
      const r = await fetch(`${API}/ai-chat/sessions/${session.id}/unlock`, { method: 'POST', headers: h });
      const d = await r.json();
      if (d.already_unlocked) { setPaywall(null); return; }
      if (r.ok) { setOrder(d); setUtr(''); }
    } finally { setUnlockBusy(false); }
  }

  async function confirmUnlock() {
    if (!session || !order) return;
    setUnlockBusy(true);
    try {
      const r = await fetch(`${API}/ai-chat/sessions/${session.id}/confirm-unlock`, {
        method: 'POST', headers: h, body: JSON.stringify({ txn_ref: order.txn_ref, upi_txn_id: utr.trim() }),
      });
      const d = await r.json();
      if (r.ok && d.advice_unlocked) {
        setOrder(null); setPaywall(null);
        setMessages(m => [...m, { role: 'assistant', content: "Thank you — I'm really glad we can keep going. Okay, let's get into what will actually help you." }]);
      }
    } finally { setUnlockBusy(false); }
  }

  async function endSession() {
    if (!session || ending) return;
    setEnding(true);
    await fetch(`${API}/ai-chat/sessions/${session.id}/end`, { method: 'POST', headers: h });
    nav('/ai-listeners');
  }

  // 5-minute free discovery window, then advice is ₹1/min (matches the server gate).
  const freeMinutes = 5;
  const chargedMinutes = Math.max(0, Math.floor(elapsed / 60) - freeMinutes);
  const totalCharged = (chargedMinutes * RATE).toFixed(2);
  const isFree = chargedMinutes === 0;

  function formatTime(s: number) {
    const m = Math.floor(s / 60); const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  if (!listener) return <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" /></div>;

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', maxWidth: 760, margin: '0 auto' }}>
      {/* Header */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, borderTop: '4px solid transparent', borderImage: 'linear-gradient(135deg,#2E75B6,#17A589) 1', borderRadius: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: listener.gender === 'female' ? 'linear-gradient(135deg,#F472B6,#C084FC)' : 'linear-gradient(135deg,#60A5FA,#818CF8)',
        }}>{listener.avatar_emoji}</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 16 }}>{listener.name}</p>
          {session && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--text-secondary)' }}>⏱ {formatTime(elapsed)}</span>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                background: isFree ? '#D1FAE5' : '#FEF3C7',
                color: isFree ? '#065F46' : '#92400E',
              }}>
                {isFree ? `FREE (${freeMinutes - Math.floor(elapsed / 60)} min left)` : `₹${totalCharged} charged`}
              </span>
            </div>
          )}
        </div>
        <button className="btn btn-sm" onClick={connectToHuman} disabled={connecting}
          title="Connect to a real human listener (₹1/min)"
          style={{ background: 'linear-gradient(135deg,#2E75B6,#17A589)', color: 'white', border: 'none' }}>
          {connecting ? <span className="spinner" /> : '🤝 Talk to a real person · ₹1/min'}
        </button>
        {session && (
          <button className="btn btn-sm" onClick={endSession} disabled={ending}
            style={{ background: '#FEE2E2', color: '#991B1B', border: 'none' }}>
            End Session
          </button>
        )}
        {!session && <button className="btn btn-ghost btn-sm" onClick={() => nav('/ai-listeners')}>← Back</button>}
      </div>

      {/* Setup or chat */}
      {!session ? (
        <div className="card" style={{ padding: 32, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ fontSize: 64 }}>{listener.avatar_emoji}</div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Start a session with {listener.name}</h2>

          <div style={{ width: '100%', maxWidth: 400, textAlign: 'left' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Session Mode</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {(['vent', 'advisory'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  padding: '14px 16px', borderRadius: 12, border: `2px solid ${mode === m ? 'var(--primary-mid)' : 'var(--border)'}`,
                  background: mode === m ? 'var(--primary-light)' : 'var(--surface)', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: mode === m ? 'var(--primary-dark)' : 'var(--text-primary)' }}>
                    {m === 'vent' ? '💨 Vent' : '💡 Advisory'}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {m === 'vent' ? 'First 15 min FREE, then ₹1/min' : 'First 5 min FREE, then ₹1/min'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div style={{ width: '100%', maxWidth: 400, textAlign: 'left' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Your age group (helps us support you better)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {AGE_GROUPS.map(a => (
                <button key={a.id} onClick={() => setAgeGroup(a.id)} style={{
                  padding: '8px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  border: `2px solid ${ageGroup === a.id ? 'var(--primary-mid)' : 'var(--border)'}`,
                  background: ageGroup === a.id ? 'var(--primary-light)' : 'var(--surface)',
                  color: ageGroup === a.id ? 'var(--primary-dark)' : 'var(--text-secondary)',
                }}>{a.label}</button>
              ))}
            </div>
          </div>

          <div style={{ width: '100%', maxWidth: 400, textAlign: 'left' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Topic (optional)</label>
            <select value={topic} onChange={e => setTopic(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 14 }}>
              <option value="">General — whatever's on your mind</option>
              {Object.entries(TOPIC_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>

          <button onClick={startSession} style={{ minWidth: 220, padding: '14px 28px', borderRadius: 999, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 15, color: 'white', background: 'linear-gradient(135deg,#2E75B6,#1A3C5E)' }}>
            Start Chatting with {listener.name}
          </button>

          <Disclaimer variant="ai" style={{ maxWidth: 400 }} />
        </div>
      ) : (
        <>
          {crisis && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '14px 18px', marginBottom: 10, flexShrink: 0 }}>
              <p style={{ fontWeight: 700, color: '#991B1B', fontSize: 14, marginBottom: 6 }}>You deserve real support right now 💗</p>
              <p style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 1.5 }}>
                Please reach out: call or text <strong>14416</strong> (Tele-MANAS · Govt of India), or text <strong>1800-599-0019</strong>. If you are in immediate danger, call <strong>112</strong>. You do not have to face this alone.
              </p>
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'assistant' && (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8, alignSelf: 'flex-end',
                    background: listener.gender === 'female' ? 'linear-gradient(135deg,#F472B6,#C084FC)' : 'linear-gradient(135deg,#60A5FA,#818CF8)',
                  }}>{listener.avatar_emoji}</div>
                )}
                <div style={{
                  maxWidth: '72%', padding: '12px 16px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: m.role === 'user' ? 'linear-gradient(135deg,#2E75B6,#1A3C5E)' : 'var(--surface)',
                  color: m.role === 'user' ? 'white' : 'var(--text-primary)',
                  boxShadow: 'var(--shadow)', fontSize: 15, lineHeight: 1.6,
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: listener.gender === 'female' ? 'linear-gradient(135deg,#F472B6,#C084FC)' : 'linear-gradient(135deg,#60A5FA,#818CF8)',
                }}>{listener.avatar_emoji}</div>
                <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: 'var(--surface)', boxShadow: 'var(--shadow)' }}>
                  <span style={{ display: 'inline-flex', gap: 4 }}>
                    {[0, 1, 2].map(i => <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-tertiary)', display: 'inline-block', animation: `bounce 1s ${i * 0.2}s infinite` }} />)}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Advice paywall */}
          {paywall && !order && (
            <div style={{ flexShrink: 0, margin: '4px 0 10px', borderRadius: 16, padding: 18, background: 'linear-gradient(135deg,#EEF6FF,#E8F8F5)', border: '1px solid #BFDBFE', textAlign: 'center' }}>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🔓 Continue with real guidance</p>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Your first 5 minutes are free. To keep going with specific, personal advice it's <strong>₹1/min</strong> — {paywall.minutes} min for ₹{paywall.amount_inr}.
              </p>
              <button onClick={startUnlock} disabled={unlockBusy}
                style={{ border: 'none', cursor: 'pointer', borderRadius: 999, padding: '11px 26px', fontWeight: 700, fontSize: 14, color: 'white', background: 'linear-gradient(135deg,#2E75B6,#17A589)', opacity: unlockBusy ? 0.6 : 1 }}>
                {unlockBusy ? 'Loading…' : `Continue · ₹${paywall.amount_inr} via UPI`}
              </button>
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '12px 0', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
                rows={2}
                style={{ flex: 1, padding: '12px 16px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 15, resize: 'none', lineHeight: 1.5, outline: 'none' }}
              />
              <button onClick={send} disabled={sending || !input.trim()}
                style={{ padding: '12px 22px', borderRadius: 14, height: 'fit-content', alignSelf: 'flex-end', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: 'white', background: 'linear-gradient(135deg,#2E75B6,#1A3C5E)', opacity: sending || !input.trim() ? 0.5 : 1 }}>
                Send ↑
              </button>
            </div>
          </div>
        </>
      )}

      {/* UPI unlock modal */}
      {order && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card fade-in" style={{ maxWidth: 400, width: '100%', padding: 26, textAlign: 'center', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>Pay ₹{order.amount_inr} to continue</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>{order.minutes} minutes of full guidance · ₹1/min. Scan or tap to pay.</p>
            {order.qr_data_url && <img src={order.qr_data_url} alt="UPI QR" style={{ width: 200, height: 200, borderRadius: 12, border: '1px solid var(--border)' }} />}
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '12px 0' }}>Paying to <strong style={{ color: 'var(--text-primary)' }}>{order.payee_vpa}</strong></p>
            <a href={order.upi_uri} className="btn btn-primary btn-full" style={{ marginBottom: 14 }}>📲 Open UPI app to pay</a>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, textAlign: 'left' }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>After paying, enter your UPI reference / UTR</label>
              <input value={utr} onChange={e => setUtr(e.target.value)} placeholder="e.g. 4319XXXXXX12"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, marginBottom: 10 }} />
              <button onClick={confirmUnlock} disabled={unlockBusy || utr.trim().length < 6} className="btn btn-accent btn-full">
                {unlockBusy ? <span className="spinner" /> : "I've paid — unlock guidance"}
              </button>
              <button onClick={() => setOrder(null)} className="btn btn-ghost btn-full" style={{ marginTop: 8 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
