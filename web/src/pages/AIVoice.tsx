import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import Disclaimer from '../components/Disclaimer';

interface AIListener { id: string; name: string; avatar_emoji: string; gender: string; }

const FREE_MINUTES = 5;
const RATE = 1; // ₹1/min (India)

const AGE_GROUPS: { id: string; label: string }[] = [
  { id: '13_17', label: '13–17' },
  { id: '18_24', label: '18–24' },
  { id: '25_34', label: '25–34' },
  { id: '35_49', label: '35–49' },
  { id: '50_64', label: '50–64' },
  { id: '65_70', label: '65–70' },
];

export default function AIVoice() {
  const { listenerId } = useParams<{ listenerId: string }>();
  const { token } = useAuth();
  const nav = useNavigate();

  const [listener, setListener] = useState<AIListener | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'ended'>('idle');
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [topic, setTopic] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [speaking, setSpeaking] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    fetch(`${API}/ai-listeners/${listenerId}`, { headers: h })
      .then(r => r.json()).then(setListener).catch(() => {});
    return () => { cleanup(); };
  }, []);

  function cleanup() {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    dcRef.current?.close();
    pcRef.current?.close();
  }

  async function connect() {
    setStatus('connecting');
    setError('');
    try {
      const r = await fetch(`${API}/ai-voice/token`, {
        method: 'POST', headers: h,
        body: JSON.stringify({ ai_listener_id: listenerId, topic_id: topic || null, mode: 'advisory', age_group: ageGroup || null }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || 'Failed to get voice token');
        setStatus('idle');
        return;
      }
      setAiSessionId(data.ai_session_id);

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      pc.ontrack = e => { audioEl.srcObject = e.streams[0]; };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      // detect when AI is speaking via audio level
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(new MediaStream(pc.getReceivers().map(r => r.track).filter(Boolean)));
      const analyser = ctx.createAnalyser();
      src.connect(analyser);
      const checkLevel = () => {
        const buf = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(buf);
        setSpeaking(buf.reduce((a, b) => a + b, 0) / buf.length > 10);
        if (status !== 'ended') requestAnimationFrame(checkLevel);
      };
      requestAnimationFrame(checkLevel);

      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch('https://api.openai.com/v1/realtime/calls?model=gpt-realtime-mini', {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.token}`, 'Content-Type': 'application/sdp' },
        body: offer.sdp,
      });
      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

      setStatus('connected');
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } catch (err: any) {
      setError(err.message || 'Connection failed');
      setStatus('idle');
    }
  }

  async function disconnect() {
    cleanup();
    setStatus('ended');
    if (aiSessionId) {
      await fetch(`${API}/ai-voice/sessions/${aiSessionId}/end`, {
        method: 'POST', headers: h, body: JSON.stringify({ duration_seconds: elapsed }),
      }).catch(() => {});
    }
  }

  function toggleMute() {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = muted; });
    setMuted(m => !m);
  }

  const chargedMinutes = Math.max(0, Math.floor(elapsed / 60) - FREE_MINUTES);
  const totalCharged = (chargedMinutes * RATE).toFixed(2);
  const isFree = chargedMinutes === 0;

  function fmt(s: number) { return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`; }

  if (!listener) return <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" /></div>;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center', paddingTop: 40 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => nav('/ai-listeners')} style={{ marginBottom: 32, display: 'block', textAlign: 'left' }}>
        ← Back to listeners
      </button>

      {/* Avatar with pulse animation */}
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: 28 }}>
        {status === 'connected' && (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 100 + i * 40, height: 100 + i * 40,
                borderRadius: '50%',
                background: speaking ? 'rgba(147, 51, 234, 0.15)' : 'rgba(147, 51, 234, 0.06)',
                animation: `pulse ${1 + i * 0.3}s ease-in-out infinite`,
                transition: 'background 0.3s',
              }} />
            ))}
          </>
        )}
        <div style={{
          width: 100, height: 100, borderRadius: '50%', fontSize: 52,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: listener.gender === 'female' ? 'linear-gradient(135deg,#F472B6,#C084FC)' : 'linear-gradient(135deg,#60A5FA,#818CF8)',
          position: 'relative', zIndex: 1, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}>
          {listener.avatar_emoji}
        </div>
      </div>

      <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>{listener.name}</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>Voice Listener</p>

      {/* Status + timer */}
      {status === 'connected' && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 700 }}>{fmt(elapsed)}</span>
          </div>
          <span style={{
            fontSize: 13, fontWeight: 700, padding: '4px 14px', borderRadius: 20,
            background: isFree ? '#D1FAE5' : '#FEF3C7',
            color: isFree ? '#065F46' : '#92400E',
          }}>
            {isFree ? `FREE — ${FREE_MINUTES - Math.floor(elapsed / 60)} free min remaining` : `₹${totalCharged} charged at ₹1/min`}
          </span>
        </div>
      )}

      {status === 'idle' && (
        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textAlign: 'left' }}>Your age group</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {AGE_GROUPS.map(a => (
              <button key={a.id} onClick={() => setAgeGroup(a.id)} style={{
                padding: '8px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                border: `2px solid ${ageGroup === a.id ? 'var(--primary-mid)' : 'var(--border)'}`,
                background: ageGroup === a.id ? 'var(--primary-light)' : 'var(--surface)',
                color: ageGroup === a.id ? 'var(--primary-dark)' : 'var(--text-secondary)',
              }}>{a.label}</button>
            ))}
          </div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, textAlign: 'left' }}>Topic (optional)</label>
          <select value={topic} onChange={e => setTopic(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 14, marginBottom: 8 }}>
            <option value="">General — whatever's on your mind</option>
            <option value="relationship_dating">Relationships</option>
            <option value="career_stress">Career Stress</option>
            <option value="emotional_wellness">Emotional Wellness</option>
            <option value="family_pressure">Family</option>
            <option value="self_discovery">Self-Discovery</option>
            <option value="venting_general">Just venting</option>
          </select>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'left' }}>First 5 min free, then ₹1/min</p>
          <Disclaimer variant="ai" style={{ marginTop: 14, textAlign: 'left' }} />
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEE2E2', borderRadius: 10, color: '#991B1B', fontSize: 14, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {status === 'ended' ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Session ended</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Duration: {fmt(elapsed)}</p>
          {chargedMinutes > 0 && <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Total charged: <strong>₹{totalCharged}</strong></p>}
          <button className="btn btn-primary" onClick={() => nav('/ai-listeners')}>Back to listeners</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {status === 'connected' && (
            <button onClick={toggleMute} style={{
              width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 22,
              background: muted ? '#FEE2E2' : 'var(--surface)', boxShadow: 'var(--shadow)',
            }}>
              {muted ? '🔇' : '🎤'}
            </button>
          )}
          <button
            onClick={status === 'connected' ? disconnect : connect}
            disabled={status === 'connecting'}
            style={{
              width: 72, height: 72, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 28,
              background: status === 'connected' ? '#DC2626' : 'linear-gradient(135deg,#17A589,#0e7a5f)',
              color: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', transition: 'all 0.2s',
            }}
          >
            {status === 'connecting' ? '⏳' : status === 'connected' ? '📵' : '📞'}
          </button>
        </div>
      )}

      {status === 'connecting' && (
        <p style={{ marginTop: 20, color: 'var(--text-secondary)', fontSize: 14 }}>Connecting to {listener.name}…</p>
      )}

      <style>{`
        @keyframes pulse { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity:0.7; } 50% { transform: translate(-50%,-50%) scale(1.05); opacity:0.4; } }
      `}</style>
    </div>
  );
}
