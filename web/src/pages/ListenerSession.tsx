import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Msg { id: string; sender: 'caller' | 'listener' | 'system'; content: string; created_at: string; }
interface Assist {
  feeling: string;
  tone: { primary: string; secondary: string; intensity: string };
  canSay: string[]; avoid: string[]; followUp: string[];
  riskPresent: boolean; escalate: boolean; escalationReason: string; recommendedPath: string;
}
interface Caller { age_group: string | null; language: string; returning: boolean; }

const CATEGORY_LABELS: Record<string, string> = {
  relationship_dating: 'Relationship & Dating', marriage_commitment: 'Marriage & Commitment',
  infidelity_trust: 'Infidelity & Trust', career_stress: 'Career Stress', family_pressure: 'Family Pressure',
  societal_peer: 'Social & Peer', emotional_wellness: 'Emotional Wellness', abuse_safety: 'Abuse & Safety',
  self_discovery: 'Self Discovery', venting_general: 'Just Venting', students_career: 'Student Life',
};

function Panel({ title, accent, children }: { title: string; accent?: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: accent || 'var(--text-tertiary)', marginBottom: 12 }}>{title}</h3>
      {children}
    </div>
  );
}

export default function ListenerSession() {
  const { id } = useParams<{ id: string }>();
  const { authFetch } = useAuth();
  const nav = useNavigate();

  const [session, setSession] = useState<any>(null);
  const [caller, setCaller] = useState<Caller | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [categoryGuidance, setCategoryGuidance] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [assist, setAssist] = useState<Assist | null>(null);
  const [assistLoading, setAssistLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('low');
  const [escalated, setEscalated] = useState(false);
  const [savedAt, setSavedAt] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [ending, setEnding] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hydratedRef = useRef(false);

  const load = useCallback(async () => {
    const r = await authFetch(`/listener-console/sessions/${id}`);
    if (!r.ok) return;
    const d = await r.json();
    setSession(d.session);
    setCaller(d.caller || null);
    setMessages(Array.isArray(d.messages) ? d.messages : []);
    setCategoryGuidance(d.categoryGuidance || null);
    // Hydrate the editable note/risk/escalation fields only once, on first load.
    // The 4s poll must not clobber the listener's in-progress, unsaved edits.
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      if (d.session?.listener_notes) setNotes(d.session.listener_notes);
      if (d.session?.risk_level) setRisk(d.session.risk_level);
      if (typeof d.session?.escalated === 'boolean') setEscalated(d.session.escalated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authFetch, id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function runAssist() {
    setAssistLoading(true);
    try {
      const r = await authFetch(`/listener-console/sessions/${id}/assist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (r.ok) {
        const d = await r.json();
        setAssist(d);
        if (d.riskPresent && risk === 'low') setRisk(d.escalate ? 'high' : 'medium');
        if (d.escalate) setEscalated(true);
      }
    } finally { setAssistLoading(false); }
  }

  // Auto-run assist when a new caller message arrives.
  const lastCaller = messages.filter(m => m.sender === 'caller').slice(-1)[0]?.id;
  const seenRef = useRef<string>('');
  useEffect(() => {
    if (lastCaller && lastCaller !== seenRef.current) {
      seenRef.current = lastCaller;
      runAssist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCaller]);

  async function send() {
    const text = reply.trim();
    if (!text || sending) return;
    setReply('');
    setSending(true);
    setMessages(m => [...m, { id: `tmp-${Date.now()}`, sender: 'listener', content: text, created_at: new Date().toISOString() }]);
    try {
      await authFetch(`/listener-console/sessions/${id}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text }) });
      load();
    } finally { setSending(false); }
  }

  function useSuggestion(s: string) { setReply(r => (r ? r + ' ' : '') + s); }

  async function saveNotes() {
    await authFetch(`/listener-console/sessions/${id}/notes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listener_notes: notes, risk_level: risk, escalated }),
    });
    setSavedAt(new Date().toLocaleTimeString());
  }

  async function endSession() {
    setEnding(true);
    try {
      await saveNotes();
      const r = await authFetch(`/listener-console/sessions/${id}/end`, { method: 'POST' });
      if (r.ok) setSummary(await r.json());
    } finally { setEnding(false); }
  }

  if (!session) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading session…</div>;

  const cat = session.category_id;
  const escalateBanner = assist?.escalate;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => nav('/listener')}>← Queue</button>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>Conversation with {session.user_alias || 'Anonymous'}</h1>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-tertiary)' }}>status: {session.status}</span>
      </div>

      {escalateBanner && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
          <p style={{ fontWeight: 800, color: '#991B1B', marginBottom: 6 }}>🚨 CRISIS ALERT — {assist?.escalationReason}</p>
          <ol style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 1.6, paddingLeft: 20, margin: 0 }}>
            <li>Stay calm. Ask directly: “Are you thinking about hurting yourself right now?”</li>
            <li>Ask if they are in immediate danger.</li>
            <li>Encourage <strong>14416</strong> (call/text) or <strong>112</strong>. Text <strong>1800-599-0019</strong>.</li>
            <li>Escalate to a supervisor / licensed crisis professional. Do not promise secrecy.</li>
          </ol>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
        {/* LEFT: transcript + composer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel title="Caller overview">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 14 }}>
              <div><span style={{ color: 'var(--text-tertiary)' }}>Alias:</span> <strong>{session.user_alias || 'Anonymous'}</strong></div>
              <div><span style={{ color: 'var(--text-tertiary)' }}>Category:</span> <strong>{CATEGORY_LABELS[cat] || cat}</strong></div>
              <div><span style={{ color: 'var(--text-tertiary)' }}>Age:</span> <strong>{caller?.age_group ? caller.age_group.replace('_', '–') : 'Unknown'}</strong></div>
              <div><span style={{ color: 'var(--text-tertiary)' }}>Language:</span> <strong>{caller?.language || 'English'}</strong></div>
              <div><span style={{ color: 'var(--text-tertiary)' }}>History:</span> <strong>{caller?.returning ? 'Returning' : 'First-time'}</strong></div>
            </div>
          </Panel>

          <Panel title="Live transcript">
            <div style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No messages yet. When the caller speaks, their words appear here and the assist panel updates.</p>}
              {messages.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'listener' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%', padding: '9px 13px', borderRadius: 12, fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                    background: m.sender === 'listener' ? 'var(--primary-mid)' : m.sender === 'system' ? 'var(--surface-hover)' : '#F1F5F9',
                    color: m.sender === 'listener' ? 'white' : 'var(--text-primary)',
                  }}>
                    <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 2 }}>{m.sender === 'listener' ? 'You' : m.sender === 'system' ? 'System' : 'Caller'}</div>
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Write your reply… the final words are always yours"
                rows={2}
                style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', resize: 'none', fontSize: 14, lineHeight: 1.5, outline: 'none' }}
              />
              <button className="btn btn-primary" onClick={send} disabled={sending || !reply.trim()} style={{ alignSelf: 'flex-end' }}>Send</button>
            </div>
          </Panel>

          {categoryGuidance && (
            <Panel title="Category support card" accent="var(--primary-mid)">
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{categoryGuidance}</p>
            </Panel>
          )}
        </div>

        {/* RIGHT: AI assist + notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel title="AI assist (safety net)" accent="#0E7490">
            <button className="btn btn-outline btn-sm" onClick={runAssist} disabled={assistLoading} style={{ marginBottom: 12 }}>
              {assistLoading ? 'Reading…' : '↻ Refresh guidance'}
            </button>
            {!assist && !assistLoading && <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Guidance appears as the caller speaks.</p>}
            {assist && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{
                  borderRadius: 10, padding: '10px 12px',
                  background: assist.escalate ? '#FEF2F2' : assist.riskPresent ? '#FFFBEB' : '#ECFDF5',
                  border: `1px solid ${assist.escalate ? '#FCA5A5' : assist.riskPresent ? '#FDE68A' : '#A7F3D0'}`,
                }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: assist.escalate ? '#991B1B' : assist.riskPresent ? '#92400E' : '#065F46' }}>
                    {assist.escalate ? '🚨 Escalate now' : assist.riskPresent ? '⚠️ Risk present' : '✓ No acute risk'}
                  </p>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>Recommended path: <strong>{assist.recommendedPath}</strong></p>
                </div>

                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>Feeling</p>
                  <p style={{ fontSize: 14 }}>{assist.feeling}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>Tone</p>
                  <p style={{ fontSize: 14 }}>{assist.tone.primary}{assist.tone.secondary ? ` · ${assist.tone.secondary}` : ''} <span style={{ color: 'var(--text-tertiary)' }}>({assist.tone.intensity})</span></p>
                </div>

                {assist.canSay.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#065F46', textTransform: 'uppercase', marginBottom: 6 }}>You can say (tap to use)</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {assist.canSay.map((s, i) => (
                        <button key={i} onClick={() => useSuggestion(s)} style={{ textAlign: 'left', fontSize: 13, color: 'var(--text-primary)', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', lineHeight: 1.45 }}>“{s}”</button>
                      ))}
                    </div>
                  </div>
                )}
                {assist.followUp.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase', marginBottom: 6 }}>Gentle follow-ups</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {assist.followUp.map((s, i) => (
                        <button key={i} onClick={() => useSuggestion(s)} style={{ textAlign: 'left', fontSize: 13, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', lineHeight: 1.45 }}>“{s}”</button>
                      ))}
                    </div>
                  </div>
                )}
                {assist.avoid.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', marginBottom: 6 }}>Avoid</p>
                    {assist.avoid.map((s, i) => (
                      <p key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 6, lineHeight: 1.45, marginBottom: 4 }}><span>✕</span><span>{s}</span></p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Panel>

          <Panel title="Listener notes & escalation">
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {(['low', 'medium', 'high'] as const).map(r => (
                <button key={r} onClick={() => setRisk(r)} style={{
                  flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                  border: `1.5px solid ${risk === r ? (r === 'high' ? '#EF4444' : r === 'medium' ? '#F59E0B' : '#10B981') : 'var(--border)'}`,
                  background: risk === r ? (r === 'high' ? '#FEF2F2' : r === 'medium' ? '#FFFBEB' : '#ECFDF5') : 'var(--surface)',
                  color: risk === r ? (r === 'high' ? '#991B1B' : r === 'medium' ? '#92400E' : '#065F46') : 'var(--text-secondary)',
                }}>{r} risk</button>
              ))}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={escalated} onChange={e => setEscalated(e.target.checked)} /> Escalated to supervisor / crisis professional
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Main concern, emotional state, support provided, resources shared, follow-up… (private)"
              rows={4}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', resize: 'vertical', fontSize: 13, lineHeight: 1.5, outline: 'none' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <button className="btn btn-outline btn-sm" onClick={saveNotes}>Save notes</button>
              {savedAt && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Saved {savedAt}</span>}
            </div>
          </Panel>

          {!summary ? (
            <button className="btn btn-danger" onClick={endSession} disabled={ending}>{ending ? 'Wrapping up…' : '⏹ End & generate summary'}</button>
          ) : (
            <Panel title="After-call summary" accent="#065F46">
              <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>{summary.summary}</p>
              {summary.emotions?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {summary.emotions.map((e: string) => <span key={e} style={{ fontSize: 12, padding: '3px 9px', borderRadius: 8, background: 'var(--surface-hover)' }}>{e}</span>)}
                </div>
              )}
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Risk level: <strong>{summary.riskLevel}</strong></p>
              {summary.recommendedFollowUp && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Follow-up: {summary.recommendedFollowUp}</p>}
              <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={() => nav('/listener')}>Back to queue</button>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
