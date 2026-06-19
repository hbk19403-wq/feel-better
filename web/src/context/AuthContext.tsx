import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('fb_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('fb_user');
    if (saved && token) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
    setLoading(false);
  }, [token]);

  async function login(email: string, password: string) {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    setToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem('fb_token', data.accessToken);
    localStorage.setItem('fb_refresh', data.refreshToken);
    localStorage.setItem('fb_user', JSON.stringify(data.user));
  }

  async function register(name: string, email: string, password: string, language = 'English') {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, preferredLanguage: language }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    setToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem('fb_token', data.accessToken);
    localStorage.setItem('fb_refresh', data.refreshToken);
    localStorage.setItem('fb_user', JSON.stringify(data.user));
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
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
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
