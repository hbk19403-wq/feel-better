import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../context/AuthContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1A3C5E 0%, #2E75B6 50%, #17A589 100%)', padding: 24 }}>
      <div className="card fade-up" style={{ width: '100%', maxWidth: 420, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #1A3C5E, #17A589)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>
            🌿
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 4 }}>Reset your password</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>We'll email you a link to set a new one.</p>
        </div>

        {sent ? (
          <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: 8, fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6 }}>
            If an account exists for that email, a reset link is on its way. Check your inbox (and spam folder).
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
            </div>
            {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Send reset link'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: 14 }}>
          <Link to="/login" style={{ color: 'var(--primary-mid)', fontWeight: 600 }}>Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
