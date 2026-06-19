import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';

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
  const { token } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState<'category' | 'listeners' | 'loading'>('category');
  const [category, setCategory] = useState('');
  const [listeners, setListeners] = useState<Listener[]>([]);
  const [connecting, setConnecting] = useState('');
  const [error, setError] = useState('');

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  async function findListeners(cat: string) {
    setCategory(cat);
    setStep('loading');
    setError('');
    try {
      const res = await fetch(`${API}/listeners/match?category=${cat}`, { headers });
      const data = await res.json();
      setListeners(data.listeners || []);
      setStep('listeners');
    } catch {
      setError('Could not load listeners. Please try again.');
      setStep('category');
    }
  }

  async function connect(listenerId: string) {
    setConnecting(listenerId);
    try {
      const res = await fetch(`${API}/sessions/request`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ category, listener_id: listenerId, preferred_language: 'English' }),
      });
      const data = await res.json();
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
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {listeners.map((l, i) => (
              <div key={l.id} className="card" style={{ padding: 24, position: 'relative', border: i === 0 ? '2px solid var(--accent)' : undefined }}>
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

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>What's on your mind?</h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>Choose a topic and we'll match you with the right listener.</p>
      </div>

      {error && <div style={{ background: 'var(--danger-light)', padding: 16, borderRadius: 8, color: 'var(--danger)', marginBottom: 16, fontSize: 14 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => findListeners(cat.id)}
            style={{
              background: 'white',
              border: '1.5px solid var(--border)',
              borderRadius: 12,
              padding: '20px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              transition: 'all 0.15s',
              textAlign: 'center',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--primary-mid)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <span style={{ fontSize: 32 }}>{cat.emoji}</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
