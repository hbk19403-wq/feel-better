import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';

const MOODS = ['😢', '😟', '😐', '🙂', '😊'];
const MOOD_LABELS = ['Very low', 'Low', 'Neutral', 'Good', 'Great'];

interface Checkin { mood_score: number; created_at: string; }
interface Resource { id: string; title: string; category: string; content: string; resource_type: string; }
interface Workshop { id: string; title: string; description: string; facilitator: string; scheduled_at: string; duration_minutes: number; max_participants: number; }

export default function Home() {
  const { user, token } = useAuth();
  const nav = useNavigate();
  const [mood, setMood] = useState<number | null>(null);
  const [submittingMood, setSubmittingMood] = useState(false);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [moodNote, setMoodNote] = useState('');

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    fetch(`${API}/wellness/checkins?limit=14`, { headers }).then(r => r.json()).then(d => setCheckins(d.checkins || [])).catch(() => {});
    fetch(`${API}/resources`, { headers }).then(r => r.json()).then(d => setResources(d.resources?.slice(0, 3) || [])).catch(() => {});
    fetch(`${API}/workshops`, { headers }).then(r => r.json()).then(d => setWorkshops(d.workshops?.slice(0, 2) || [])).catch(() => {});
  }, []);

  async function submitMood(score: number) {
    setMood(score);
    setSubmittingMood(true);
    try {
      await fetch(`${API}/wellness/checkins`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ mood_score: score, note: moodNote }),
      });
      setMoodNote('');
    } catch {}
    setSubmittingMood(false);
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary-mid) 100%)', borderRadius: 16, padding: '36px 40px', marginBottom: 32, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{greeting}, {user?.name} 👋</h1>
          <p style={{ opacity: 0.85, fontSize: 16, maxWidth: 480 }}>
            You deserve to feel heard. Our trained listeners are here for you, anytime.
          </p>
        </div>
        <button className="btn btn-accent btn-lg" onClick={() => nav('/match')} style={{ flexShrink: 0 }}>
          💬 Talk to someone now
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Mood check-in */}
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>How are you feeling today?</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Your honest answer is always welcome here.</p>

          {mood !== null ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{MOODS[mood - 1]}</div>
              <p style={{ fontWeight: 600, color: 'var(--primary-mid)' }}>Logged: {MOOD_LABELS[mood - 1]}</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Thanks for checking in 💙</p>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 16 }} onClick={() => setMood(null)}>Log again</button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
                {MOODS.map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => submitMood(i + 1)}
                    disabled={submittingMood}
                    style={{
                      fontSize: 32, background: 'none', border: '2px solid transparent', borderRadius: 12,
                      padding: '8px 12px', transition: 'all 0.15s', cursor: 'pointer',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary-mid)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
                    title={MOOD_LABELS[i]}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 12px', marginBottom: 12 }}>
                {MOOD_LABELS.map(l => <span key={l} style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{l}</span>)}
              </div>
            </>
          )}
        </div>

        {/* Mood history mini chart */}
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Your mood this week</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Recent check-ins</p>
          {checkins.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
              No check-ins yet. Start tracking your mood above!
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80 }}>
              {checkins.slice(-7).map((c, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: '100%', background: `hsl(${120 + c.mood_score * 20},60%,50%)`,
                    borderRadius: '4px 4px 0 0',
                    height: `${(c.mood_score / 5) * 60 + 8}px`,
                    transition: 'height 0.3s ease',
                  }} title={MOOD_LABELS[c.mood_score - 1]} />
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                    {new Date(c.created_at).toLocaleDateString('en', { weekday: 'narrow' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Resources */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>📚 Resources</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => nav('/resources')}>View all →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {resources.length === 0 ? (
              <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>Loading resources…</div>
            ) : resources.map(r => (
              <div key={r.id} className="card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow)')}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {r.resource_type === 'article' ? '📄' : r.resource_type === 'video' ? '🎥' : '🎧'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{r.title}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.content?.slice(0, 100)}…</p>
                  <span className="badge badge-blue" style={{ marginTop: 8 }}>{r.category.replace(/_/g, ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming workshops */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>🎓 Workshops</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {workshops.length === 0 ? (
              <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>Loading…</div>
            ) : workshops.map(w => (
              <div key={w.id} className="card" style={{ padding: 20 }}>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{w.title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>with {w.facilitator} · {w.duration_minutes} min</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{w.description?.slice(0, 80)}…</p>
                <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
                  📅 {new Date(w.scheduled_at).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <button className="btn btn-outline btn-sm btn-full" style={{ marginTop: 12 }}>
                  Register
                </button>
              </div>
            ))}
          </div>

          {/* Crisis widget */}
          <div style={{ marginTop: 16, background: 'var(--danger-light)', border: '1px solid #FADBD8', borderRadius: 12, padding: 16 }}>
            <p style={{ fontWeight: 600, fontSize: 14, color: '#922B21', marginBottom: 8 }}>🆘 Crisis Support</p>
            <p style={{ fontSize: 13, color: '#922B21', lineHeight: 1.6 }}>
              <strong>988</strong> — Suicide & Crisis Lifeline<br />
              <strong>741741</strong> — Crisis Text Line<br />
              <strong>911</strong> — Emergency services
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
