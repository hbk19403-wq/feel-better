import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';

interface Session {
  id: string;
  category?: string;
  category_id?: string;
  category_name?: string;
  status: string;
  listener_name?: string;
  user_alias: string;
  started_at?: string;
  ended_at?: string;
  duration_minutes?: number;
  listener_rating?: number;
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'var(--accent)',
  active: 'var(--primary-mid)',
  pending: 'var(--warning)',
  cancelled: 'var(--text-tertiary)',
};

export default function History() {
  const { token } = useAuth();
  const nav = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/sessions/history`, { headers })
      .then(r => r.json())
      .then(d => { setSessions(d.sessions || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div className="spinner spinner-dark" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>🗂️ Your Sessions</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{sessions.length} total conversations</p>
      </div>

      {sessions.length === 0 ? (
        <div className="card" style={{ padding: 64, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>💬</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No sessions yet</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>When you connect with a listener, your conversations will appear here.</p>
          <button className="btn btn-accent" onClick={() => nav('/match')}>Find a listener →</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sessions.map(s => (
            <div key={s.id} className="card" style={{ padding: 24, display: 'flex', gap: 20, alignItems: 'center', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onClick={() => s.status === 'active' && nav(`/session/${s.id}`)}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow)')}
            >
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                🎧
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <p style={{ fontWeight: 600, fontSize: 15 }}>{s.listener_name || 'Unknown listener'}</p>
                  <span style={{ fontSize: 12, fontWeight: 500, color: STATUS_COLORS[s.status] || 'var(--text-tertiary)', background: 'var(--bg)', padding: '2px 8px', borderRadius: 20, border: `1px solid currentColor` }}>
                    {s.status}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  {(s.category_name || s.category_id || s.category || 'Conversation').replace(/_/g, ' ')} · As <em>{s.user_alias}</em>
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  {s.started_at ? new Date(s.started_at).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                  {s.duration_minutes ? ` · ${s.duration_minutes} min` : ''}
                </p>
              </div>
              {s.listener_rating && (
                <div style={{ flexShrink: 0 }}>
                  <span style={{ color: '#F59E0B', fontSize: 18 }}>{'★'.repeat(s.listener_rating)}</span>
                </div>
              )}
              {s.status === 'active' && (
                <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>Rejoin →</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
