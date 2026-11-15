import { useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';

const MOODS = ['😢', '😟', '😐', '🙂', '😊'];
const MOOD_LABELS = ['Much worse', 'Worse', 'Same', 'Better', 'Much better'];

export default function Review() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const nav = useNavigate();
  const [moodAfter, setMoodAfter] = useState(3);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch(`${API}/sessions/${id}/review`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ listener_rating: rating, mood_after: moodAfter, session_comment: comment }),
      });
      setDone(true);
    } catch {}
    setSubmitting(false);
  }

  if (done) {
    return (
      <div style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card fade-up" style={{ maxWidth: 480, width: '100%', padding: 56, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>💙</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 12 }}>Thank you for reaching out</h1>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
            You did something brave today. Talking about how you feel takes real courage.
          </p>
          <p style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 500, marginBottom: 32 }}>
            Remember: it's okay to not be okay. We're always here.
          </p>
          <button className="btn btn-primary btn-lg btn-full" onClick={() => nav('/')}>
            Go home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card fade-up" style={{ maxWidth: 480, width: '100%', padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌟</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>How did it go?</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Your feedback helps us improve</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Mood after */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 12, color: 'var(--text-secondary)', fontSize: 14 }}>How do you feel compared to before?</label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {MOODS.map((emoji, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setMoodAfter(i + 1)}
                  style={{
                    fontSize: 28, background: moodAfter === i + 1 ? 'var(--primary-light)' : 'none',
                    border: `2px solid ${moodAfter === i + 1 ? 'var(--primary-mid)' : 'transparent'}`,
                    borderRadius: 10, padding: '8px 10px', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  title={MOOD_LABELS[i]}
                >{emoji}</button>
              ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--accent)', marginTop: 8, fontWeight: 500 }}>{MOOD_LABELS[moodAfter - 1]}</p>
          </div>

          {/* Listener rating */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 12, color: 'var(--text-secondary)', fontSize: 14 }}>Rate your listener</label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {[1,2,3,4,5].map(s => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setRating(s)}
                  style={{ fontSize: 32, background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.1s', color: s <= rating ? '#F59E0B' : '#D1D5DB' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.2)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >★</button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="input-group">
            <label>Any comments? (optional)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="What helped? What could be better?"
              rows={3}
              style={{ resize: 'vertical', padding: '12px 16px', border: '1.5px solid var(--border)', borderRadius: 8, width: '100%', fontSize: 14 }}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={submitting}>
            {submitting ? <span className="spinner" /> : 'Submit & finish'}
          </button>
        </form>
      </div>
    </div>
  );
}
