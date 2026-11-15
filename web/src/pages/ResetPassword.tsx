import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { API } from '../context/AuthContext';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const nav = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not reset password. The link may have expired.');
      nav('/login', { replace: true });
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
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 4 }}>Choose a new password</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Enter a new password for your account.</p>
        </div>

        {!token ? (
          <div className="error-text" style={{ textAlign: 'center' }}>
            This reset link is invalid or incomplete. Please request a new one.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="password">New password</label>
              <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required autoFocus minLength={8} />
            </div>
            <div className="input-group">
              <label htmlFor="confirm">Confirm new password</label>
              <input id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required minLength={8} />
            </div>
            {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Update password'}
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
