import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Disclaimer from '../components/Disclaimer';

interface AIListener {
  id: string;
  name: string;
  gender: 'female' | 'male';
  voice_id: string;
  avatar_emoji: string;
  specializations: string[];
  languages: string[];
}

const TOPIC_LABELS: Record<string, string> = {
  relationship_dating: 'Relationships',
  marriage_commitment: 'Marriage',
  infidelity_trust: 'Infidelity & Trust',
  career_stress: 'Career Stress',
  family_pressure: 'Family',
  societal_peer: 'Peer Pressure',
  emotional_wellness: 'Emotional Wellness',
  abuse_safety: 'Abuse & Safety',
  self_discovery: 'Self-Discovery',
  venting_general: 'Venting',
  students_career: 'Students & Career',
};

export default function AIListeners() {
  const { authFetch } = useAuth();
  const nav = useNavigate();
  const [listeners, setListeners] = useState<AIListener[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gender, setGender] = useState<'all' | 'female' | 'male'>('all');
  const [topic, setTopic] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (gender !== 'all') params.set('gender', gender);
    if (topic) params.set('topic', topic);
    authFetch(`/ai-listeners?${params}`)
      .then(async r => {
        const text = await r.text();
        let d: any = [];
        try { d = text ? JSON.parse(text) : []; } catch { d = []; }
        if (!r.ok) throw new Error(d?.error || `Request failed (${r.status})`);
        setListeners(Array.isArray(d) ? d : []);
      })
      .catch((e) => { setListeners([]); setError(e?.message || 'Could not load listeners. Please check your connection.'); })
      .finally(() => setLoading(false));
    // authFetch reads the live token from localStorage, so it's safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gender, topic, reload]);

  return (
    <div>
      {/* Header */}
      <div className="anim-gradient" style={{ background: 'linear-gradient(120deg,#6B21A8,#9333EA,#EC4899)', borderRadius: 24, padding: '36px 40px', marginBottom: 28, color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -28, right: -8, fontSize: 150, opacity: 0.13, animation: 'float 6s ease-in-out infinite' }}>💬</div>
        <div style={{ position: 'relative' }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.85 }}>Our Listeners</span>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '10px 0 8px' }}>Someone to talk to, 24/7.</h1>
          <p style={{ opacity: 0.92, fontSize: 16, maxWidth: 560, lineHeight: 1.5 }}>
            Caring listeners here whenever you need them. First <strong>15 minutes free</strong> for venting, then just <strong>₹1/min</strong> for advisory sessions.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            {['💬 Chat — type it out', '🎙️ Voice — real-time talk', '🆓 First 15 min FREE'].map(t => (
              <div key={t} style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 999, padding: '8px 16px', fontSize: 13.5, fontWeight: 600 }}>{t}</div>
            ))}
          </div>
        </div>
      </div>

      <Disclaimer variant="ai" style={{ marginBottom: 28 }} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {(['all', 'female', 'male'] as const).map(g => (
            <button key={g} onClick={() => setGender(g)} style={{
              padding: '8px 18px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
              background: gender === g ? 'var(--primary-mid)' : 'transparent',
              color: gender === g ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}>
              {g === 'all' ? '👥 All' : g === 'female' ? '👩 Female' : '👨 Male'}
            </button>
          ))}
        </div>

        <select
          value={topic}
          onChange={e => setTopic(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 14, color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          <option value="">All Topics</option>
          {Object.entries(TOPIC_LABELS).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>

        <span style={{ fontSize: 14, color: 'var(--text-secondary)', marginLeft: 'auto' }}>
          {listeners.length} listener{listeners.length !== 1 ? 's' : ''} available
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card" style={{ padding: 28, height: 220, background: 'var(--surface-hover)' }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <p style={{ fontSize: 16, marginBottom: 16 }}>Could not load listeners. Please check your connection and try again.</p>
          <button className="btn btn-primary btn-sm" onClick={() => setReload(n => n + 1)}>Retry</button>
        </div>
      ) : listeners.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <p style={{ fontSize: 16 }}>No listeners match your filters.</p>
        </div>
      ) : (
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {listeners.map(l => (
            <div key={l.id} style={{ borderRadius: 20, overflow: 'hidden', background: 'white', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', transition: 'transform .18s, box-shadow .18s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
            >
              <div style={{ height: 6, background: l.gender === 'female' ? 'linear-gradient(135deg,#F472B6,#C084FC)' : 'linear-gradient(135deg,#60A5FA,#818CF8)' }} />
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%', fontSize: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: l.gender === 'female' ? 'linear-gradient(135deg, #F472B6, #C084FC)' : 'linear-gradient(135deg, #60A5FA, #818CF8)',
                }}>
                  {l.avatar_emoji}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 18 }}>{l.name}</p>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                    background: l.gender === 'female' ? '#FCE7F3' : '#EFF6FF',
                    color: l.gender === 'female' ? '#9D174D' : '#1E40AF',
                  }}>
                    {l.gender === 'female' ? '♀ Female' : '♂ Male'}
                  </span>
                </div>
              </div>

              {/* Topics */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(l.specializations || []).slice(0, 3).map(s => (
                  <span key={s} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--primary-light)', color: 'var(--primary-dark)', fontWeight: 500 }}>
                    {TOPIC_LABELS[s] || s}
                  </span>
                ))}
              </div>

              {/* Languages */}
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                🌍 {(l.languages || ['English']).join(', ')}
              </p>

              {/* Pricing */}
              <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: 'var(--surface-hover)', borderRadius: 10 }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 2 }}>VENT MODE</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>FREE 15 min</p>
                </div>
                <div style={{ width: 1, background: 'var(--border)' }} />
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 2 }}>ADVISORY</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-mid)' }}>₹1/min</p>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => nav(`/ai-chat/${l.id}`)}>
                  💬 Chat
                </button>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => nav(`/ai-voice/${l.id}`)}>
                  🎙️ Voice
                </button>
              </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
