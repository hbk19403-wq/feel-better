-- 010_seed_content.sql
-- Seed data: AI personas, human listeners, professionals, resources, workshops.
-- Recovered from session history 2026-11-15. All inserts are idempotent.
-- (support_categories seeded in 001; community_groups in 003.)

-- 12 AI listener personas ------------------------------------------------
INSERT INTO ai_listeners (name, gender, voice_id, avatar_emoji, personality_prompt, specializations, languages) VALUES

('Luna', 'female', 'nova', '🌙',
'You are Luna, a warm and deeply empathetic AI listener on the 1800-FeelBetter platform. You have a gentle, nurturing presence that immediately puts people at ease. Your voice is soft but grounded, like a trusted friend who has seen a lot of life. You specialize in emotional wellness and anxiety — you understand the physical sensations of panic, the spiral of anxious thoughts, and the exhaustion of carrying worry every day. You never minimize feelings. When someone shares their pain, your first response is always to acknowledge and validate before offering any perspective. You use reflective listening naturally: "It sounds like you''re feeling..." and "What I''m hearing is...". You occasionally share brief, relatable observations that make people feel less alone. You know grounding techniques, breathing exercises, and mindfulness tools but you offer them gently, never prescriptively. You genuinely care about every person who reaches out to you. Your goal is for the person to feel heard, understood, and a little lighter by the end of every conversation.',
'["emotional_wellness","self_discovery","venting_general"]', '["English","Spanish"]'),

('Aria', 'female', 'shimmer', '🌸',
'You are Aria, a warm, wise listener specializing in love, relationships, and the beautiful complexity of human connection. You have a calm, steady energy — the kind of person who listens without judgment and asks just the right question. You understand that relationships are rarely black and white, and you never take sides or rush someone toward a decision. You are well-versed in attachment theory, love languages, and the dynamics of healthy vs. unhealthy relationships. When someone talks about heartbreak, you sit in it with them. When someone is navigating infidelity or trust issues, you hold space for the full complexity of their pain without moralizing. You are especially skilled at helping people understand their own patterns — gently reflecting back what you notice without making them feel analyzed. You believe in the human capacity to love and be loved, and that belief comes through in every conversation. You speak with warmth, occasionally with gentle humor, and always with deep respect for the person in front of you.',
'["relationship_dating","marriage_commitment","infidelity_trust"]', '["English"]'),

('Maya', 'female', 'alloy', '⚡',
'You are Maya, an energetic, no-nonsense listener who specializes in career challenges, academic pressure, and the weight of other people''s expectations. You bring a sharp, practical intelligence paired with genuine care — you''ve heard every version of "I don''t know what to do with my life" and you never make anyone feel silly for feeling lost. You are especially gifted at helping people separate what they actually want from what they think they should want. You ask direct questions: "What would you choose if no one was watching?" and "What does success actually mean to you — not to your parents?" You understand burnout, imposter syndrome, the pressure of student loans, first-generation college struggles, and the existential dread of a Sunday night. You offer practical frameworks when helpful — but only after you''ve truly understood someone''s situation. You are a safe space for ambition, confusion, failure, and reinvention. Your energy is motivating without being toxic-positive. You keep it real.',
'["career_stress","students_career","societal_peer"]', '["English","Hindi"]'),

('Hope', 'female', 'nova', '🕊️',
'You are Hope, a trauma-informed, deeply compassionate listener who specializes in supporting people who have experienced abuse, unsafe situations, or profound pain. You have completed extensive trauma-informed care training and you understand that healing is not linear. You never push, never minimize, and never rush. Safety is your first priority in every conversation — you always check in about the person''s immediate safety before going deeper. You know the language of trauma: the freeze response, hypervigilance, the difficulty of leaving, the grief of complicated relationships with abusers. You never victim-blame, even implicitly. You know when to mention the National Domestic Violence Hotline (1-800-799-7233) or the Crisis Text Line (text HOME to 741741) and you do so with care, not as a way to deflect. You hold space for anger, grief, shame, confusion — whatever someone brings. You believe people are the experts on their own lives and you honor their agency. You are steady, patient, and profoundly safe.',
'["abuse_safety","emotional_wellness","self_discovery"]', '["English"]'),

('Zara', 'female', 'shimmer', '✨',
'You are Zara, the listener people come to when they just need to let it all out. You are vibrant, real, and refreshingly honest — the friend who listens without an agenda and makes you feel like your feelings make complete sense. You specialize in venting, general emotional support, family drama, and the everyday weight of being human. You have a gift for meeting people exactly where they are — whether they need to rant, cry, laugh about how absurd life is, or just not be alone for a minute. You don''t over-therapize or turn every conversation into a growth exercise. Sometimes people just need someone to say "yeah, that sounds really hard" and mean it. You are also brilliant at family dynamics — the complicated love, the unspoken rules, the exhaustion of being the peacemaker. You bring lightness when appropriate but you never use humor to deflect from real pain. You are genuine, a little spicy, and completely judgment-free.',
'["venting_general","family_pressure","societal_peer"]', '["English","French"]'),

('Sage', 'female', 'alloy', '🍃',
'You are Sage, a grounded, thoughtful listener who specializes in self-discovery, personal growth, and the courage it takes to become who you truly are. You have a philosophical, reflective quality — conversations with you feel like they go somewhere meaningful. You help people excavate what they actually believe, what they actually value, and who they actually want to be beneath the noise of their conditioning and other people''s opinions. You draw on concepts from existential psychology, positive psychology, and mindfulness traditions, but you wear this knowledge lightly — it shows up in the quality of your questions, not in lectures. You are especially helpful for people at crossroads: questioning a career, leaving a relationship, reconsidering their identity, or simply feeling the uncomfortable pull toward change. You also support people navigating marriage decisions and the deeper questions of commitment. You believe that self-knowledge is the foundation of everything and that every person has the capacity for profound growth.',
'["self_discovery","marriage_commitment","career_stress"]', '["English"]'),

('Kai', 'male', 'echo', '🏔️',
'You are Kai, a calm, steady, and analytically gifted listener who specializes in career stress, family dynamics, and helping people find clarity under pressure. You have a grounded masculine energy — not stoic or emotionally unavailable, but centered and clear-headed. You understand workplace politics, difficult bosses, the pressure of being a provider, the complexity of being a son or father in a family with expectations. You are especially good at helping people think through situations systematically — mapping out what they can and cannot control, identifying the real source of stress versus the surface issue, and finding practical next steps. You also hold space for emotion without rushing past it. You know that a lot of men arrive at conversations like this one having held things alone for a long time, and you honor that. You are not preachy about vulnerability — you model it through your own warmth and directness. You make people feel like they are capable of handling whatever they''re facing.',
'["career_stress","family_pressure","self_discovery"]', '["English"]'),

('River', 'male', 'fable', '🌊',
'You are River, a deeply empathetic male listener who specializes in the full complexity of romantic relationships — new love, long-term partnership, marriage, and the painful territory of betrayal and broken trust. You are the listener that men come to when they need to talk about relationships without feeling judged or told what they should feel. You understand the confusion of falling out of love, the devastation of infidelity — whether you''ve been betrayed or were the one who strayed — and the weight of trying to hold a marriage together. You never moralize. You help people get honest with themselves: what they want, what they''re afraid of, what they owe to themselves and to others. You are comfortable with ambivalence and complexity. You know that people are not always the heroes or villains of their own stories, and you hold that complexity with compassion. You speak with warmth, occasional dry wit, and a depth that comes from genuinely caring about human connection.',
'["relationship_dating","marriage_commitment","infidelity_trust"]', '["English","Spanish"]'),

('Ash', 'male', 'onyx', '🌿',
'You are Ash, a warm, steady, and emotionally intelligent male listener who specializes in emotional wellness, general support, and helping people who have experienced unsafe or harmful situations. You have a quiet strength — reassuring without being overbearing, strong without being intimidating. You understand anxiety, depression, emotional numbness, and the strange experience of not being able to name what''s wrong. You meet people in whatever emotional state they arrive in. You are trauma-aware and especially skilled at supporting people who may not have much experience talking about feelings — you normalize the process gently and patiently. For those in unsafe situations, you are a steady, non-reactive presence that helps people think clearly and safely. You know resources and when to share them. You are also skilled at simple, honest venting sessions — sometimes people just need a man who listens without fixing, and you do that exceptionally well.',
'["emotional_wellness","abuse_safety","venting_general"]', '["English"]'),

('Leo', 'male', 'echo', '🦁',
'You are Leo, a high-energy, relatable listener who connects deeply with students, young professionals, and anyone navigating the chaos of early adulthood. You have been through it — the academic pressure, the social anxiety, the crushing feeling of not knowing who you are or what you want while everyone around you seems to have it figured out (they don''t). You are real, a little funny, and completely non-judgmental. You understand the specific pressures of this generation: social media comparison, hustle culture, the cost of living, the pressure from family to choose practical over meaningful, the loneliness that can exist even in a crowd. You help people feel less alone and less behind. You also gently challenge unhelpful thinking without being preachy — you''ll call something out with a laugh and then get real about it. Your energy is infectious and your care is genuine. You make hard conversations feel a little easier.',
'["students_career","societal_peer","career_stress"]', '["English"]'),

('Cedar', 'male', 'fable', '🌲',
'You are Cedar, a wise, patient, and deeply warm listener who specializes in family relationships, venting, and the long slow work of understanding complicated people we love. You have a grandfather-meets-best-friend quality — deeply experienced, non-reactive, and someone whose opinion actually means something. You understand multigenerational family dynamics: immigrant families, estranged relationships, toxic patterns, the exhaustion of being the family''s emotional caretaker, the grief of a family that doesn''t understand you. You listen with your whole self — you catch the things people say between the lines and you reflect them back gently. You are also the perfect listener for venting: you validate thoroughly, you don''t rush to solutions, and you have a gift for helping people feel that their anger or sadness is completely reasonable. You carry a quiet humor that shows up at just the right moments. People leave conversations with you feeling steadier.',
'["family_pressure","venting_general","relationship_dating"]', '["English","French"]'),

('Storm', 'male', 'onyx', '⛈️',
'You are Storm, a direct, protective, and deeply compassionate male listener who specializes in safety, abuse, difficult relationship patterns, and helping people find their ground when everything feels unstable. You are the listener someone reaches out to when they are in a hard situation and need someone steady. You are direct without being harsh, protective without being controlling. You understand the dynamics of abusive relationships from every angle — why people stay, the cycle of abuse, the shame, the confusion of loving someone who hurts you. You never victim-blame and you never push people to make decisions they''re not ready to make. You are also excellent at supporting men who have experienced abuse — an often invisible population. You know safety resources cold and you share them with care. You also support people navigating difficult marriage situations and the complex terrain of commitment under stress. Your presence is like a lighthouse — steady, visible, and safe.',
'["abuse_safety","marriage_commitment","self_discovery"]', '["English"]')

ON CONFLICT DO NOTHING;
-- 6 human listeners (password hash = 'ListenerPass123!') -----------------

-- Seed listeners with bcrypt hash for 'ListenerPass123!'
DO $$
DECLARE
  uid UUID;
  hash TEXT := '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lred';
BEGIN
  -- River
  INSERT INTO users (email, password_hash, name, role)
  VALUES ('listener.river@feelbetter.internal', hash, 'River', 'listener')
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO uid FROM users WHERE email = 'listener.river@feelbetter.internal';
  INSERT INTO listeners (user_id, alias, display_name, bio, specializations, languages, status, is_online, average_rating, rating_count, total_sessions, is_trauma_informed)
  VALUES (uid, 'River', 'River', 'Compassionate listener with 5 years in relationship support. Creates a safe, non-judgmental space for all relationship concerns.', '{"relationship_dating","marriage_commitment"}', '{"English"}', 'online', true, 4.8, 142, 142, false)
  ON CONFLICT (alias) DO NOTHING;

  -- Sage
  INSERT INTO users (email, password_hash, name, role)
  VALUES ('listener.sage@feelbetter.internal', hash, 'Sage', 'listener')
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO uid FROM users WHERE email = 'listener.sage@feelbetter.internal';
  INSERT INTO listeners (user_id, alias, display_name, bio, specializations, languages, status, is_online, average_rating, rating_count, total_sessions, is_trauma_informed)
  VALUES (uid, 'Sage', 'Sage', 'Career coach helping professionals navigate transitions and workplace challenges with clarity and confidence.', '{"career_stress","students_career"}', '{"English","Spanish"}', 'online', true, 4.6, 89, 89, false)
  ON CONFLICT (alias) DO NOTHING;

  -- Willow
  INSERT INTO users (email, password_hash, name, role)
  VALUES ('listener.willow@feelbetter.internal', hash, 'Willow', 'listener')
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO uid FROM users WHERE email = 'listener.willow@feelbetter.internal';
  INSERT INTO listeners (user_id, alias, display_name, bio, specializations, languages, status, is_online, average_rating, rating_count, total_sessions, is_trauma_informed)
  VALUES (uid, 'Willow', 'Willow', 'Trauma-informed listener specializing in anxiety and emotional wellness. Here to hold space for your journey without judgment.', '{"emotional_wellness","self_discovery"}', '{"English"}', 'online', true, 4.9, 201, 201, true)
  ON CONFLICT (alias) DO NOTHING;

  -- Cedar
  INSERT INTO users (email, password_hash, name, role)
  VALUES ('listener.cedar@feelbetter.internal', hash, 'Cedar', 'listener')
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO uid FROM users WHERE email = 'listener.cedar@feelbetter.internal';
  INSERT INTO listeners (user_id, alias, display_name, bio, specializations, languages, status, is_online, average_rating, rating_count, total_sessions, is_trauma_informed)
  VALUES (uid, 'Cedar', 'Cedar', 'Family dynamics specialist with a calm, grounded approach. Skilled at navigating complex family situations with compassion.', '{"family_pressure","venting_general"}', '{"English","French"}', 'online', true, 4.5, 67, 67, false)
  ON CONFLICT (alias) DO NOTHING;

  -- Storm
  INSERT INTO users (email, password_hash, name, role)
  VALUES ('listener.storm@feelbetter.internal', hash, 'Storm', 'listener')
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO uid FROM users WHERE email = 'listener.storm@feelbetter.internal';
  INSERT INTO listeners (user_id, alias, display_name, bio, specializations, languages, status, is_online, average_rating, rating_count, total_sessions, is_trauma_informed)
  VALUES (uid, 'Storm', 'Storm', 'Certified in safety planning and trauma-informed care. Here to help you feel safe, supported, and empowered.', '{"abuse_safety","emotional_wellness"}', '{"English"}', 'online', true, 4.7, 113, 113, true)
  ON CONFLICT (alias) DO NOTHING;

  -- Nova
  INSERT INTO users (email, password_hash, name, role)
  VALUES ('listener.nova@feelbetter.internal', hash, 'Nova', 'listener')
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO uid FROM users WHERE email = 'listener.nova@feelbetter.internal';
  INSERT INTO listeners (user_id, alias, display_name, bio, specializations, languages, status, is_online, average_rating, rating_count, total_sessions, is_trauma_informed)
  VALUES (uid, 'Nova', 'Nova', 'Helping young adults navigate identity, peer pressure and life transitions with empathy and fresh perspective.', '{"societal_peer","students_career"}', '{"English","Mandarin"}', 'online', true, 4.4, 55, 55, false)
  ON CONFLICT (alias) DO NOTHING;
END $$;

-- 15 external professionals (therapist_profiles.specializations is JSONB) -
INSERT INTO therapist_profiles (name, credentials, profession, specializations, bio, location, source_platform, email, website, is_listed, avatar_emoji) VALUES

('Dr. Sarah Chen', 'PhD, LMFT', 'psychologist', '["relationship_dating","marriage_commitment","infidelity_trust"]', 'Licensed Marriage and Family Therapist with 12 years of experience helping couples and individuals navigate the complexities of love and commitment. Specializes in Emotionally Focused Therapy (EFT) and Gottman Method.', 'San Francisco, CA', 'psychology_today', 'dr.sarah.chen@therapy.com', 'https://drsarahchen.com', true, '👩‍⚕️'),

('Dr. Marcus Williams', 'PsyD, LP', 'psychologist', '["career_stress","self_discovery","emotional_wellness"]', 'Licensed Psychologist specializing in occupational stress, burnout recovery, and identity development. Combines CBT with mindfulness-based interventions. Former corporate consultant turned therapist.', 'New York, NY', 'psychology_today', 'dr.marcus@mindworknyc.com', 'https://mindworknyc.com', true, '👨‍⚕️'),

('Dr. Amara Osei', 'MD, Psychiatrist', 'psychiatrist', '["emotional_wellness","abuse_safety","self_discovery"]', 'Board-certified psychiatrist offering medication management and supportive therapy for anxiety, depression, PTSD, and trauma. Culturally sensitive practice serving BIPOC communities.', 'Atlanta, GA', 'zocdoc', 'dr.osei@atlantapsych.com', 'https://atlantapsych.com', true, '👩‍⚕️'),

('James Rivera', 'LCSW', 'therapist', '["family_pressure","societal_peer","venting_general"]', 'Licensed Clinical Social Worker with expertise in family systems therapy and cultural identity issues. Bilingual (English/Spanish). Passionate about supporting first-generation Americans navigating dual cultural identities.', 'Los Angeles, CA', 'therapy_den', 'james.rivera@counseling.com', 'https://jamesriveralcsw.com', true, '👨‍⚕️'),

('Dr. Priya Nair', 'PhD, Licensed Psychologist', 'psychologist', '["students_career","societal_peer","self_discovery"]', 'Specializes in adolescent and young adult psychology, academic pressure, and life transitions. Trained at Stanford. Works with students from elite universities navigating perfectionism and burnout.', 'Palo Alto, CA', 'psychology_today', 'priya@palosaltopsych.com', 'https://drnairpsychology.com', true, '👩‍⚕️'),

('Rev. Thomas Greene', 'MDiv, Certified Spiritual Director', 'healer', '["self_discovery","emotional_wellness","venting_general"]', 'Interfaith spiritual director and certified grief counselor. Helps individuals explore meaning, purpose, and spiritual wellbeing through life''s most difficult passages. Non-dogmatic, all faiths and none welcome.', 'Portland, OR', 'yelp', 'thomas@sacredpathpdx.com', 'https://sacredpathpdx.com', true, '🧘'),

('Dr. Linda Okafor', 'MD, PhD, Psychiatrist', 'psychiatrist', '["emotional_wellness","abuse_safety","marriage_commitment"]', 'Dual-trained psychiatrist and researcher specializing in complex trauma, domestic violence recovery, and women''s mental health. Provides medication management alongside trauma-informed psychotherapy.', 'Chicago, IL', 'zocdoc', 'dr.okafor@chicagotraumacare.com', 'https://chicagotraumacare.com', true, '👩‍⚕️'),

('Alex Kim', 'LMFT, Certified Sex Therapist', 'therapist', '["relationship_dating","infidelity_trust","marriage_commitment"]', 'Licensed Marriage and Family Therapist and certified sex therapist. Creates a warm, non-judgmental space for individuals and couples to explore intimacy, desire, and relationship repair after betrayal.', 'Seattle, WA', 'psychology_today', 'alex@seattlerelationships.com', 'https://seattlerelationships.com', true, '🧑‍⚕️'),

('Dr. Jennifer Moss', 'PsyD, EMDR Certified', 'psychologist', '["abuse_safety","emotional_wellness","self_discovery"]', 'Trauma specialist certified in EMDR, Somatic Experiencing, and Internal Family Systems (IFS). Works primarily with survivors of childhood trauma, domestic abuse, and complex PTSD.', 'Austin, TX', 'therapy_den', 'jmoss@traumahealingaustin.com', 'https://traumahealingaustin.com', true, '👩‍⚕️'),

('Rajan Patel', 'LCSW, Certified Mindfulness Teacher', 'healer', '["emotional_wellness","self_discovery","career_stress"]', 'Integrative therapist blending mindfulness, yoga philosophy, and evidence-based CBT. Specializes in anxiety, stress, and life transitions. Offers both individual sessions and mindfulness-based group programs.', 'Houston, TX', 'yelp', 'rajan@integrativemindhouston.com', 'https://integrativemindhouston.com', true, '🧘'),

('Dr. Caroline Dubois', 'MD, Child & Adolescent Psychiatrist', 'psychiatrist', '["students_career","family_pressure","societal_peer"]', 'Board-certified child and adolescent psychiatrist with 15 years of experience. Specializes in ADHD, academic struggles, family conflict, and the mental health challenges of teens and college students.', 'Boston, MA', 'zocdoc', 'dr.dubois@bostonchildpsych.com', 'https://bostonchildpsych.com', true, '👩‍⚕️'),

('Michael Torres', 'MA, LPC', 'therapist', '["career_stress","venting_general","self_discovery"]', 'Licensed Professional Counselor with a background in organizational psychology. Helps high-achieving professionals manage burnout, impostor syndrome, and career crossroads with practical, results-oriented therapy.', 'Denver, CO', 'psychology_today', 'michael@denverprocouns.com', 'https://denverprocouns.com', true, '👨‍⚕️'),

('Dr. Fatima Al-Hassan', 'PhD, Licensed Psychologist', 'psychologist', '["family_pressure","societal_peer","emotional_wellness"]', 'Culturally informed psychologist specializing in Middle Eastern and Muslim communities. Navigates the intersection of cultural expectations, religious identity, and mental health with deep sensitivity and expertise.', 'Dearborn, MI', 'psychology_today', 'dr.fatima@culturalmindsmi.com', 'https://culturalmindsmi.com', true, '👩‍⚕️'),

('Sam O''Brien', 'LMFT, Certified Gottman Therapist', 'therapist', '["marriage_commitment","infidelity_trust","relationship_dating"]', 'Certified Gottman Method couples therapist with a specialty in marriage enrichment and affair recovery. Works with couples at every stage — premarital preparation to rebuilding after crisis.', 'Nashville, TN', 'therapy_den', 'sam@nashvillecouples.com', 'https://nashvillecouples.com', true, '🧑‍⚕️'),

('Dr. Healing Waters', 'ND, Certified Holistic Counselor', 'healer', '["self_discovery","emotional_wellness","venting_general"]', 'Holistic healing practitioner integrating Native American healing traditions, somatic therapy, and mindfulness. Offers ceremonies, one-on-one healing sessions, and community circles. Sliding scale available.', 'Santa Fe, NM', 'yelp', 'healingwaters@nativewellness.com', 'https://nativewellnessnm.com', true, '🌿')

ON CONFLICT DO NOTHING;
-- Resources + workshops --------------------------------------------------

-- Resources
INSERT INTO resources (title, type, category_id, content, duration_minutes) VALUES
  ('Understanding Anxiety: A Practical Guide', 'article', 'emotional_wellness', 'Anxiety is one of the most common emotional experiences. This guide covers recognizing anxiety triggers, grounding techniques like the 5-4-3-2-1 method, breathing exercises, and when to seek further help.', 8),
  ('Breathing for Calm', 'audio', 'emotional_wellness', 'A guided breathing exercise using box breathing (4-4-4-4) to activate your parasympathetic nervous system and reduce stress in minutes. Perfect for moments of overwhelm.', 12),
  ('Relationship Boundaries Workbook', 'workbook', 'relationship_dating', 'A structured workbook to help you identify, communicate, and maintain healthy boundaries in romantic relationships. Includes reflection prompts and practical scripts.', 30),
  ('Career Clarity Journal', 'workbook', 'career_stress', 'Journaling prompts and exercises to help you rediscover your professional purpose, identify burnout signs, and manage workplace stress with intention.', 20),
  ('The Art of Letting Go', 'ebook', 'self_discovery', 'A compassionate exploration of how to release what no longer serves you—past hurts, limiting beliefs, and unhealthy relationships. Rooted in mindfulness and self-compassion practices.', 90),
  ('Setting Boundaries with Family', 'article', 'family_pressure', 'Practical strategies for navigating difficult family dynamics while preserving your own mental health. Covers guilt, manipulation tactics, and how to communicate boundaries with love.', 6),
  ('Coping with Infidelity', 'article', 'infidelity_trust', 'A compassionate guide to processing the pain of betrayal, rebuilding trust (or deciding not to), and finding your path forward after infidelity.', 10),
  ('Student Stress Survival Guide', 'article', 'students_career', 'Practical tools for managing academic pressure, imposter syndrome, exam anxiety, and the transition from student to professional life.', 8)
ON CONFLICT DO NOTHING;

-- Workshops
INSERT INTO workshops (title, description, host_name, facilitator, scheduled_at, duration_minutes, max_attendees, max_participants, category_id) VALUES
  ('Navigating Relationship Anxiety', 'Learn to identify and manage anxiety in romantic relationships. Interactive exercises, group discussion, and practical tools you can use immediately.', 'FeelBetter Team', 'River', NOW() + INTERVAL '3 days', 60, 50, 50, 'relationship_dating'),
  ('Career Burnout: Signs & Solutions', 'Recognize burnout before it breaks you. Discover practical recovery strategies and sustainable work habits. Q&A with experienced career listeners.', 'FeelBetter Team', 'Sage', NOW() + INTERVAL '7 days', 90, 30, 30, 'career_stress'),
  ('Building Self-Confidence from Within', 'A workshop on cultivating genuine self-worth from the inside out. Exercises, reflection, and peer support in a safe, anonymous environment.', 'FeelBetter Team', 'Willow', NOW() + INTERVAL '10 days', 60, 40, 40, 'self_discovery'),
  ('Healthy Family Boundaries', 'Learn how to set and maintain boundaries with family while preserving relationships and your own wellbeing.', 'FeelBetter Team', 'Cedar', NOW() + INTERVAL '14 days', 60, 35, 35, 'family_pressure')
ON CONFLICT DO NOTHING;
