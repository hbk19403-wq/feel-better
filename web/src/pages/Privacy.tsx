import { Link } from 'react-router-dom';

const wrap: React.CSSProperties = { maxWidth: 760, margin: '0 auto', padding: '40px 20px 80px', lineHeight: 1.65, color: '#1A3C5E' };
const h1: React.CSSProperties = { fontSize: 30, fontWeight: 800, marginBottom: 4 };
const h2: React.CSSProperties = { fontSize: 19, fontWeight: 700, marginTop: 30, marginBottom: 8 };
const p: React.CSSProperties = { fontSize: 15, marginBottom: 12, color: '#33475b' };

export default function Privacy() {
  return (
    <div style={wrap}>
      <Link to="/" style={{ color: '#17A589', fontWeight: 600, fontSize: 14 }}>← Back to 1800-FeelBetter</Link>
      <h1 style={{ ...h1, marginTop: 20 }}>Privacy Policy</h1>
      <p style={{ color: '#6b7a8d', fontSize: 13, marginBottom: 24 }}>Last updated: November 2026</p>

      <p style={p}>
        1800-FeelBetter ("we", "us") provides emotional support, peer listening, and routing to appropriate
        resources. This policy explains what information we collect, how we use it, and the choices you have.
        We are an emotional-support service — we are not a medical provider, and this service is not a
        substitute for professional care or emergency help.
      </p>

      <h2 style={h2}>Information we collect</h2>
      <p style={p}>
        <strong>Account information</strong> you provide when you sign up: your nickname, email address, and
        (if you choose phone or social sign-in) your phone number or basic Google/Facebook profile (name,
        email, profile picture). <strong>Wellness and session data</strong>: mood check-ins, the content of
        your conversations with listeners or our AI companion while signed in, and session metadata such as
        duration and category. <strong>Payment references</strong>: when you pay over UPI, we store the order
        reference and the transaction reference (UTR) you submit — we do not store card numbers or bank
        credentials. <strong>Usage data</strong>: basic technical information needed to operate and secure the
        service.
      </p>
      <p style={p}>
        The public "Chat now — no signup" experience is stateless: those messages are processed to generate a
        reply and are not stored to your account.
      </p>

      <h2 style={h2}>How we use information</h2>
      <p style={p}>
        To provide emotional support and match you with listeners or AI companions; to maintain your history
        and preferences when you are signed in; to process subscription and per-minute payments; to keep the
        service safe and secure; and to improve the service. We do not sell your personal information.
      </p>

      <h2 style={h2}>AI and service providers</h2>
      <p style={p}>
        We use trusted third parties to run the service, including cloud hosting and database infrastructure
        (Supabase) and AI language providers (such as Anthropic and OpenAI) that generate AI-companion
        responses. These providers process data on our behalf under their own terms and security practices.
      </p>

      <h2 style={h2}>Safety and crisis situations</h2>
      <p style={p}>
        If someone indicates they may be at risk of harm, we may surface crisis resources and, where
        appropriate and permitted, escalate for safety. In an emergency in India, call 112; for mental-health
        support, call Tele-MANAS 14416 or KIRAN 1800-599-0019.
      </p>

      <h2 style={h2}>Data retention and security</h2>
      <p style={p}>
        We keep your information for as long as your account is active or as needed to provide the service and
        meet legal obligations, and we use reasonable technical and organizational measures to protect it. No
        method of transmission or storage is completely secure.
      </p>

      <h2 style={h2}>Your choices and rights</h2>
      <p style={p}>
        You may access or update your account information in the app, and you may request deletion of your
        account and associated data by contacting us. Depending on your location (including under India's
        Digital Personal Data Protection Act), you may have additional rights over your personal data.
      </p>

      <h2 style={h2}>Children</h2>
      <p style={p}>
        The service is intended for use consistent with applicable age requirements. Minors should use it only
        with appropriate consent and, where relevant, involvement of a trusted adult.
      </p>

      <h2 style={h2}>Changes and contact</h2>
      <p style={p}>
        We may update this policy from time to time; material changes will be reflected by the "last updated"
        date above. Questions or requests: <a href="mailto:hbk19403@gmail.com" style={{ color: '#17A589' }}>hbk19403@gmail.com</a>.
      </p>

      <p style={{ ...p, marginTop: 24, fontSize: 13, color: '#6b7a8d' }}>
        See also our <Link to="/terms" style={{ color: '#17A589' }}>Terms of Service</Link>.
      </p>
    </div>
  );
}
