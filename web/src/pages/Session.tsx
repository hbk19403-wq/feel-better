import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';

interface SessionData {
  id: string;
  user_alias: string;
  listener_name?: string;
  status: string;
  started_at?: string;
  category: string;
}

export default function Session() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const nav = useNavigate();
  const [session, setSession] = useState<SessionData | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [extending, setExtending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [showExtend, setShowExtend] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    fetch(`${API}/sessions/${id}`, { headers })
      .then(r => r.json())
      .then(d => { setSession(d.session); })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed(e => {
        if (e === 25 * 60) setShowExtend(true);
        return e + 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  async function endSession() {
    setEnding(true);
    try {
      await fetch(`${API}/sessions/${id}/end`, { method: 'POST', headers });
      nav(`/review/${id}`);
    } catch {
      nav('/');
    }
  }

  async function extendSession() {
    setExtending(true);
    setShowExtend(false);
    setTimeout(() => setExtending(false), 1000);
  }

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: 'linear-gradient(160deg, #0f2744 0%, #1A3C5E 40%, #17A589 100%)',
        borderRadius: 24,
        padding: '52px 48px',
        width: '100%',
        maxWidth: 520,
        textAlign: 'center',
        color: 'white',
        position: 'relative',
      }}>
        {/* Crisis button */}
        <button
          onClick={() => setCrisisOpen(true)}
          style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, padding: '6px 12px', color: 'white', fontSize: 13, cursor: 'pointer' }}
        >
          🛡️ Crisis help
        </button>

        {/* Listener avatar */}
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 40, border: '3px solid rgba(255,255,255,0.3)' }}>
          🎧
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{session?.listener_name || 'Your Listener'}</h2>
        <p style={{ opacity: 0.75, fontSize: 14, marginBottom: 28 }}>Speaking with you anonymously as <strong>{session?.user_alias || '…'}</strong></p>

        {/* Timer */}
        <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 16, padding: '20px 32px', marginBottom: 36, display: 'inline-block' }}>
          <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: 2, fontVariantNumeric: 'tabular-nums' }}>{timeStr}</div>
          <p style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>Session time</p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 32 }}>
          {[
            { icon: muted ? '🔇' : '🎤', label: muted ? 'Unmute' : 'Mute', action: () => setMuted(m => !m), active: muted },
            { icon: speaker ? '🔊' : '🔈', label: speaker ? 'Speaker on' : 'Speaker off', action: () => setSpeaker(s => !s), active: !speaker },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.action}
              style={{
                background: btn.active ? 'rgba(231,76,60,0.25)' : 'rgba(255,255,255,0.12)',
                border: `1.5px solid ${btn.active ? 'rgba(231,76,60,0.6)' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: 12,
                padding: '14px 20px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                fontSize: 24,
                transition: 'all 0.15s',
                minWidth: 80,
              }}
            >
              {btn.icon}
              <span style={{ fontSize: 11, opacity: 0.8 }}>{btn.label}</span>
            </button>
          ))}
        </div>

        <button
          className="btn btn-danger btn-lg"
          onClick={endSession}
          disabled={ending}
          style={{ width: '100%', fontSize: 16 }}
        >
          {ending ? <span className="spinner" /> : '📞 End session'}
        </button>

        {/* 25-min extend prompt */}
        {showExtend && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
            <p style={{ fontSize: 20, fontWeight: 700 }}>25 minutes passed ⏰</p>
            <p style={{ opacity: 0.8, fontSize: 15 }}>Would you like to continue?</p>
            <button className="btn btn-accent btn-lg" onClick={extendSession} style={{ width: '100%' }}>Continue session</button>
            <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', width: '100%' }} onClick={endSession}>End now</button>
          </div>
        )}
      </div>

      {/* Crisis modal */}
      {crisisOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card fade-in" style={{ maxWidth: 440, width: '100%', padding: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--danger)' }}>🛡️ Crisis Resources</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>If you're in immediate danger or need urgent support:</p>
            {[
              { name: '988 Suicide & Crisis Lifeline', desc: 'Call or text 988', color: '#E74C3C' },
              { name: 'Crisis Text Line', desc: 'Text HELLO to 741741', color: '#E67E22' },
              { name: 'Emergency Services', desc: 'Call 911', color: '#C0392B' },
            ].map(r => (
              <div key={r.name} style={{ background: '#FEF9F9', border: '1px solid #FADBD8', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
                <p style={{ fontWeight: 600, fontSize: 15, color: r.color }}>{r.name}</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{r.desc}</p>
              </div>
            ))}
            <button className="btn btn-ghost btn-full" style={{ marginTop: 8 }} onClick={() => setCrisisOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
