import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';

const CRISIS_LINES = [
  { label: 'Tele-MANAS · Govt of India', value: 'Call 14416', sub: '24/7, free, multilingual', emoji: '💚' },
  { label: 'KIRAN Helpline', value: 'Call 1800-599-0019', sub: 'Free national mental-health line', emoji: '💬' },
  { label: 'Emergency', value: 'Call 112', sub: 'Immediate danger', emoji: '🚨' },
  { label: 'Vandrevala Foundation', value: 'Call 1860-266-2345', sub: 'Confidential, 24/7', emoji: '🤝' },
];

const QUICK_ACTIONS = [
  { to: '/vent-line', emoji: '📞', title: 'The Vent Line', desc: 'Just need to let it out? Be heard instantly.', grad: 'linear-gradient(135deg,#2E75B6,#1A3C5E)', light: false },
  { to: '/community', emoji: '🫂', title: 'Community', desc: 'Anonymous groups — trust, marriage, anxiety & more.', grad: 'linear-gradient(135deg,#17A589,#0e7a5f)', light: false },
  { to: '/match', emoji: '💬', title: 'Talk to someone', desc: 'Connect with a live listener right now.', grad: 'linear-gradient(135deg,#F39C12,#d9820b)', light: false },
];

// Trendy per-type theming for the wellness library cards.
const TYPE_THEME: Record<string, { icon: string; grad: string; tint: string; ink: string }> = {
  article:   { icon: '📄', grad: 'linear-gradient(135deg,#6366F1,#4F46E5)', tint: '#EEF2FF', ink: '#4338CA' },
  video:     { icon: '🎥', grad: 'linear-gradient(135deg,#EC4899,#DB2777)', tint: '#FCE7F3', ink: '#BE185D' },
  audio:     { icon: '🎧', grad: 'linear-gradient(135deg,#8B5CF6,#7C3AED)', tint: '#F3E8FF', ink: '#6D28D9' },
  exercise:  { icon: '🧘', grad: 'linear-gradient(135deg,#10B981,#059669)', tint: '#D1FAE5', ink: '#047857' },
  worksheet: { icon: '📝', grad: 'linear-gradient(135deg,#F59E0B,#D97706)', tint: '#FEF3C7', ink: '#B45309' },
};
const themeFor = (t: string) => TYPE_THEME[t] || { icon: '📌', grad: 'linear-gradient(135deg,#2E75B6,#1A3C5E)', tint: '#D5E8F0', ink: '#1A3C5E' };

interface Resource { id: string; title: string; category: string; content: string; resource_type: string; url?: string; }

function normalizeResource(r: any): Resource {
  return {
    id: r.id,
    title: r.title || 'Untitled',
    category: r.category_id || r.category || '',
    content: r.content || '',
    resource_type: r.type || r.resource_type || 'article',
    url: r.content_url || r.url || undefined,
  };
}

export default function Resources() {
  const { token } = useAuth();
  const nav = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/resources`, { headers })
      .then(r => r.json())
      .then(d => { setResources((d.resources || []).map(normalizeResource)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const types = ['all', ...Array.from(new Set(resources.map(r => r.resource_type)))];
  const filtered = resources.filter(r =>
    (filter === 'all' || r.resource_type === filter) &&
    (!query.trim() || `${r.title} ${r.content} ${r.category}`.toLowerCase().includes(query.toLowerCase()))
  );
  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <div className="anim-gradient" style={{
        borderRadius: 24, padding: '40px 36px', marginBottom: 28, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(120deg,#1A3C5E,#2E75B6,#17A589)', color: 'white',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -20, fontSize: 160, opacity: 0.12, animation: 'float 6s ease-in-out infinite' }}>🌤️</div>
        <div style={{ position: 'relative', maxWidth: 620 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.85 }}>Resources & Support</span>
          <h1 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.1, margin: '10px 0 12px' }}>Your feelings need<br />somewhere to go.</h1>
          <p style={{ fontSize: 16, opacity: 0.92, lineHeight: 1.5, marginBottom: 22 }}>Crisis help, instant ways to be heard, and a library of tools — all in one calm place.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => nav('/vent-line')} style={{ border: 'none', cursor: 'pointer', borderRadius: 999, padding: '11px 22px', fontWeight: 700, fontSize: 14, background: 'white', color: '#1A3C5E' }}>📞 Open The Vent Line</button>
            <button onClick={() => nav('/community')} style={{ cursor: 'pointer', borderRadius: 999, padding: '11px 22px', fontWeight: 700, fontSize: 14, background: 'rgba(255,255,255,0.15)', color: 'white', border: '1.5px solid rgba(255,255,255,0.5)' }}>🫂 Join the Community</button>
          </div>
        </div>
      </div>

      {/* ---------- Crisis help ---------- */}
      <div style={{ borderRadius: 20, padding: 24, marginBottom: 28, background: 'linear-gradient(135deg,#FFF1F2,#FEF2F2)', border: '1px solid #FECDD3' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ display: 'inline-flex', width: 8, height: 8, borderRadius: 99, background: '#EF4444', animation: 'pulse 1.4s infinite' }} />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#9F1239' }}>Need help right now?</h2>
        </div>
        <p style={{ fontSize: 13, color: '#9F1239', opacity: 0.85, marginBottom: 16 }}>You're not alone. Reach a trained human any time — free and confidential.</p>
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12 }}>
          {CRISIS_LINES.map(c => (
            <div key={c.label} style={{ background: 'white', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow)', transition: 'transform .15s, box-shadow .15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{c.emoji}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>{c.label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#9F1239', margin: '2px 0' }}>{c.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{c.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- Quick actions ---------- */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16, marginBottom: 40 }}>
        {QUICK_ACTIONS.map(a => (
          <div key={a.to} style={{ borderRadius: 20, padding: 22, cursor: 'pointer', background: a.grad, color: 'white', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-md)', transition: 'transform .18s, box-shadow .18s' }}
            onClick={() => nav(a.to)}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}>
            <div style={{ position: 'absolute', bottom: -16, right: -10, fontSize: 84, opacity: 0.18 }}>{a.emoji}</div>
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>{a.emoji}</div>
              <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>{a.title}</h3>
              <p style={{ fontSize: 13, opacity: 0.92, lineHeight: 1.5 }}>{a.desc}</p>
              <span style={{ display: 'inline-block', marginTop: 12, fontSize: 13, fontWeight: 700 }}>Open →</span>
            </div>
          </div>
        ))}
      </div>

      {/* ---------- Library header + search ---------- */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>🧘 Wellness library</h2>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: 0.5 }}>🔍</span>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search resources…"
            style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 999, border: '1px solid var(--border)', fontSize: 14, background: 'white' }} />
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {types.map(t => {
          const active = filter === t;
          const th = themeFor(t);
          return (
            <button key={t} onClick={() => setFilter(t)} style={{
              cursor: 'pointer', borderRadius: 999, padding: '8px 16px', fontSize: 13, fontWeight: 700,
              border: active ? 'none' : '1px solid var(--border)',
              background: active ? (t === 'all' ? 'linear-gradient(135deg,#2E75B6,#1A3C5E)' : th.grad) : 'white',
              color: active ? 'white' : 'var(--text-secondary)', transition: 'all .15s',
            }}>
              {t === 'all' ? '✨ All' : `${th.icon} ${t.charAt(0).toUpperCase() + t.slice(1)}`}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 190, borderRadius: 18, background: 'linear-gradient(90deg,#EEF2F7 25%,#F8FAFC 50%,#EEF2F7 75%)', backgroundSize: '200% 100%', animation: 'shimmerMove 1.4s infinite' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🔎</div>
          No resources match — try a different search or filter.
        </div>
      ) : (
        <>
          {/* Featured spotlight */}
          {featured && !query && filter === 'all' && (() => {
            const th = themeFor(featured.resource_type);
            return (
              <div onClick={() => featured.url && window.open(featured.url, '_blank')}
                style={{ borderRadius: 22, padding: 28, marginBottom: 24, color: 'white', background: th.grad, cursor: featured.url ? 'pointer' : 'default', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ position: 'absolute', top: -30, right: -10, fontSize: 150, opacity: 0.15, animation: 'float 7s ease-in-out infinite' }}>{th.icon}</div>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', background: 'rgba(255,255,255,0.22)', padding: '4px 10px', borderRadius: 999 }}>★ Featured</span>
                <h3 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2, margin: '14px 0 8px', maxWidth: 560 }}>{featured.title}</h3>
                <p style={{ fontSize: 14, opacity: 0.92, lineHeight: 1.6, maxWidth: 560 }}>{featured.content?.slice(0, 180)}{featured.content?.length > 180 ? '…' : ''}</p>
                {featured.url && <span style={{ display: 'inline-block', marginTop: 16, fontWeight: 700, fontSize: 14 }}>Explore →</span>}
              </div>
            );
          })()}

          <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 20 }}>
            {(!query && filter === 'all' ? rest : filtered).map(r => {
              const th = themeFor(r.resource_type);
              return (
                <div key={r.id} style={{ borderRadius: 18, overflow: 'hidden', background: 'white', boxShadow: 'var(--shadow)', cursor: r.url ? 'pointer' : 'default', transition: 'transform .18s, box-shadow .18s', display: 'flex', flexDirection: 'column' }}
                  onClick={() => r.url && window.open(r.url, '_blank')}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}>
                  <div style={{ height: 6, background: th.grad }} />
                  <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: th.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 23, flexShrink: 0 }}>{th.icon}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: th.tint, color: th.ink }}>{r.resource_type}</span>
                        {r.category && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: 'var(--bg)', color: 'var(--text-secondary)' }}>{r.category.replace(/_/g, ' ')}</span>}
                      </div>
                    </div>
                    <h3 style={{ fontSize: 16.5, fontWeight: 700, lineHeight: 1.35 }}>{r.title}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>{r.content?.slice(0, 140)}{r.content?.length > 140 ? '…' : ''}</p>
                    {r.url && <span style={{ fontSize: 13, fontWeight: 700, color: th.ink }}>Open →</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', marginTop: 40 }}>
        1800-FeelBetter offers emotional support and is not a substitute for professional medical or mental-health care.
      </p>
    </div>
  );
}
