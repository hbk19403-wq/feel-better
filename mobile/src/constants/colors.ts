export const Colors = {
  primaryDark: '#1A3C5E',
  primaryMid: '#2E75B6',
  primaryLight: '#D5E8F0',
  accentTeal: '#17A589',
  warningAmber: '#F39C12',
  dangerRed: '#E74C3C',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
} as const;

export const SUPPORT_CATEGORIES = [
  { id: 'relationship_dating', label: 'Relationship & Dating', emoji: '💑' },
  { id: 'marriage_commitment', label: 'Marriage & Commitment', emoji: '💍' },
  { id: 'infidelity_trust', label: 'Infidelity & Trust', emoji: '🤝' },
  { id: 'career_stress', label: 'Career Stress', emoji: '💼' },
  { id: 'family_pressure', label: 'Family Pressure', emoji: '🏠' },
  { id: 'societal_peer', label: 'Societal & Peer Pressure', emoji: '🌐' },
  { id: 'emotional_wellness', label: 'Emotional Wellness', emoji: '🧘' },
  { id: 'abuse_safety', label: 'Abuse & Safety', emoji: '🛡️' },
  { id: 'self_discovery', label: 'Self-Discovery', emoji: '✨' },
  { id: 'venting_general', label: 'Venting & General Support', emoji: '💬' },
  { id: 'students_career', label: 'Students & Career', emoji: '🎓' },
] as const;

export const AGE_SEGMENTS = [
  { id: '16_25', label: '16–25', description: 'Students & Young Adults' },
  { id: '26_35', label: '26–35', description: 'Young Professionals' },
  { id: '36_50', label: '36–50', description: 'Mid-Career Adults' },
  { id: '51_plus', label: '51+', description: 'Older Adults' },
] as const;

export const MOOD_LABELS: Record<number, string> = {
  1: '😔',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😄',
};
