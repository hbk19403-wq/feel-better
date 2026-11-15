import { useState, useEffect } from 'react';
import { API } from '../context/AuthContext';
import Disclaimer from '../components/Disclaimer';

interface Therapist {
  id: string;
  name: string;
  credentials: string;
  profession: string;
  track: 'clinical' | 'peer' | 'wellness';
  specializations: string[];
  bio: string;
  location: string;
  email: string;
  website: string;
  is_listed: boolean;
  rate_per_minute: number;
  avatar_emoji: string;
}

type TrackId = 'clinical' | 'peer' | 'wellness';

const TRACKS: { id: TrackId; label: string; tag: string; icon: string; blurb: string }[] = [
  { id: 'clinical', label: 'Licensed Professional Support', tag: 'Clinical', icon: '🩺', blurb: 'Therapists, psychologists & psychiatrists for therapy, diagnosis, and medication evaluation.' },
  { id: 'peer', label: 'Peer Emotional Support', tag: 'Peer', icon: '💬', blurb: 'Trained listeners and peer-support specialists for venting, being heard, and feeling less alone.' },
  { id: 'wellness', label: 'Wellness & Coaching Support', tag: 'Non-clinical', icon: '🌿', blurb: 'Coaches, healers & mindfulness guides for stress, clarity, motivation, and general wellbeing.' },
];

const FILTERS: { id: '' | TrackId; label: string }[] = [
  { id: '', label: '👥 All tracks' },
  { id: 'clinical', label: '🩺 Licensed' },
  { id: 'peer', label: '💬 Peer' },
  { id: 'wellness', label: '🌿 Wellness' },
];

const TOPIC_LABELS: Record<string, string> = {
  relationship_dating: 'Relationships', marriage_commitment: 'Marriage', infidelity_trust: 'Infidelity',
  career_stress: 'Career', family_pressure: 'Family', societal_peer: 'Peer Pressure',
  emotional_wellness: 'Emotional Wellness', abuse_safety: 'Abuse & Safety', self_discovery: 'Self-Discovery',
  venting_general: 'Venting', students_career: 'Students',
};

const TRACK_GRAD: Record<TrackId, string> = {
  clinical: 'linear-gradient(135deg,#17A589,#0e7a5f)',
  peer: 'linear-gradient(135deg,#8B5CF6,#6D28D9)',
  wellness: 'linear-gradient(135deg,#F59E0B,#D97706)',
};

const PROF_COLORS: Record<string, { bg: string; color: string }> = {
  therapist: { bg: '#EDE9FE', color: '#5B21B6' },
  psychologist: { bg: '#DBEAFE', color: '#1E40AF' },
  psychiatrist: { bg: '#D1FAE5', color: '#065F46' },
  healer: { bg: '#FEF3C7', color: '#92400E' },
};

export default function TherapistDirectory() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [track, setTrack] = useState<'' | TrackId>('');
  const [applying, setApplying] = useState(false);
  const [applyForm, setApplyForm] = useState({ name: '', credentials: '', profession: 'therapist', track: 'clinical', email: '', website: '', bio: '', location: '' });
  const [applySuccess, setApplySuccess] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/therapist-directory?listed=true`)
      .then(r => r.json())
      .then(d => setTherapists(Array.isArray(d) ? d : []))
      .catch(() => setTherapists([]))
      .finally(() => setLoading(false));
  }, []);

  const visibleTracks = TRACKS.filter(t => !track || t.id === track);

  async function submitApplication(e: React.FormEvent) {
    e.preventDefault();
    setApplying(true);
    try {
      const r = await fetch(`${API}/therapist-directory/apply`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applyForm),
      });
      const d = await r.json();
      setApplySuccess(d.message || 'Application submitted!');
    } catch { setApplySuccess('Application submitted!'); }
    setApplying(false);
  }

  return (
    <div>
      {/* Header */}
      <div className="anim-gradient" style={{ background: 'linear-gradient(120deg,#065F46,#059669,#2E75B6)', borderRadius: 24, padding: '36px 40px', marginBottom: 28, color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -28, right: -8, fontSize: 150, opacity: 0.13, animation: 'float 6s ease-in-out infinite' }}>🏥</div>
        <div style={{ position: 'relative' }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.85 }}>Find Your Support</span>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '10px 0 8px' }}>The right help, clearly separated.</h1>
          <p style={{ opacity: 0.92, fontSize: 16, maxWidth: 600, marginBottom: 20, lineHeight: 1.5 }}>
            Licensed clinical care, peer emotional support, and non-clinical wellness coaching. Choose what fits where you are today.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {['✅ Verified credentials', '💰 ₹1/min on platform', '🔒 Private & confidential'].map(t => (
              <div key={t} style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 999, padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>{t}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Apply CTA */}
      <div style={{ background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 14, padding: '20px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 16, color: '#065F46', marginBottom: 4 }}>Are you a licensed professional?</p>
          <p style={{ fontSize: 14, color: '#047857' }}>List your practice on FeelBetter and reach thousands of people who need your expertise.</p>
        </div>
        <button className="btn" style={{ background: '#059669', color: 'white', flexShrink: 0 }}
          onClick={() => document.getElementById('apply-form')?.scrollIntoView({ behavior: 'smooth' })}>
          Apply to List →
        </button>
      </div>

      {/* Track filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {FILTERS.map(p => (
          <button key={p.id} onClick={() => setTrack(p.id)} style={{
            padding: '8px 16px', borderRadius: 20, border: `2px solid ${track === p.id ? 'var(--primary-mid)' : 'var(--border)'}`,
            background: track === p.id ? 'var(--primary-light)' : 'var(--surface)',
            color: track === p.id ? 'var(--primary-dark)' : 'var(--text-secondary)',
            cursor: 'pointer', fontWeight: 500, fontSize: 14, transition: 'all 0.15s',
          }}>{p.label}</button>
        ))}
        <span style={{ fontSize: 14, color: 'var(--text-secondary)', marginLeft: 'auto', alignSelf: 'center' }}>
          {therapists.length} provider{therapists.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grouped track sections */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="card" style={{ padding: 28, height: 240, background: 'var(--surface-hover)' }} />)}
        </div>
      ) : (
        <div style={{ marginBottom: 48 }}>
          {visibleTracks.map(tr => {
            const list = therapists.filter(t => t.track === tr.id);
            return (
              <section key={tr.id} style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 22 }}>{tr.icon}</span>
                  <h2 style={{ fontSize: 21, fontWeight: 700 }}>{tr.label}</h2>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: tr.id === 'wellness' ? '#FEF3C7' : tr.id === 'peer' ? '#EDE9FE' : '#D1FAE5', color: tr.id === 'wellness' ? '#92400E' : tr.id === 'peer' ? '#5B21B6' : '#065F46' }}>{tr.tag}</span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 14, maxWidth: 640 }}>{tr.blurb}</p>
                {tr.id === 'wellness' && <Disclaimer variant="wellness" style={{ marginBottom: 16 }} />}
                {tr.id === 'clinical' && <Disclaimer variant="clinical" style={{ marginBottom: 16 }} />}

                {list.length === 0 ? (
                  <p style={{ fontSize: 14, color: 'var(--text-tertiary)', padding: '12px 0' }}>No providers listed in this track yet — check back soon.</p>
                ) : (
                  <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                    {list.map(t => {
                      const pc = PROF_COLORS[t.profession] || { bg: '#F3F4F6', color: '#374151' };
                      return (
                        <div key={t.id} style={{ borderRadius: 20, overflow: 'hidden', background: 'white', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', transition: 'transform .18s, box-shadow .18s' }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
                        >
                          <div style={{ height: 6, background: TRACK_GRAD[tr.id] }} />
                          <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                            <div style={{ width: 56, height: 56, borderRadius: '50%', fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: pc.bg, flexShrink: 0 }}>
                              {t.avatar_emoji}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{t.name}</p>
                              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{t.credentials}</p>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: pc.bg, color: pc.color }}>
                                {t.profession ? t.profession.charAt(0).toUpperCase() + t.profession.slice(1) : 'Provider'}
                              </span>
                            </div>
                          </div>

                          {t.bio && (
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                              {t.bio.length > 160 ? t.bio.slice(0, 160) + '…' : t.bio}
                            </p>
                          )}

                          {t.location && (
                            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>📍 {t.location}</p>
                          )}

                          {Array.isArray(t.specializations) && t.specializations.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {t.specializations.slice(0, 3).map((s: string) => (
                                <span key={s} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'var(--surface-hover)', color: 'var(--text-secondary)' }}>
                                  {TOPIC_LABELS[s] || s}
                                </span>
                              ))}
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                            {t.website ? (
                              <a href={t.website} target="_blank" rel="noopener noreferrer"
                                style={{ flex: 1, textAlign: 'center', padding: '8px 12px', borderRadius: 10, background: '#059669', color: 'white', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
                                Book Session
                              </a>
                            ) : (
                              <button className="btn btn-outline btn-sm" style={{ flex: 1 }}>Coming Soon</button>
                            )}
                            {t.email && (
                              <a href={`mailto:${t.email}`} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, textDecoration: 'none' }}>
                                ✉️
                              </a>
                            )}
                          </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Apply form */}
      <div id="apply-form" className="card" style={{ padding: 32, maxWidth: 600 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Apply to List Your Practice</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>We review all applications within 48 hours. Licensed clinicians, peer-support specialists, and wellness coaches all welcome — licensed providers are verified before listing.</p>

        {applySuccess ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Application received!</p>
            <p style={{ color: 'var(--text-secondary)' }}>{applySuccess}</p>
          </div>
        ) : (
          <form onSubmit={submitApplication} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Full Name *</label>
                <input required value={applyForm.name} onChange={e => setApplyForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Dr. Jane Smith" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Credentials</label>
                <input value={applyForm.credentials} onChange={e => setApplyForm(f => ({ ...f, credentials: e.target.value }))}
                  placeholder="PhD, LMFT, MD..." style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14 }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email *</label>
                <input required type="email" value={applyForm.email} onChange={e => setApplyForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@practice.com" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Profession</label>
                <select value={applyForm.profession} onChange={e => {
                  const profession = e.target.value;
                  const t: TrackId = ['healer', 'coach', 'wellness'].includes(profession) ? 'wellness'
                    : profession === 'peer' ? 'peer' : 'clinical';
                  setApplyForm(f => ({ ...f, profession, track: t }));
                }}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14 }}>
                  <optgroup label="Licensed (clinical)">
                    <option value="therapist">Therapist</option>
                    <option value="psychologist">Psychologist</option>
                    <option value="psychiatrist">Psychiatrist</option>
                  </optgroup>
                  <optgroup label="Peer support">
                    <option value="peer">Peer-support specialist</option>
                  </optgroup>
                  <optgroup label="Wellness (non-clinical)">
                    <option value="healer">Healer</option>
                    <option value="coach">Coach</option>
                    <option value="wellness">Wellness / Mindfulness guide</option>
                  </optgroup>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Website</label>
              <input value={applyForm.website} onChange={e => setApplyForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://yourpractice.com" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Location</label>
              <input value={applyForm.location} onChange={e => setApplyForm(f => ({ ...f, location: e.target.value }))}
                placeholder="City, State" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Brief Bio</label>
              <textarea value={applyForm.bio} onChange={e => setApplyForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Tell potential clients about your approach and experience..." rows={4}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, resize: 'vertical' }} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={applying} style={{ alignSelf: 'flex-start', padding: '10px 28px' }}>
              {applying ? 'Submitting…' : 'Submit Application'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
