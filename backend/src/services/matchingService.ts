import { dbAll } from '../config/database';

interface MatchInput {
  categoryId: string;
  language: string;
  sessionType: string;
  userId: string;
}

interface ListenerRow {
  id: string;
  alias: string;
  display_name: string;
  bio: string;
  specializations: string[] | string;
  languages: string[] | string;
  status: string;
  is_online: boolean;
  active_session_count: number;
  average_rating: number;
  rating_count: number;
  total_sessions: number;
  is_trauma_informed: boolean;
}

export async function matchListeners(input: MatchInput) {
  const listeners = await dbAll<ListenerRow>(
    `SELECT * FROM listeners WHERE is_online = true AND active_session_count < 3`
  );

  const scored = listeners.map((l) => {
    const specs: string[] = Array.isArray(l.specializations) ? l.specializations : JSON.parse(l.specializations as string || '[]');
    const langs: string[] = Array.isArray(l.languages) ? l.languages : JSON.parse(l.languages as string || '["English"]');
    let score = 0;
    if (specs.includes(input.categoryId)) score += 40;
    if (langs.some(lang => lang.toLowerCase().includes(input.language.toLowerCase()) || input.language.toLowerCase().includes(lang.toLowerCase()))) score += 30;
    score += (Number(l.average_rating) / 5) * 20;
    score -= l.active_session_count * 5;

    return {
      ...l,
      display_name: l.display_name || l.alias,
      rating: Number(l.average_rating),
      specializations: specs,
      languages: langs,
      match_score: Math.round(score),
      estimated_wait_minutes: l.active_session_count === 0 ? 0 : l.active_session_count * 3,
    };
  });

  return scored.sort((a, b) => b.match_score - a.match_score).slice(0, 3);
}
