import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

interface Group { id: string; slug: string; name: string; description?: string; emoji?: string; post_count: number; }
interface Post { id: string; author_alias: string; title?: string; body: string; support_count: number; comment_count: number; created_at: string; }
interface Comment { id: string; author_alias: string; body: string; created_at: string; }
interface ChatMsg { id: string; author_alias: string; body: string; is_crisis?: boolean; created_at: string; }

// Rotating gradient palette so each group tile feels distinct and vivid.
const GRADS = [
  'linear-gradient(135deg,#6366F1,#4F46E5)',
  'linear-gradient(135deg,#EC4899,#DB2777)',
  'linear-gradient(135deg,#17A589,#0e7a5f)',
  'linear-gradient(135deg,#F59E0B,#D97706)',
  'linear-gradient(135deg,#8B5CF6,#7C3AED)',
  'linear-gradient(135deg,#2E75B6,#1A3C5E)',
  'linear-gradient(135deg,#EF4444,#B91C1C)',
  'linear-gradient(135deg,#10B981,#047857)',
];
const gradFor = (i: number) => GRADS[i % GRADS.length];

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Community() {
  const { authFetch } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [active, setActive] = useState<Group | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [body, setBody] = useState('');
  const [title, setTitle] = useState('');
  const [alias, setAlias] = useState('');
  const [posting, setPosting] = useState(false);
  const [crisis, setCrisis] = useState(false);

  const [openPost, setOpenPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentBody, setCommentBody] = useState('');

  // Live chat room state
  const [tab, setTab] = useState<'discuss' | 'chat'>('discuss');
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatCrisis, setChatCrisis] = useState(false);
  const [chatSetupPending, setChatSetupPending] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const lastChatAt = useRef<string>('');

  useEffect(() => {
    authFetch('/community/groups')
      .then(r => r.json())
      .then(d => { setGroups(d.groups || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function openGroup(g: Group, idx: number) {
    setActive(g); setActiveIdx(idx); setPosts([]); setOpenPost(null);
    setTab('discuss'); setChat([]); setChatCrisis(false); setChatSetupPending(false); lastChatAt.current = '';
    authFetch(`/community/groups/${g.slug}/posts`)
      .then(r => r.json())
      .then(d => setPosts(d.posts || []))
      .catch(() => {});
  }

  // Poll the live chat room while the Chat tab is open.
  const loadChat = useCallback(async () => {
    if (!active) return;
    try {
      const after = lastChatAt.current ? `?after=${encodeURIComponent(lastChatAt.current)}` : '';
      const r = await authFetch(`/community/groups/${active.slug}/chat${after}`);
      if (!r.ok) return;
      const d = await r.json();
      if (d.setup_pending) setChatSetupPending(true);
      const incoming: ChatMsg[] = Array.isArray(d.messages) ? d.messages : [];
      if (incoming.length) {
        lastChatAt.current = incoming[incoming.length - 1].created_at;
        setChat(prev => {
          const seen = new Set(prev.map(m => m.id));
          return [...prev, ...incoming.filter(m => !seen.has(m.id))];
        });
      }
    } catch { /* keep last */ }
  }, [active, authFetch]);

  useEffect(() => {
    if (!active || tab !== 'chat') return;
    loadChat();
    const t = setInterval(loadChat, 3000);
    return () => clearInterval(t);
  }, [active, tab, loadChat]);

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chat]);

  async function sendChat() {
    const body = chatDraft.trim();
    if (!body || !active || chatSending) return;
    setChatSending(true); setChatCrisis(false);
    setChatDraft('');
    try {
      const r = await authFetch(`/community/groups/${active.slug}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, alias: alias || undefined }),
      });
      const d = await r.json();
      if (r.ok && d.message) {
        lastChatAt.current = d.message.created_at;
        setChat(prev => (prev.some(m => m.id === d.message.id) ? prev : [...prev, d.message]));
        if (d.crisis) setChatCrisis(true);
      }
    } finally { setChatSending(false); }
  }

  async function submitPost() {
    if (!body.trim() || !active) return;
    setPosting(true); setCrisis(false);
    try {
      const r = await authFetch(`/community/groups/${active.slug}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, title: title || undefined, alias: alias || undefined }),
      });
      const d = await r.json();
      if (r.ok && d.post) {
        setPosts(p => [d.post, ...p]);
        setBody(''); setTitle('');
        if (d.crisis) setCrisis(true);
      }
    } finally { setPosting(false); }
  }

  async function support(p: Post) {
    const r = await authFetch(`/community/posts/${p.id}/support`, { method: 'POST' });
    if (r.ok) { const d = await r.json(); setPosts(ps => ps.map(x => x.id === p.id ? { ...x, support_count: d.support_count } : x)); }
  }

  function openDetail(p: Post) {
    setOpenPost(openPost?.id === p.id ? null : p); setComments([]);
    authFetch(`/community/posts/${p.id}`)
      .then(r => r.json())
      .then(d => setComments(d.comments || []))
      .catch(() => {});
  }

  async function submitComment() {
    if (!commentBody.trim() || !openPost) return;
    const r = await authFetch(`/community/posts/${openPost.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: commentBody, alias: alias || undefined }),
    });
    const d = await r.json();
    if (r.ok && d.comment) {
      setComments(c => [...c, d.comment]);
      setCommentBody('');
      setPosts(ps => ps.map(x => x.id === openPost.id ? { ...x, comment_count: x.comment_count + 1 } : x));
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div className="spinner spinner-dark" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );

  // ---------- Group list ----------
  if (!active) {
    return (
      <div>
        <div className="anim-gradient" style={{ borderRadius: 24, padding: '38px 34px', marginBottom: 24, position: 'relative', overflow: 'hidden', background: 'linear-gradient(120deg,#7C3AED,#DB2777,#F59E0B)', color: 'white' }}>
          <div style={{ position: 'absolute', top: -30, right: -10, fontSize: 150, opacity: 0.14, animation: 'float 6s ease-in-out infinite' }}>🫂</div>
          <div style={{ position: 'relative', maxWidth: 620 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.85 }}>Community</span>
            <h1 style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1, margin: '10px 0 12px' }}>You're not the only one<br />feeling this.</h1>
            <p style={{ fontSize: 15, opacity: 0.92, lineHeight: 1.5 }}>Open, anonymous conversations. Share what's on your heart — no judgment, no names required.</p>
          </div>
        </div>

        <div style={{ borderRadius: 14, padding: '12px 16px', marginBottom: 24, background: 'var(--bg)', fontSize: 13, color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          💬 Posts are anonymous by default. This is peer support, not professional care. In crisis? Call or text <strong>14416</strong>, or <strong>112</strong> if in danger.
        </div>

        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 18 }}>
          {groups.map((g, i) => (
            <div key={g.id} style={{ borderRadius: 18, overflow: 'hidden', background: 'white', boxShadow: 'var(--shadow)', cursor: 'pointer', transition: 'transform .18s, box-shadow .18s', display: 'flex', flexDirection: 'column' }}
              onClick={() => openGroup(g, i)}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}>
              <div style={{ background: gradFor(i), padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', bottom: -14, right: -6, fontSize: 70, opacity: 0.22 }}>{g.emoji || '💬'}</div>
                <div style={{ fontSize: 32, position: 'relative' }}>{g.emoji || '💬'}</div>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700 }}>{g.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>{g.description}</p>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600 }}>{g.post_count} {g.post_count === 1 ? 'post' : 'posts'} →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------- Single group ----------
  const grad = gradFor(activeIdx);
  return (
    <div>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => setActive(null)}>← All groups</button>

      <div style={{ borderRadius: 20, padding: '26px 28px', marginBottom: 22, background: grad, color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -8, fontSize: 120, opacity: 0.16, animation: 'float 7s ease-in-out infinite' }}>{active.emoji}</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, position: 'relative' }}>{active.emoji} {active.name}</h1>
        <p style={{ opacity: 0.92, fontSize: 14, marginTop: 4, position: 'relative' }}>{active.description}</p>
      </div>

      {/* Tabs: Discussions (async) vs Live Chat (real-time room) */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'var(--bg)', padding: 5, borderRadius: 14, border: '1px solid var(--border)', width: 'fit-content' }}>
        {([['discuss', '📝 Discussions'], ['chat', '💬 Live Chat']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            border: 'none', cursor: 'pointer', borderRadius: 10, padding: '9px 18px', fontSize: 14, fontWeight: 600,
            background: tab === id ? grad : 'transparent',
            color: tab === id ? 'white' : 'var(--text-secondary)', transition: 'all .15s',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'chat' ? (
        <div>
          <div style={{ borderRadius: 14, padding: '12px 16px', marginBottom: 16, background: 'var(--accent-light)', fontSize: 13, color: '#065F46', border: '1px solid #A7F3D0' }}>
            💬 This is a live room — anyone here right now can see and reply. Stay anonymous, be kind. Prefer one-on-one? <strong>Talk to a listener</strong> from the Connect tab.
          </div>
          <div style={{ borderRadius: 18, background: 'white', boxShadow: 'var(--shadow)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 480 }}>
            <div ref={chatScrollRef} style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {chatSetupPending ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>🛠️</div>
                  Chat rooms are being set up. Please check back shortly.
                </div>
              ) : chat.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>👋</div>
                  No one's talking yet. Say hi and start the room.
                </div>
              ) : chat.map(m => (
                <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ width: 32, height: 32, borderRadius: 99, flexShrink: 0, background: grad, color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                    {m.author_alias.charAt(0).toUpperCase()}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                      <strong style={{ color: 'var(--text-secondary)' }}>{m.author_alias}</strong> · {timeAgo(m.created_at)}
                    </div>
                    <div style={{ display: 'inline-block', background: m.is_crisis ? '#FEF2F2' : 'var(--bg)', border: m.is_crisis ? '1px solid #FECACA' : '1px solid var(--border)', borderRadius: 14, padding: '9px 13px', fontSize: 14, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {m.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {chatCrisis && (
              <div style={{ fontSize: 13, background: '#FEF2F2', color: '#991B1B', padding: '10px 14px', borderTop: '1px solid #FECACA' }}>
                It sounds heavy right now. You deserve support — call <strong>14416</strong> (Tele-MANAS), <strong>1800-599-0019</strong> (KIRAN), or <strong>112</strong> if in immediate danger.
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid var(--border)', alignItems: 'center' }}>
              <input value={alias} onChange={e => setAlias(e.target.value)} placeholder="🙈 Anonymous" maxLength={40}
                style={{ width: 130, padding: '10px 12px', borderRadius: 999, border: '1px solid var(--border)', fontSize: 13, flexShrink: 0 }} />
              <input value={chatDraft} onChange={e => setChatDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                placeholder="Type a message to the room…" maxLength={2000}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 999, border: '1px solid var(--border)', fontSize: 14 }} />
              <button disabled={chatSending || !chatDraft.trim()} onClick={sendChat}
                style={{ border: 'none', cursor: 'pointer', borderRadius: 999, padding: '10px 20px', fontWeight: 700, fontSize: 14, color: 'white', background: grad, opacity: chatSending || !chatDraft.trim() ? 0.5 : 1, flexShrink: 0 }}>
                {chatSending ? '…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      ) : (
      <>
      {/* Composer */}
      <div style={{ borderRadius: 18, padding: 22, marginBottom: 24, background: 'white', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (optional)" maxLength={160}
          style={{ padding: '11px 14px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 14 }} />
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Share what's on your mind…" rows={4}
          style={{ padding: '11px 14px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }} />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input value={alias} onChange={e => setAlias(e.target.value)} placeholder="🙈 Anonymous" maxLength={40}
            style={{ padding: '9px 14px', borderRadius: 999, border: '1px solid var(--border)', fontSize: 13, width: 170 }} />
          <button disabled={posting || !body.trim()} onClick={submitPost} style={{ marginLeft: 'auto', cursor: 'pointer', border: 'none', borderRadius: 999, padding: '10px 22px', fontWeight: 700, fontSize: 14, color: 'white', background: grad, opacity: posting || !body.trim() ? 0.5 : 1 }}>
            {posting ? 'Posting…' : 'Post anonymously'}
          </button>
        </div>
        {crisis && (
          <div style={{ fontSize: 13, background: '#FEF2F2', color: '#991B1B', padding: '10px 12px', borderRadius: 10 }}>
            It sounds like you're carrying something really heavy. You deserve support right now — call or text <strong>14416</strong>, text HELLO to <strong>1800-599-0019</strong>, or call <strong>112</strong> if in immediate danger.
          </div>
        )}
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div style={{ borderRadius: 18, padding: 48, textAlign: 'center', color: 'var(--text-secondary)', background: 'white', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 46, marginBottom: 12 }}>🌱</div>
          Be the first to open up here.
        </div>
      ) : (
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {posts.map(p => (
            <div key={p.id} style={{ borderRadius: 18, overflow: 'hidden', background: 'white', boxShadow: 'var(--shadow)', display: 'flex' }}>
              <div style={{ width: 5, background: grad, flexShrink: 0 }} />
              <div style={{ padding: 20, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 12, color: 'var(--text-tertiary)' }}>
                  <span style={{ width: 26, height: 26, borderRadius: 99, background: grad, color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{p.author_alias.charAt(0).toUpperCase()}</span>
                  <strong style={{ color: 'var(--text-secondary)' }}>{p.author_alias}</strong> · {timeAgo(p.created_at)}
                </div>
                {p.title && <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{p.title}</h3>}
                <p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{p.body}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => support(p)}>🫶 I feel this · {p.support_count}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => openDetail(p)}>💬 {p.comment_count} {p.comment_count === 1 ? 'reply' : 'replies'}</button>
                </div>

                {openPost?.id === p.id && (
                  <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    {comments.map(c => (
                      <div key={c.id} style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                          <strong style={{ color: 'var(--text-secondary)' }}>{c.author_alias}</strong> · {timeAgo(c.created_at)}
                        </div>
                        <p style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{c.body}</p>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <input value={commentBody} onChange={e => setCommentBody(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                        placeholder="Offer support or a suggestion…"
                        style={{ flex: 1, padding: '9px 14px', borderRadius: 999, border: '1px solid var(--border)', fontSize: 13 }} />
                      <button className="btn btn-primary btn-sm" disabled={!commentBody.trim()} onClick={submitComment}>Send</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </>
      )}
    </div>
  );
}
