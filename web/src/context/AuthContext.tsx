import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Parse a response body as JSON without throwing on empty/HTML bodies (e.g. a
// 502/504 gateway page), so callers get a clean error instead of a raw
// "Unexpected token <" SyntaxError.
async function safeJson(res: Response): Promise<any> {
  const text = await res.text().catch(() => '');
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  preferredLanguage: string;
}

interface AuthCtx {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, language?: string) => Promise<void>;
  // Completes a social / OTP sign-in against a backend endpoint that returns
  // { user, accessToken, refreshToken } (e.g. /auth/google, /auth/otp/verify).
  social: (path: string, body: any) => Promise<void>;
  logout: () => void;
  authFetch: (path: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('fb_token'));
  const [loading, setLoading] = useState(true);
  // Holds an in-flight token refresh so concurrent 401s share one refresh call
  // instead of each rotating (and invalidating) the refresh token.
  const refreshingRef = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('fb_user');
    if (saved && token) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
    setLoading(false);
  }, [token]);

  // Stores the tokens + user returned by any auth endpoint.
  function persistSession(data: any) {
    setToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem('fb_token', data.accessToken);
    localStorage.setItem('fb_refresh', data.refreshToken);
    localStorage.setItem('fb_user', JSON.stringify(data.user));
  }

  async function login(email: string, password: string) {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || 'Login failed. Please try again.');
    persistSession(data);
  }

  async function register(name: string, email: string, password: string, language = 'English') {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, preferredLanguage: language }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || 'Registration failed. Please try again.');
    persistSession(data);
  }

  async function social(path: string, body: any) {
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || 'Sign-in failed. Please try again.');
    persistSession(data);
  }

  // Exchanges the stored refresh token for a fresh access token. Returns the
  // new access token, or null if the refresh failed (caller should log out).
  // Single-flight: because the backend *rotates* refresh tokens (each call
  // revokes the old one), concurrent callers must share one refresh — otherwise
  // the second caller presents an already-revoked token and gets logged out.
  function refreshAccess(): Promise<string | null> {
    if (refreshingRef.current) return refreshingRef.current;
    const p = (async (): Promise<string | null> => {
      const refresh_token = localStorage.getItem('fb_refresh');
      if (!refresh_token) return null;
      try {
        const res = await fetch(`${API}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token }),
        });
        if (!res.ok) return null;
        const data = await safeJson(res);
        if (!data.accessToken) return null;
        setToken(data.accessToken);
        localStorage.setItem('fb_token', data.accessToken);
        if (data.refreshToken) localStorage.setItem('fb_refresh', data.refreshToken);
        return data.accessToken as string;
      } catch {
        return null;
      } finally {
        refreshingRef.current = null;
      }
    })();
    refreshingRef.current = p;
    return p;
  }

  // fetch wrapper that injects the bearer token and transparently refreshes it
  // once on a 401, so the short-lived (15 min) access token never strands the
  // user mid-session. `path` may be an absolute URL or a path relative to API.
  async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const url = path.startsWith('http') ? path : `${API}${path}`;
    const current = localStorage.getItem('fb_token') || token || '';
    const withAuth = (t: string): RequestInit => ({
      ...init,
      headers: { ...(init.headers || {}), Authorization: `Bearer ${t}` },
    });
    let res = await fetch(url, withAuth(current));
    if (res.status === 401) {
      const fresh = await refreshAccess();
      if (fresh) {
        res = await fetch(url, withAuth(fresh));
      } else {
        logout();
      }
    }
    return res;
  }

  function logout() {
    const t = localStorage.getItem('fb_token');
    if (t) {
      fetch(`${API}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
      }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('fb_token');
    localStorage.removeItem('fb_refresh');
    localStorage.removeItem('fb_user');
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, social, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

export { API };
