type Variant = 'ai' | 'wellness' | 'clinical' | 'peer';

const COPY: Record<Variant, { icon: string; bg: string; border: string; color: string; text: string }> = {
  ai: {
    icon: 'ℹ️', bg: '#EFF6FF', border: '#BFDBFE', color: '#1E3A8A',
    text: 'This is emotional support and routing — not a therapist, doctor, or emergency service, and cannot diagnose or prescribe. If you may be in danger or thinking of harming yourself, call Tele-MANAS 14416 or 112 now.',
  },
  wellness: {
    icon: '🌿', bg: '#FFFBEB', border: '#FDE68A', color: '#92400E',
    text: 'Wellness & coaching support is non-clinical. These providers do not diagnose, treat mental illness, prescribe, or replace therapy.',
  },
  clinical: {
    icon: '🩺', bg: '#ECFDF5', border: '#A7F3D0', color: '#065F46',
    text: 'Licensed professionals provide clinical care. Verify that the provider is registered with the RCI / relevant council before booking.',
  },
  peer: {
    icon: '💬', bg: '#F5F3FF', border: '#DDD6FE', color: '#5B21B6',
    text: 'Peer listeners offer a caring ear, not therapy or medical advice. In a crisis they will direct you to Tele-MANAS 14416 or emergency services.',
  },
};

export default function Disclaimer({ variant = 'ai', style }: { variant?: Variant; style?: React.CSSProperties }) {
  const c = COPY[variant];
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      borderRadius: 12, padding: '12px 16px', fontSize: 13, lineHeight: 1.5, ...style,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{c.icon}</span>
      <span>{c.text}</span>
    </div>
  );
}
