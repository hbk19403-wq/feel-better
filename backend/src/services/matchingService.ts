import { getDb } from '../config/database';

interface MatchInput {
  categoryId: string;
  language: string;
  userId: string;
}

export async function matchListeners(input: MatchInput) {
  const { data: listeners, error } = await getDb()
    .from('listeners')
    .select('*')
    .eq('is_online', true)
    .lt('active_session_count', 3);

  if (error || !listeners) return [];

  const scored = listeners.map((l: any) => {
    const specs: string[] = Array.isArray(l.specializations) ? l.specializations : [];
    const langs: string[] = Array.isArray(l.languages) ? l.languages : [];
    let score = 0;
    if (specs.includes(input.categoryId)) score += 40;
    if (langs.some((lang: string) => lang.toLowerCase().includes(input.language.toLowerCase()))) score += 30;
    score += (Number(l.average_rating) / 5) * 20;
    score -= l.active_session_count * 5;

    return {
      ...l,
      display_name: l.display_name || l.alias,
      rating: Number(l.average_rating),
      match_score: Math.round(score),
      estimated_wait_minutes: l.active_session_count === 0 ? 0 : l.active_session_count * 3,
    };
  });

  return scored.sort((a: any, b: any) => b.match_score - a.match_score).slice(0, 3);
}
