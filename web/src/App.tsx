import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Match from './pages/Match';
import Session from './pages/Session';
import Review from './pages/Review';
import Resources from './pages/Resources';
import History from './pages/History';

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner spinner-dark" style={{ width: 40, height: 40, borderWidth: 3 }} />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<RequireAuth><Layout><Home /></Layout></RequireAuth>} />
      <Route path="/match" element={<RequireAuth><Layout><Match /></Layout></RequireAuth>} />
      <Route path="/session/:id" element={<RequireAuth><Layout><Session /></Layout></RequireAuth>} />
      <Route path="/review/:id" element={<RequireAuth><Layout><Review /></Layout></RequireAuth>} />
      <Route path="/resources" element={<RequireAuth><Layout><Resources /></Layout></RequireAuth>} />
      <Route path="/history" element={<RequireAuth><Layout><History /></Layout></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
