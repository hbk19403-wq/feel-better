import { dbGet, dbRun } from './database';
import bcrypt from 'bcryptjs';

export async function runSeed(): Promise<void> {
  const listenerData = [
    { alias: 'River', specs: ['relationship_dating', 'marriage_commitment'], langs: ['English'], bio: 'Compassionate listener with 5 years in relationship support. Creates a safe, non-judgmental space.', trauma: false, rating: 4.8, cnt: 142 },
    { alias: 'Sage', specs: ['career_stress', 'students_career'], langs: ['English', 'Spanish'], bio: 'Career coach helping professionals navigate transitions and workplace challenges.', trauma: false, rating: 4.6, cnt: 89 },
    { alias: 'Willow', specs: ['emotional_wellness', 'self_discovery'], langs: ['English'], bio: 'Trauma-informed listener specializing in anxiety. Here to hold space for your journey.', trauma: true, rating: 4.9, cnt: 201 },
    { alias: 'Cedar', specs: ['family_pressure', 'venting_general'], langs: ['English', 'French'], bio: 'Family dynamics specialist with a calm, grounded approach.', trauma: false, rating: 4.5, cnt: 67 },
    { alias: 'Storm', specs: ['abuse_safety', 'emotional_wellness'], langs: ['English'], bio: 'Certified in safety planning and trauma-informed care.', trauma: true, rating: 4.7, cnt: 113 },
    { alias: 'Nova', specs: ['societal_peer', 'students_career'], langs: ['English', 'Mandarin'], bio: 'Helping young adults navigate identity, peer pressure and life transitions.', trauma: false, rating: 4.4, cnt: 55 },
  ];

  const hash = await bcrypt.hash('ListenerPass123!', 10);

  for (const l of listenerData) {
    const existing = await dbGet<{ id: string }>('SELECT id FROM listeners WHERE alias = $1', [l.alias]);
    if (existing) continue;

    const email = `listener.${l.alias.toLowerCase()}@feelbetter.internal`;
    await dbRun(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1,$2,$3,$4) ON CONFLICT (email) DO NOTHING',
      [email, hash, l.alias, 'listener']
    );
    const user = await dbGet<{ id: string }>('SELECT id FROM users WHERE email = $1', [email]);
    if (!user) continue;

    await dbRun(
      `INSERT INTO listeners (user_id, alias, display_name, bio, specializations, languages, status, is_online, average_rating, rating_count, is_trauma_informed)
       VALUES ($1,$2,$3,$4,$5,$6,'online',true,$7,$8,$9)
       ON CONFLICT (alias) DO NOTHING`,
      [user.id, l.alias, l.alias, l.bio, JSON.stringify(l.specs), JSON.stringify(l.langs), l.rating, l.cnt, l.trauma]
    );
  }

  // Resources
  const resources = [
    { title: 'Understanding Anxiety: A Practical Guide', type: 'article', cat: 'emotional_wellness', content: 'Anxiety is one of the most common emotional experiences. This guide covers recognizing anxiety triggers, grounding techniques, and when to seek further help.', dur: 8 },
    { title: 'Breathing for Calm', type: 'audio', cat: 'emotional_wellness', content: 'A guided breathing exercise to activate your parasympathetic nervous system and reduce stress in minutes.', dur: 12 },
    { title: 'Relationship Boundaries Workbook', type: 'workbook', cat: 'relationship_dating', content: 'A structured workbook to help you identify, communicate, and maintain healthy boundaries in romantic relationships.', dur: 30 },
    { title: 'Career Clarity Journal', type: 'workbook', cat: 'career_stress', content: 'Journaling prompts and exercises to help you rediscover your professional purpose and manage workplace stress.', dur: 20 },
    { title: 'The Art of Letting Go', type: 'ebook', cat: 'self_discovery', content: 'A compassionate exploration of how to release what no longer serves you—past hurts, limiting beliefs, and unhealthy relationships.', dur: 90 },
    { title: 'Setting Boundaries with Family', type: 'article', cat: 'family_pressure', content: 'Practical strategies for navigating difficult family dynamics while preserving your own mental health and wellbeing.', dur: 6 },
  ];
  for (const r of resources) {
    const exists = await dbGet('SELECT id FROM resources WHERE title = $1', [r.title]);
    if (!exists) {
      await dbRun('INSERT INTO resources (title, type, category_id, content, duration_minutes) VALUES ($1,$2,$3,$4,$5)', [r.title, r.type, r.cat, r.content, r.dur]);
    }
  }

  // Workshops
  const workshops = [
    { title: 'Navigating Relationship Anxiety', cat: 'relationship_dating', facilitator: 'River', description: 'Learn to identify and manage anxiety in romantic relationships.', days: 3 },
    { title: 'Career Burnout: Signs & Solutions', cat: 'career_stress', facilitator: 'Sage', description: 'Recognize burnout early and discover practical recovery strategies.', days: 7 },
    { title: 'Building Self-Confidence', cat: 'self_discovery', facilitator: 'Willow', description: 'A workshop on cultivating genuine self-worth from the inside out.', days: 10 },
  ];
  for (const w of workshops) {
    const exists = await dbGet('SELECT id FROM workshops WHERE title = $1', [w.title]);
    if (!exists) {
      const d = new Date();
      d.setDate(d.getDate() + w.days);
      d.setHours(18, 0, 0, 0);
      await dbRun(
        'INSERT INTO workshops (title, category_id, scheduled_at, max_attendees, max_participants, host_name, facilitator, description, duration_minutes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [w.title, w.cat, d.toISOString(), 50, 50, 'FeelBetter Team', w.facilitator, w.description, 60]
      );
    }
  }

  console.log('✓ Seed complete');
}
