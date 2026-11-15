import { useEffect, useRef, useState } from 'react';
import { useAuth, API } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID as string | undefined;
// OTP is shown only once an SMS provider is live (set VITE_ENABLE_OTP=true).
const OTP_ENABLED = (import.meta.env.VITE_ENABLE_OTP as string | undefined) === 'true';

// Renders whichever social / OTP options are configured via env. Falls back to
// nothing (so email/password still stands alone) when none are set.
export default function SocialAuth({ onSuccess }: { onSuccess: () => void }) {
  const { social } = useAuth();
  const googleRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState('');

  // --- Google Identity Services ---------------------------------------------
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const id = 'google-gsi';
    function init() {
      const g = (window as any).google;
      if (!g?.accounts?.id || !googleRef.current) return;
      g.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (resp: any) => {
          try { await social('/auth/google', { credential: resp.credential }); onSuccess(); }
          catch (e: any) { setError(e.message || 'Google sign-in failed'); }
        },
      });
      g.accounts.id.renderButton(googleRef.current, { theme: 'outline', size: 'large', width: 320, text: 'continue_with', shape: 'pill' });
    }
    if (document.getElementById(id)) { init(); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true; s.id = id; s.onload = init;
    document.body.appendChild(s);
  }, [social, onSuccess]);

  // --- Facebook Login --------------------------------------------------------
  useEffect(() => {
    if (!FACEBOOK_APP_ID) return;
    if ((window as any).FB) return;
    (window as any).fbAsyncInit = function () {
      (window as any).FB.init({ appId: FACEBOOK_APP_ID, cookie: true, xfbml: false, version: 'v19.0' });
    };
    const s = document.createElement('script');
    s.src = 'https://connect.facebook.net/en_US/sdk.js';
    s.async = true; s.defer = true; s.crossOrigin = 'anonymous';
    document.body.appendChild(s);
  }, []);

  function facebookLogin() {
    const FB = (window as any).FB;
    if (!FB) { setError('Facebook is still loading — try again in a moment.'); return; }
    FB.login((resp: any) => {
      if (resp.authResponse?.accessToken) {
        social('/auth/facebook', { access_token: resp.authResponse.accessToken })
          .then(onSuccess).catch((e: any) => setError(e.message || 'Facebook sign-in failed'));
      }
    }, { scope: 'public_profile,email' });
  }

  // --- Phone OTP -------------------------------------------------------------
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'code'>('phone');
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpInfo, setOtpInfo] = useState('');

  async function requestOtp() {
    setError(''); setOtpInfo(''); setOtpBusy(true);
    try {
      const res = await fetch(`${API}/auth/otp/request`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Could not send code');
      setOtpStep('code'); setOtpInfo(`Code sent to ${d.phone || phone}.`);
    } catch (e: any) { setError(e.message); } finally { setOtpBusy(false); }
  }

  async function verifyOtp() {
    setError(''); setOtpBusy(true);
    try { await social('/auth/otp/verify', { phone, code }); onSuccess(); }
    catch (e: any) { setError(e.message || 'Invalid code'); } finally { setOtpBusy(false); }
  }

  // Render nothing until at least one method is configured, so email/password
  // stands cleanly alone and no half-working control appears in production.
  if (!GOOGLE_CLIENT_ID && !FACEBOOK_APP_ID && !OTP_ENABLED) return null;

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 18px', color: 'var(--text-tertiary)', fontSize: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span>or continue with</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        {GOOGLE_CLIENT_ID && <div ref={googleRef} />}
        {FACEBOOK_APP_ID && (
          <button type="button" onClick={facebookLogin} className="btn btn-full"
            style={{ background: '#1877F2', color: 'white', border: 'none', borderRadius: 999, fontWeight: 600 }}>
            Continue with Facebook
          </button>
        )}
      </div>

      {/* Phone + OTP */}
      {OTP_ENABLED && (
      <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        {otpStep === 'phone' ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel"
              placeholder="📱 Mobile number" style={{ flex: 1, padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14 }} />
            <button type="button" className="btn btn-outline" disabled={otpBusy || phone.replace(/\D/g, '').length < 10} onClick={requestOtp}>
              {otpBusy ? <span className="spinner" /> : 'Send code'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {otpInfo && <p style={{ fontSize: 12.5, color: 'var(--accent)' }}>{otpInfo}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric"
                placeholder="6-digit code" style={{ flex: 1, padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, letterSpacing: 3 }} />
              <button type="button" className="btn btn-primary" disabled={otpBusy || code.length !== 6} onClick={verifyOtp}>
                {otpBusy ? <span className="spinner" /> : 'Verify'}
              </button>
            </div>
            <button type="button" onClick={() => { setOtpStep('phone'); setCode(''); setOtpInfo(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 12, cursor: 'pointer', alignSelf: 'flex-start' }}>
              ← Use a different number
            </button>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
