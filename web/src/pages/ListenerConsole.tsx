import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface QueueSession {
  id: string;
  user_alias: string;
  category_id: string;
  session_type: string;
  status: string;
  age_group: string | null;
  created_at: string;
  started_at?: string;
  mood_before?: number | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  relationship_dating: 'Relationship & Dating', marriage_commitment: 'Marriage & Commitment',
  infidelity_trust: 'Infidelity & Trust', career_stress: 'Career Stress', family_pressure: 'Family Pressure',
  societal_peer: 'Social & Peer', emotional_wellness: 'Emotional Wellness', abuse_safety: 'Abuse & Safety',
  self_discovery: 'Self Discovery', venting_general: 'Just Venting', students_career: 'Student Life',
};

function ago(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export default function ListenerConsole() {
  const { authFetch } = useAuth();
  const nav = useNavigate();
  const [gate, setGate] = useState<'loading' | 'ok' | 'denied' | 'error'>('loading');
  const [listenerName, setListenerName] = useState('');
  const [pending, setPending] = useState<QueueSession[]>([]);
  const [active, setActive] = useState<QueueSession[]>([]);
  const [claiming, setClaiming] = useState('');

  const loadQueue = useCallback(async () => {
    try {
      const r = await authFetch('/listener-console/queue');
      if (!r.ok) return;
      const d = await r.json();
      setPending(Array.isArray(d.pending) ? d.pending : []);
      setActive(Array.isArray(d.active) ? d.active : []);
    } catch { /* keep last */ }
  }, [authFetch]);

  useEffect(() => {
    (async () => {
      try {
        const r = await authFetch('/listener-console/me');
        if (r.status === 403) { setGate('denied'); return; }
        if (!r.ok) { setGate('error'); return; }
        const d = await r.json();
        setListenerName(d.listener?.display_name || d.listener?.alias || 'Listener');
        setGate('ok');
        loadQueue();
      } catch { setGate('error'); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (gate !== 'ok') return;
    const t = setInterval(loadQueue, 5000);
    return () => clearInterval(t);
  }, [gate, loadQueue]);

  async function claim(id: string) {
    setClaiming(id);
    try {
      const r = await authFetch(`/listener-console/sessions/${id}/claim`, { method: 'POST' });
      if (r.ok) { nav(`/listener/session/${id}`); return; }
      await loadQueue();
    } finally { setClaiming(''); }
  }

  if (gate === 'loading') return <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading console…</div>;
  if (gate === 'denied') return (
    <div style={{ padding: 60, textAlign: 'center', maxWidth: 460, margin: '0 auto' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Listener access only</h2>
      <p style={{ color: 'var(--text-secondary)' }}>This console is for registered listeners. If you're a listener, sign in with your listener account.</p>
    </div>
  );
  if (gate === 'error') return <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>Couldn't reach the console. Please try again.</div>;

  const Card = ({ s, mode }: { s: QueueSession; mode: 'pending' | 'active' }) => (
    <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: 16 }}>{s.user_alias || 'Anonymous'}</strong>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{ago(s.created_at)}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 9px', borderRadius: 8, background: 'var(--primary-light)', color: 'var(--primary-dark)' }}>
          {CATEGORY_LABELS[s.category_id] || s.category_id}
        </span>
        {s.age_group && <span style={{ fontSize: 12, padding: '3px 9px', borderRadius: 8, background: 'var(--surface-hover)', color: 'var(--text-secondary)' }}>Age {s.age_group.replace('_', '–')}</span>}
        <span style={{ fontSize: 12, padding: '3px 9px', borderRadius: 8, background: 'var(--surface-hover)', color: 'var(--text-secondary)' }}>{s.session_type}</span>
      </div>
      <button
        className={mode === 'pending' ? 'btn btn-primary btn-sm' : 'btn btn-accent btn-sm'}
        disabled={claiming === s.id}
        onClick={() => mode === 'pending' ? claim(s.id) : nav(`/listener/session/${s.id}`)}
      >
        {claiming === s.id ? 'Connecting…' : mode === 'pending' ? '✋ Take this conversation' : '↩ Resume'}
      </button>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>🛟 Listener Console</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Welcome, {listenerName}. The AI works quietly in the background — you stay warm and present.</p>
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>● Live · refreshing every 5s</span>
      </div>

      {active.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Your active conversations</h2>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {active.map(s => <Card key={s.id} s={s} mode="active" />)}
          </div>
        </section>
      )}

      <section>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Waiting for a listener {pending.length > 0 && <span style={{ color: 'var(--primary-mid)' }}>({pending.length})</span>}</h2>
        {pending.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>☕</div>
            <p>No one is waiting right now. We'll surface new conversations here as they come in.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {pending.map(s => <Card key={s.id} s={s} mode="pending" />)}
          </div>
        )}
      </section>
    </div>
  );
}
