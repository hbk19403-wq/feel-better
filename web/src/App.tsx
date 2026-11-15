import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Match from './pages/Match';
import Session from './pages/Session';
import Review from './pages/Review';
import Resources from './pages/Resources';
import History from './pages/History';
import AIListeners from './pages/AIListeners';
import AIChat from './pages/AIChat';
import PublicChat from './pages/PublicChat';
import AIVoice from './pages/AIVoice';
import TherapistDirectory from './pages/TherapistDirectory';
import ListenerConsole from './pages/ListenerConsole';
import ListenerSession from './pages/ListenerSession';
import Community from './pages/Community';
import VentLine from './pages/VentLine';
import Plans from './pages/Plans';

function RequireAuth({ children }: { children: React.ReactElement }) {
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
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={<Landing />} />
      <Route path="/chat" element={<PublicChat />} />
      <Route path="/home" element={<RequireAuth><Layout><Home /></Layout></RequireAuth>} />
      <Route path="/match" element={<RequireAuth><Layout><Match /></Layout></RequireAuth>} />
      <Route path="/session/:id" element={<RequireAuth><Layout><Session /></Layout></RequireAuth>} />
      <Route path="/review/:id" element={<RequireAuth><Layout><Review /></Layout></RequireAuth>} />
      <Route path="/resources" element={<RequireAuth><Layout><Resources /></Layout></RequireAuth>} />
      <Route path="/plans" element={<RequireAuth><Layout><Plans /></Layout></RequireAuth>} />
      <Route path="/community" element={<RequireAuth><Layout><Community /></Layout></RequireAuth>} />
      <Route path="/vent-line" element={<RequireAuth><Layout><VentLine /></Layout></RequireAuth>} />
      <Route path="/history" element={<RequireAuth><Layout><History /></Layout></RequireAuth>} />
      <Route path="/ai-listeners" element={<RequireAuth><Layout><AIListeners /></Layout></RequireAuth>} />
      <Route path="/ai-chat/:listenerId" element={<RequireAuth><Layout><AIChat /></Layout></RequireAuth>} />
      <Route path="/ai-voice/:listenerId" element={<RequireAuth><Layout><AIVoice /></Layout></RequireAuth>} />
      <Route path="/therapists" element={<RequireAuth><Layout><TherapistDirectory /></Layout></RequireAuth>} />
      <Route path="/listener" element={<RequireAuth><Layout><ListenerConsole /></Layout></RequireAuth>} />
      <Route path="/listener/session/:id" element={<RequireAuth><Layout><ListenerSession /></Layout></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
