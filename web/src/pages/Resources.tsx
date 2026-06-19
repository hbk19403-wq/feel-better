import { useState, useEffect } from 'react';
import { useAuth, API } from '../context/AuthContext';

interface Resource { id: string; title: string; category: string; content: string; resource_type: string; url?: string; }

const TYPE_ICONS: Record<string, string> = { article: '📄', video: '🎥', audio: '🎧', exercise: '🧘', worksheet: '📝' };

export default function Resources() {
  const { token } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/resources`, { headers })
      .then(r => r.json())
      .then(d => { setResources(d.resources || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const types = ['all', ...Array.from(new Set(resources.map(r => r.resource_type)))];
  const filtered = filter === 'all' ? resources : resources.filter(r => r.resource_type === filter);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>📚 Wellness Resources</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Articles, videos, and exercises to support your journey.</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {types.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`btn btn-sm ${filter === t ? 'btn-primary' : 'btn-outline'}`}
          >
            {t === 'all' ? 'All' : `${TYPE_ICONS[t] || '📌'} ${t.charAt(0).toUpperCase() + t.slice(1)}`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[1,2,3].map(i => (
            <div key={i} className="card" style={{ width: 320, height: 180, background: 'linear-gradient(90deg, var(--border) 25%, #eee 50%, var(--border) 75%)', backgroundSize: '200% 100%', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {filtered.map(r => (
            <div key={r.id} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {TYPE_ICONS[r.resource_type] || '📌'}
                </div>
                <div>
                  <span className="badge badge-blue" style={{ fontSize: 11 }}>{r.resource_type}</span>
                  <span className="badge badge-green" style={{ fontSize: 11, marginLeft: 6 }}>{r.category.replace(/_/g, ' ')}</span>
                </div>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.4 }}>{r.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>{r.content?.slice(0, 150)}{r.content?.length > 150 ? '…' : ''}</p>
              {r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }}>
                  Open →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
