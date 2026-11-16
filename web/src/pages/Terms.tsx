import { Link } from 'react-router-dom';

const wrap: React.CSSProperties = { maxWidth: 760, margin: '0 auto', padding: '40px 20px 80px', lineHeight: 1.65, color: '#1A3C5E' };
const h1: React.CSSProperties = { fontSize: 30, fontWeight: 800, marginBottom: 4 };
const h2: React.CSSProperties = { fontSize: 19, fontWeight: 700, marginTop: 30, marginBottom: 8 };
const p: React.CSSProperties = { fontSize: 15, marginBottom: 12, color: '#33475b' };

export default function Terms() {
  return (
    <div style={wrap}>
      <Link to="/" style={{ color: '#17A589', fontWeight: 600, fontSize: 14 }}>← Back to 1800-FeelBetter</Link>
      <h1 style={{ ...h1, marginTop: 20 }}>Terms of Service</h1>
      <p style={{ color: '#6b7a8d', fontSize: 13, marginBottom: 24 }}>Last updated: November 2026</p>

      <h2 style={h2}>What 1800-FeelBetter is</h2>
      <p style={p}>
        1800-FeelBetter provides emotional support, peer listening, community spaces, and an AI companion, and
        routes people to appropriate next steps. It is <strong>not</strong> a medical, psychiatric, or
        emergency service, and it does not provide diagnosis or treatment. Nothing here is a substitute for
        professional care.
      </p>

      <h2 style={h2}>Emergencies</h2>
      <p style={p}>
        If you or someone else may be in danger, contact emergency services immediately. In India, call 112;
        for mental-health support call Tele-MANAS 14416 or KIRAN 1800-599-0019.
      </p>

      <h2 style={h2}>Your account</h2>
      <p style={p}>
        You are responsible for the activity on your account and for keeping your login secure. Provide
        accurate information and use the service respectfully. You must be old enough to use the service under
        applicable law.
      </p>

      <h2 style={h2}>Payments</h2>
      <p style={p}>
        Some features are offered free; advisory sessions are billed at ₹1 per minute, and subscription plans
        are available. Payments are collected over UPI; you confirm a payment by submitting your transaction
        reference. Charges are described in the app before you pay.
      </p>

      <h2 style={h2}>Acceptable use</h2>
      <p style={p}>
        Do not use the service to harm others, to harass, to share illegal content, or in ways that disrupt or
        abuse the platform. We may suspend accounts that violate these terms or put others at risk.
      </p>

      <h2 style={h2}>Disclaimers and liability</h2>
      <p style={p}>
        The service is provided "as is" without warranties of any kind. To the maximum extent permitted by
        law, we are not liable for indirect or consequential damages arising from use of the service. Listeners
        and AI companions provide supportive listening, not professional advice.
      </p>

      <h2 style={h2}>Changes and contact</h2>
      <p style={p}>
        We may update these terms; material changes will be reflected by the "last updated" date above.
        Questions: <a href="mailto:hbk19403@gmail.com" style={{ color: '#17A589' }}>hbk19403@gmail.com</a>.
      </p>

      <p style={{ ...p, marginTop: 24, fontSize: 13, color: '#6b7a8d' }}>
        See also our <Link to="/privacy" style={{ color: '#17A589' }}>Privacy Policy</Link>.
      </p>
    </div>
  );
}
