import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { id: 'relationship_dating', label: 'Relationship & Dating', emoji: '💕' },
  { id: 'marriage_commitment', label: 'Marriage & Commitment', emoji: '💍' },
  { id: 'infidelity_trust', label: 'Infidelity & Trust', emoji: '🔐' },
  { id: 'career_stress', label: 'Career Stress', emoji: '💼' },
  { id: 'family_pressure', label: 'Family Pressure', emoji: '👨‍👩‍👧' },
  { id: 'societal_peer', label: 'Social & Peer Issues', emoji: '🤝' },
  { id: 'emotional_wellness', label: 'Emotional Wellness', emoji: '🌱' },
  { id: 'abuse_safety', label: 'Abuse & Safety', emoji: '🛡️' },
  { id: 'self_discovery', label: 'Self Discovery', emoji: '🔍' },
  { id: 'venting_general', label: 'Just Venting', emoji: '💭' },
  { id: 'students_career', label: 'Student Life', emoji: '🎓' },
];

interface Listener {
  id: string;
  display_name: string;
  bio: string;
  specializations: string[];
  languages: string[];
  rating: number;
  total_sessions: number;
  is_online: boolean;
  active_session_count: number;
  match_score?: number;
}

export default function Match() {
  const { authFetch } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState<'category' | 'listeners' | 'loading'>('category');
  const [category, setCategory] = useState('');
  const [listeners, setListeners] = useState<Listener[]>([]);
  const [connecting, setConnecting] = useState('');
  const [error, setError] = useState('');

  const jsonHeaders = { 'Content-Type': 'application/json' };

  async function safeJson(res: Response): Promise<any> {
    const text = await res.text();
    try { return text ? JSON.parse(text) : {}; } catch { return {}; }
  }

  async function findListeners(cat: string) {
    setCategory(cat);
    setStep('loading');
    setError('');
    try {
      const res = await authFetch(`/listeners/match?category=${cat}`, { headers: jsonHeaders });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setListeners(Array.isArray(data.listeners) ? data.listeners : []);
      setStep('listeners');
    } catch (err: any) {
      setError(err?.message ? `Could not load listeners: ${err.message}` : 'Could not load listeners. Please check your connection and try again.');
      setStep('category');
    }
  }

  async function connect(listenerId: string) {
    setConnecting(listenerId);
    try {
      const res = await authFetch(`/sessions/request`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({ category, listener_id: listenerId, preferred_language: 'English' }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || 'Failed to start session');
      nav(`/session/${data.session.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConnecting('');
    }
  }

  const stars = (rating: number) => '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

  if (step === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
        <div className="spinner spinner-dark" style={{ width: 40, height: 40, borderWidth: 3 }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>Finding your best match…</p>
      </div>
    );
  }

  if (step === 'listeners') {
    return (
      <div className="fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setStep('category')}>← Back</button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Available Listeners</h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Matched for: <strong>{CATEGORIES.find(c => c.id === category)?.label}</strong>
            </p>
          </div>
        </div>

        {error && <div style={{ background: 'var(--danger-light)', padding: 16, borderRadius: 8, color: 'var(--danger)', marginBottom: 16, fontSize: 14 }}>{error}</div>}

        {listeners.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No listeners available right now</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>All our listeners are currently busy. Please try again in a few minutes.</p>
            <button className="btn btn-primary" onClick={() => findListeners(category)}>Try again</button>
          </div>
        ) : (
          <div className="stagger" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {listeners.map((l, i) => (
              <div key={l.id} className="card" style={{ padding: 24, position: 'relative', borderRadius: 18, border: i === 0 ? '2px solid var(--accent)' : undefined, transition: 'transform .18s, box-shadow .18s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
              >
                {i === 0 && (
                  <div style={{ position: 'absolute', top: -1, right: 16, background: 'var(--accent)', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: '0 0 8px 8px', letterSpacing: 0.5 }}>
                    BEST MATCH
                  </div>
                )}

                <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: `hsl(${l.display_name.charCodeAt(0) * 7 % 360},60%,75%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0, position: 'relative',
                  }}>
                    {l.display_name[0]}
                    <div className={`dot-online ${l.is_online ? '' : 'dot-offline'}`} style={{ position: 'absolute', bottom: 0, right: 0, border: '2px solid white' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{l.display_name}</p>
                    <p style={{ fontSize: 13, color: 'var(--warning)', marginBottom: 4 }}>{stars(l.rating)} <span style={{ color: 'var(--text-secondary)' }}>({l.rating?.toFixed(1)})</span></p>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{l.total_sessions} sessions · {l.active_session_count}/3 active</p>
                  </div>
                  {l.match_score !== undefined && (
                    <div style={{ background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 8, padding: '4px 10px', fontSize: 13, fontWeight: 700, alignSelf: 'flex-start', flexShrink: 0 }}>
                      {Math.round(l.match_score)}pts
                    </div>
                  )}
                </div>

                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>{l.bio?.slice(0, 120)}…</p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {l.specializations?.slice(0, 3).map(s => (
                    <span key={s} className="badge badge-blue" style={{ fontSize: 11 }}>{s.replace(/_/g, ' ')}</span>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {l.languages?.slice(0, 2).map(lang => (
                    <span key={lang} className="badge badge-green" style={{ fontSize: 11 }}>🌐 {lang}</span>
                  ))}
                </div>

                <button
                  className="btn btn-accent btn-full"
                  style={{ marginTop: 16 }}
                  disabled={!!connecting || !l.is_online}
                  onClick={() => connect(l.id)}
                >
                  {connecting === l.id ? <span className="spinner" /> : l.is_online ? '💬 Connect now' : '🔴 Unavailable'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const CAT_GRADS = [
    'linear-gradient(135deg,#6366F1,#4F46E5)', 'linear-gradient(135deg,#EC4899,#DB2777)',
    'linear-gradient(135deg,#17A589,#0e7a5f)', 'linear-gradient(135deg,#F59E0B,#D97706)',
    'linear-gradient(135deg,#8B5CF6,#7C3AED)', 'linear-gradient(135deg,#2E75B6,#1A3C5E)',
  ];

  return (
    <div className="fade-in">
      {/* Hero */}
      <div className="anim-gradient" style={{ background: 'linear-gradient(120deg,#1A3C5E,#2E75B6,#17A589)', borderRadius: 24, padding: '36px 40px', marginBottom: 28, color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -28, right: -8, fontSize: 150, opacity: 0.13, animation: 'float 6s ease-in-out infinite' }}>💬</div>
        <div style={{ position: 'relative' }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.85 }}>Connect</span>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '10px 0 8px' }}>What's on your mind?</h1>
          <p style={{ fontSize: 16, opacity: 0.92, maxWidth: 520, lineHeight: 1.5 }}>Choose a topic and we'll match you with the right listener.</p>
        </div>
      </div>

      {error && <div style={{ background: 'var(--danger-light)', padding: 16, borderRadius: 12, color: 'var(--danger)', marginBottom: 16, fontSize: 14 }}>{error}</div>}

      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {CATEGORIES.map((cat, i) => (
          <button
            key={cat.id}
            onClick={() => findListeners(cat.id)}
            style={{
              background: 'white', border: 'none', borderRadius: 18, padding: 0, overflow: 'hidden',
              display: 'flex', flexDirection: 'column', cursor: 'pointer',
              boxShadow: 'var(--shadow)', transition: 'transform .18s, box-shadow .18s', textAlign: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ background: CAT_GRADS[i % CAT_GRADS.length], padding: '22px 0', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: -12, right: -6, fontSize: 64, opacity: 0.22 }}>{cat.emoji}</div>
              <span style={{ fontSize: 36, position: 'relative' }}>{cat.emoji}</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, padding: '16px 12px' }}>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
