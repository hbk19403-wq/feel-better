import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../context/AuthContext';
import Logo from '../components/Logo';

interface Message { role: 'user' | 'assistant'; content: string; }
interface Assist { feeling: string; canSay: string[]; avoid: string[]; riskPresent: boolean; escalate: boolean; escalationReason: string; }

const PHONE_DISPLAY = '1-800-FEELBETTER';
const PHONE_DIAL = '18003335238';

const AGE_GROUPS: { id: string; label: string }[] = [
  { id: '13_17', label: '13–17' }, { id: '18_24', label: '18–24' }, { id: '25_34', label: '25–34' },
  { id: '35_49', label: '35–49' }, { id: '50_64', label: '50–64' }, { id: '65_70', label: '65–70' },
];

export default function PublicChat() {
  const nav = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hey, I'm Sam — really glad you reached out. This is a safe, private space, and nothing you say is saved or recorded. What's been on your mind?" },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [ageGroup, setAgeGroup] = useState('');
  const [crisis, setCrisis] = useState(false);
  const [listenerView, setListenerView] = useState(false);
  const [assist, setAssist] = useState<Assist | null>(null);
  const [assistLoading, setAssistLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);

  async function fetchAssist(convo: Message[]) {
    setAssistLoading(true);
    try {
      const r = await fetch(`${API}/ai-chat/assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: convo, age_group: ageGroup || null }),
      });
      const d = await r.json();
      if (d && typeof d.feeling === 'string') setAssist(d);
      if (d?.riskPresent || d?.escalate) setCrisis(true);
    } catch { /* safety net stays quiet on failure */ }
    setAssistLoading(false);
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setSending(true);
    fetchAssist(next);
    try {
      const r = await fetch(`${API}/ai-chat/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, age_group: ageGroup || null, mode: 'vent' }),
      });
      const d = await r.json();
      if (d.message) setMessages(m => [...m, { role: 'assistant', content: d.message }]);
      if (d.crisis) setCrisis(true);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: "I'm having trouble connecting right now, but I don't want you to feel alone. If this is urgent, please call Tele-MANAS 14416, or call 112." }]);
    }
    setSending(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #F8FAFC)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        <button onClick={() => nav('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={28} />
          <span style={{ fontWeight: 700, fontSize: 16 }}>1800 Feel Better</span>
        </button>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          🔒 Private · not recorded
        </span>
        <button className="btn btn-outline btn-sm" onClick={() => setListenerView(v => !v)} title="Safety-net guidance for a human listener"
          style={listenerView ? { background: 'var(--primary-light)', color: 'var(--primary-dark)', borderColor: 'var(--primary-mid)' } : undefined}>
          🛟 Listener view
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => nav('/match')}>🧑‍🤝‍🧑 Talk to a live listener</button>
        <a href={`tel:${PHONE_DIAL}`} className="btn btn-outline btn-sm" style={{ textDecoration: 'none' }}>📞 {PHONE_DISPLAY}</a>
      </div>

      {/* Privacy banner */}
      <div style={{ background: '#ECFDF5', color: '#065F46', fontSize: 12.5, textAlign: 'center', padding: '8px 16px', flexShrink: 0 }}>
        No login needed. We don't keep your information and we don't record this chat. Say whatever you feel.
      </div>

      {crisis && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', margin: '12px 16px 0', borderRadius: 12, padding: '14px 18px' }}>
          <p style={{ fontWeight: 700, color: '#991B1B', fontSize: 14, marginBottom: 6 }}>You deserve real support right now 💗</p>
          <p style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 1.5 }}>
            Please reach out: call or text <strong>14416</strong> (Tele-MANAS · Govt of India), or text <strong>1800-599-0019</strong>. If you are in immediate danger, call <strong>112</strong>. You don't have to face this alone.
          </p>
        </div>
      )}

      {/* Body: messages + optional listener-assist panel */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', maxWidth: 760, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length <= 1 && (
          <div style={{ alignSelf: 'center', textAlign: 'center', margin: '8px 0 4px' }}>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Optional — your age group helps us support you better:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {AGE_GROUPS.map(a => (
                <button key={a.id} onClick={() => setAgeGroup(a.id)} style={{
                  padding: '6px 12px', borderRadius: 18, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  border: `2px solid ${ageGroup === a.id ? 'var(--primary-mid)' : 'var(--border)'}`,
                  background: ageGroup === a.id ? 'var(--primary-light)' : 'var(--surface)',
                  color: ageGroup === a.id ? 'var(--primary-dark)' : 'var(--text-secondary)',
                }}>{a.label}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '78%', padding: '12px 16px',
              borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: m.role === 'user' ? 'var(--primary-mid)' : 'var(--surface)',
              color: m.role === 'user' ? 'white' : 'var(--text-primary)',
              boxShadow: 'var(--shadow)', fontSize: 15, lineHeight: 1.6, whiteSpace: 'pre-wrap',
            }}>{m.content}</div>
          </div>
        ))}
        {sending && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: 'var(--surface)', boxShadow: 'var(--shadow)' }}>
              <span style={{ display: 'inline-flex', gap: 4 }}>
                {[0, 1, 2].map(i => <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-tertiary)', display: 'inline-block', animation: `bounce 1s ${i * 0.2}s infinite` }} />)}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Listener-assist safety-net panel */}
      {listenerView && (
        <aside style={{ width: 320, flexShrink: 0, borderLeft: '1px solid var(--border)', background: 'var(--surface)', overflowY: 'auto', padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>🛟</span>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Listener Assist</h3>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 14, lineHeight: 1.4 }}>
            A quiet safety net. The caller never sees this — it helps you stay warm and present.
          </p>

          {!assist && !assistLoading && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Guidance appears here as the conversation unfolds.</p>
          )}
          {assistLoading && !assist && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Reading the conversation…</p>
          )}

          {assist && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, opacity: assistLoading ? 0.55 : 1, transition: 'opacity 0.2s' }}>
              {/* Risk / escalation */}
              <div style={{
                borderRadius: 10, padding: '10px 12px',
                background: assist.escalate ? '#FEF2F2' : assist.riskPresent ? '#FFFBEB' : '#ECFDF5',
                border: `1px solid ${assist.escalate ? '#FCA5A5' : assist.riskPresent ? '#FDE68A' : '#A7F3D0'}`,
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: assist.escalate ? '#991B1B' : assist.riskPresent ? '#92400E' : '#065F46', marginBottom: 2 }}>
                  {assist.escalate ? '🚨 Escalate now' : assist.riskPresent ? '⚠️ Risk present' : '✓ No acute risk'}
                </p>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {assist.escalate
                    ? (assist.escalationReason || 'Share crisis resources now.') + ' Offer Tele-MANAS 14416 / KIRAN 1800-599-0019 / 112.'
                    : assist.riskPresent ? 'Stay close and keep checking in.' : 'Keep listening and validating.'}
                </p>
              </div>

              {/* Feeling */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-tertiary)', marginBottom: 4 }}>They seem to be feeling</p>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.45 }}>{assist.feeling}</p>
              </div>

              {/* Can say */}
              {assist.canSay.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#065F46', marginBottom: 6 }}>You can say</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {assist.canSay.map((s, i) => (
                      <p key={i} style={{ fontSize: 13, color: 'var(--text-primary)', background: '#ECFDF5', borderRadius: 8, padding: '8px 10px', lineHeight: 1.45 }}>“{s}”</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Avoid */}
              {assist.avoid.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#991B1B', marginBottom: 6 }}>Try to avoid</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {assist.avoid.map((s, i) => (
                      <p key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 6, lineHeight: 1.45 }}><span>✕</span><span>{s}</span></p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>
      )}
      </div>

      {/* Input */}
      <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', padding: '12px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', maxWidth: 760, margin: '0 auto' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Type whatever you're feeling… (Enter to send)"
            rows={1}
            style={{ flex: 1, padding: '12px 16px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 15, resize: 'none', lineHeight: 1.5, outline: 'none', maxHeight: 120 }}
          />
          <button className="btn btn-primary" onClick={send} disabled={sending || !input.trim()}
            style={{ padding: '12px 20px', borderRadius: 14, height: 'fit-content' }}>Send ↑</button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 8 }}>
          We're here to listen, not to diagnose or prescribe. In an emergency call 112. ·{' '}
          <button onClick={() => nav('/match')} style={{ background: 'none', border: 'none', color: 'var(--primary-mid)', cursor: 'pointer', fontSize: 11, textDecoration: 'underline' }}>
            Prefer a real session? Talk to a live listener
          </button>
        </p>
      </div>
    </div>
  );
}
