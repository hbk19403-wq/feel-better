import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SocialAuth from '../components/SocialAuth';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      nav('/home');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1A3C5E 0%, #2E75B6 50%, #17A589 100%)', padding: 24 }}>
      <div className="card fade-up" style={{ width: '100%', maxWidth: 420, padding: 40 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #1A3C5E, #17A589)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>
            🌿
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 4 }}>1800-FeelBetter</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>You're not alone. We're here to listen.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign in'}
          </button>
        </form>

        <SocialAuth onSuccess={() => nav('/home')} />

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14 }}>
          <Link to="/forgot-password" style={{ color: 'var(--primary-mid)', fontWeight: 600 }}>Forgot your password?</Link>
        </p>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: 14 }}>
          New here?{' '}
          <Link to="/register" style={{ color: 'var(--primary-mid)', fontWeight: 600 }}>Create an account</Link>
        </p>

        <div style={{ marginTop: 32, padding: '16px', background: 'var(--bg)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6 }}>
          🔒 Conversations are confidential. Your privacy is our priority.
        </div>
      </div>
    </div>
  );
}
