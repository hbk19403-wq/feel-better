import { type ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const NAV = [
  { to: '/home', label: 'Home', icon: '🏠' },
  { to: '/vent-line', label: 'Vent Line', icon: '📞' },
  { to: '/community', label: 'Community', icon: '🫂' },
  { to: '/ai-listeners', label: 'Listeners', icon: '💬' },
  { to: '/therapists', label: 'Therapists', icon: '🏥' },
  { to: '/match', label: 'Connect', icon: '💬' },
  { to: '/resources', label: 'Resources', icon: '📚' },
  { to: '/plans', label: 'Plans', icon: '⭐' },
  { to: '/history', label: 'History', icon: '🗂️' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout, authFetch } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const [isListener, setIsListener] = useState(false);

  useEffect(() => {
    let alive = true;
    authFetch('/listener-console/me')
      .then(r => { if (alive) setIsListener(r.ok); })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navItems = isListener
    ? [...NAV, { to: '/listener', label: 'Console', icon: '🛟' }]
    : NAV;

  function handleLogout() {
    logout();
    nav('/login');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Logo size={28} />
            <span style={{ fontWeight: 700, color: 'var(--primary-dark)', fontSize: 17 }}>1800-FeelBetter</span>
          </Link>

          <nav style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {navItems.map(({ to, label, icon }) => {
              const active = loc.pathname === to;
              return (
                <Link key={to} to={to} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                  borderRadius: 8, fontSize: 14, fontWeight: active ? 600 : 400,
                  color: active ? 'var(--primary-mid)' : 'var(--text-secondary)',
                  background: active ? 'var(--primary-light)' : 'transparent',
                  transition: 'all 0.15s',
                }}>
                  <span>{icon}</span>{label}
                </Link>
              );
            })}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Hey, {user?.name}</span>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign out</button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: '32px 0' }}>
        {/* key by route so the fade replays on every navigation */}
        <div key={loc.pathname} className="page-container fade-in">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: 'var(--primary-dark)', color: 'rgba(255,255,255,0.6)', padding: '20px 0', fontSize: 13, textAlign: 'center' }}>
        <div className="page-container">
          <p>🆘 Crisis? Call <strong style={{ color: 'white' }}>14416</strong> (Tele-MANAS · Govt of India) or text <strong style={{ color: 'white' }}>1800-599-0019</strong></p>
          <p style={{ marginTop: 6 }}>© 2026 1800-FeelBetter · All conversations are confidential</p>
        </div>
      </footer>
    </div>
  );
}
