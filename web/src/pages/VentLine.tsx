import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Entry { id: string; alias: string; body: string; ai_reply?: string; mood?: string; support_count: number; created_at: string; }

const MOODS = ['😔 Sad', '😡 Angry', '😰 Anxious', '😫 Overwhelmed', '😞 Lonely', '😶 Numb'];

const CARD_GRADS = [
  'linear-gradient(135deg,#6366F1,#4F46E5)',
  'linear-gradient(135deg,#EC4899,#DB2777)',
  'linear-gradient(135deg,#17A589,#0e7a5f)',
  'linear-gradient(135deg,#F59E0B,#D97706)',
  'linear-gradient(135deg,#8B5CF6,#7C3AED)',
];
const gradFor = (i: number) => CARD_GRADS[i % CARD_GRADS.length];

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function VentLine() {
  const { authFetch } = useAuth();
  const nav = useNavigate();
  const [body, setBody] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [makePublic, setMakePublic] = useState(false);
  const [sending, setSending] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [crisis, setCrisis] = useState(false);
  const [feed, setFeed] = useState<Entry[]>([]);

  function loadFeed() {
    authFetch('/vent-line/feed').then(r => r.json()).then(d => setFeed(d.entries || [])).catch(() => {});
  }
  useEffect(loadFeed, []);

  async function vent() {
    if (!body.trim()) return;
    setSending(true); setReply(null); setCrisis(false);
    try {
      const r = await authFetch('/vent-line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, mood: mood || undefined, is_public: makePublic }),
      });
      const d = await r.json();
      if (r.ok) {
        setReply(d.reply || 'We hear you.');
        if (d.crisis) setCrisis(true);
        setBody('');
        if (makePublic) loadFeed();
      }
    } finally { setSending(false); }
  }

  async function support(e: Entry) {
    const r = await authFetch(`/vent-line/${e.id}/support`, { method: 'POST' });
    if (r.ok) { const d = await r.json(); setFeed(f => f.map(x => x.id === e.id ? { ...x, support_count: d.support_count } : x)); }
  }

  return (
    <div>
      {/* Hero */}
      <div className="anim-gradient" style={{ borderRadius: 24, padding: '40px 36px', marginBottom: 24, position: 'relative', overflow: 'hidden', background: 'linear-gradient(120deg,#1A3C5E,#2E75B6,#17A589)', color: 'white' }}>
        <div style={{ position: 'absolute', top: -30, right: -10, fontSize: 150, opacity: 0.14, animation: 'float 6s ease-in-out infinite' }}>📞</div>
        <div style={{ position: 'relative', maxWidth: 620 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.85 }}>The Vent Line</span>
          <h1 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.1, margin: '10px 0 12px' }}>Don't want advice?<br />Just need to vent?</h1>
          <p style={{ fontSize: 16, opacity: 0.92, lineHeight: 1.5 }}>Let it out here. You'll be heard — instantly, anonymously, no judgment.</p>
        </div>
      </div>

      {/* Composer */}
      <div style={{ borderRadius: 20, padding: 26, marginBottom: 16, background: 'white', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>How are you feeling?</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {MOODS.map(m => {
              const on = mood === m;
              return (
                <button key={m} onClick={() => setMood(on ? null : m)} style={{
                  cursor: 'pointer', borderRadius: 999, padding: '8px 16px', fontSize: 14, fontWeight: 600,
                  border: on ? 'none' : '1px solid var(--border)',
                  background: on ? 'linear-gradient(135deg,#2E75B6,#1A3C5E)' : 'white',
                  color: on ? 'white' : 'var(--text-secondary)', transition: 'all .15s',
                }}>{m}</button>
              );
            })}
          </div>
        </div>
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="What do you need to get off your chest?" rows={5}
          style={{ padding: '14px 16px', borderRadius: 14, border: '1px solid var(--border)', fontSize: 15, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={makePublic} onChange={e => setMakePublic(e.target.checked)} style={{ width: 16, height: 16 }} />
          Share anonymously to the public wall so others feel less alone
        </label>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <button disabled={sending || !body.trim()} onClick={vent} style={{ cursor: 'pointer', border: 'none', borderRadius: 999, padding: '13px 28px', fontWeight: 800, fontSize: 15, color: 'white', background: 'linear-gradient(135deg,#17A589,#0e7a5f)', opacity: sending || !body.trim() ? 0.5 : 1 }}>
            {sending ? 'Sending…' : 'Let it out →'}
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Want to talk live? <a onClick={() => nav('/match')} style={{ color: 'var(--primary-mid)', cursor: 'pointer', fontWeight: 700 }}>Connect now</a></span>
        </div>
      </div>

      {/* AI reply */}
      {reply && (
        <div className="fade-in" style={{ borderRadius: 18, padding: 22, marginBottom: 16, background: 'linear-gradient(135deg,#F0FDF9,#ECFEFF)', border: '1px solid #A7F3D0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#0e7a5f', fontWeight: 700, marginBottom: 8 }}>
            <span style={{ width: 24, height: 24, borderRadius: 99, background: 'linear-gradient(135deg,#17A589,#0e7a5f)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>💚</span>
            The Vent Line · here for you
          </div>
          <p style={{ fontSize: 15.5, lineHeight: 1.6, color: 'var(--text-primary)' }}>{reply}</p>
          {crisis && (
            <div style={{ fontSize: 13, background: '#FEF2F2', color: '#991B1B', padding: '10px 12px', borderRadius: 10, marginTop: 12 }}>
              Please don't go through this alone — call or text <strong>14416</strong>, text HELLO to <strong>1800-599-0019</strong>, or call <strong>112</strong> if you're in immediate danger.
            </div>
          )}
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 12 }}>The Vent Line offers emotional support and a listening ear — it isn't therapy or a substitute for professional care.</p>
        </div>
      )}

      {/* Public wall */}
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '32px 0 14px' }}>🧱 The Wall — you're not alone</h2>
      {feed.length === 0 ? (
        <div style={{ borderRadius: 18, padding: 40, textAlign: 'center', color: 'var(--text-secondary)', background: 'white', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🕊️</div>
          No shared vents yet. Be the first to let it out.
        </div>
      ) : (
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {feed.map((e, i) => (
            <div key={e.id} style={{ borderRadius: 18, overflow: 'hidden', background: 'white', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', transition: 'transform .18s, box-shadow .18s' }}
              onMouseEnter={ev => { ev.currentTarget.style.transform = 'translateY(-4px)'; ev.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
              onMouseLeave={ev => { ev.currentTarget.style.transform = 'none'; ev.currentTarget.style.boxShadow = 'var(--shadow)'; }}>
              <div style={{ height: 5, background: gradFor(i) }} />
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{e.mood ? `${e.mood} · ` : ''}<strong style={{ color: 'var(--text-secondary)' }}>{e.alias}</strong> · {timeAgo(e.created_at)}</div>
                <p style={{ fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-wrap', flex: 1 }}>{e.body}</p>
                {e.ai_reply && <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, borderLeft: '3px solid var(--accent)', paddingLeft: 10, background: 'var(--accent-light)', padding: '8px 10px', borderRadius: '0 8px 8px 0' }}>{e.ai_reply}</p>}
                <button className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => support(e)}>🫶 Me too · {e.support_count}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
