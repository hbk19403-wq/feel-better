import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LANGUAGES = ['English', 'Spanish', 'Hindi', 'Mandarin', 'French', 'Arabic', 'Portuguese'];

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState('English');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setError('');
    setLoading(true);
    try {
      await register(name, email, password, language);
      nav('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1A3C5E 0%, #2E75B6 50%, #17A589 100%)', padding: 24 }}>
      <div className="card fade-up" style={{ width: '100%', maxWidth: 460, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #1A3C5E, #17A589)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>
            🌿
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 4 }}>Create your account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Anonymous & confidential — we only need a nickname</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Your nickname</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Alex" required autoFocus />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required />
          </div>
          <div className="input-group">
            <label>Preferred language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)}>
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>

          {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}
          <button type="submit" className="btn btn-accent btn-full btn-lg" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Get started — it\'s free'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-secondary)', fontSize: 14 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary-mid)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
