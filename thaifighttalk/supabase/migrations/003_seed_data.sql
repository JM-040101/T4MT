-- =============================================================================
-- ThaiFightTalk Seed Data
-- =============================================================================
-- Run this AFTER schema and RLS policies
-- Creates initial camps, lessons, and badges for testing
-- =============================================================================

-- =============================================================================
-- SEED CAMPS
-- =============================================================================

INSERT INTO camps (title, theme, description, "order", unlock_level, icon_url) VALUES
  (
    'Basic Greetings',
    'respect',
    'Learn essential Thai greetings and respectful phrases used in Muay Thai gyms.',
    1,
    1,
    '/icons/wai.svg'
  ),
  (
    'Gym Essentials',
    'training',
    'Master vocabulary for training equipment, exercises, and gym routines.',
    2,
    2,
    '/icons/gloves.svg'
  ),
  (
    'Fight Talk',
    'competition',
    'Understand fight-related terms, techniques, and ringside conversations.',
    3,
    5,
    '/icons/ring.svg'
  ),
  (
    'Street Survival',
    'daily_life',
    'Navigate markets, restaurants, and transportation in Thailand.',
    4,
    3,
    '/icons/street.svg'
  ),
  (
    'Cultural Deep Dive',
    'culture',
    'Learn about Thai traditions, festivals, and cultural etiquette.',
    5,
    8,
    '/icons/temple.svg'
  )
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SEED LESSONS FOR CAMP 1: Basic Greetings
-- =============================================================================

INSERT INTO lessons (camp_id, title, difficulty, content, xp_reward, "order")
SELECT
  c.id,
  'Sawadee - Hello',
  'beginner',
  '{
    "vocabulary": [
      {"thai": "สวัสดี", "phonetic": "sà-wàt-dee", "english": "Hello/Goodbye", "example": "สวัสดีครับ (sà-wàt-dee kráp) - Hello (male)"},
      {"thai": "ครับ", "phonetic": "kráp", "english": "Polite particle (male)", "example": "Used at end of sentences by males"},
      {"thai": "ค่ะ", "phonetic": "kâ", "english": "Polite particle (female)", "example": "Used at end of sentences by females"}
    ],
    "exercises": [
      {
        "type": "multiple_choice",
        "question": "How do you say hello in Thai?",
        "options": ["สวัสดี", "ขอบคุณ", "ไม่เป็นไร", "ลาก่อน"],
        "correct_answer": 0,
        "explanation": "สวัสดี (sà-wàt-dee) means hello and goodbye in Thai."
      },
      {
        "type": "multiple_choice",
        "question": "Which polite particle should men use?",
        "options": ["ค่ะ", "ครับ", "จ้า", "นะ"],
        "correct_answer": 1,
        "explanation": "ครับ (kráp) is the polite particle used by males."
      }
    ],
    "cultural_note": "The wai (prayer-like gesture) is often paired with sawadee. Higher hands show more respect."
  }'::jsonb,
  10,
  1
FROM camps c WHERE c.title = 'Basic Greetings'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (camp_id, title, difficulty, content, xp_reward, "order")
SELECT
  c.id,
  'Khop Khun - Thank You',
  'beginner',
  '{
    "vocabulary": [
      {"thai": "ขอบคุณ", "phonetic": "kòp-kun", "english": "Thank you", "example": "ขอบคุณครับ (kòp-kun kráp) - Thank you (male)"},
      {"thai": "ขอบคุณมาก", "phonetic": "kòp-kun mâak", "english": "Thank you very much", "example": "Shows extra gratitude"},
      {"thai": "ไม่เป็นไร", "phonetic": "mâi-bpen-rai", "english": "You''re welcome / No problem", "example": "Common polite response"}
    ],
    "exercises": [
      {
        "type": "multiple_choice",
        "question": "How do you say thank you in Thai?",
        "options": ["สวัสดี", "ขอบคุณ", "ไม่เป็นไร", "ครับ"],
        "correct_answer": 1,
        "explanation": "ขอบคุณ (kòp-kun) means thank you."
      },
      {
        "type": "fill_blank",
        "question": "Complete: ขอบคุณ___ (Thank you very much)",
        "correct_answer": "มาก",
        "explanation": "มาก (mâak) means very/much, so ขอบคุณมาก is thank you very much."
      }
    ]
  }'::jsonb,
  10,
  2
FROM camps c WHERE c.title = 'Basic Greetings'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (camp_id, title, difficulty, content, xp_reward, "order")
SELECT
  c.id,
  'The Wai - Respectful Greeting',
  'beginner',
  '{
    "vocabulary": [
      {"thai": "ไหว้", "phonetic": "wâi", "english": "The wai gesture", "example": "Press palms together, bow head"},
      {"thai": "ครู", "phonetic": "kruu", "english": "Teacher/Master", "example": "Used for trainers in Muay Thai"},
      {"thai": "เคารพ", "phonetic": "kâo-róp", "english": "Respect", "example": "Essential in Thai culture"}
    ],
    "exercises": [
      {
        "type": "multiple_choice",
        "question": "When greeting a Muay Thai trainer, you should:",
        "options": ["Shake hands", "Perform a wai", "Wave", "Bow"],
        "correct_answer": 1,
        "explanation": "The wai is the traditional respectful greeting in Thailand, especially important when greeting teachers."
      }
    ],
    "cultural_note": "In Muay Thai gyms, always wai your kru (teacher) and senior students. The higher the wai, the more respect shown."
  }'::jsonb,
  15,
  3
FROM camps c WHERE c.title = 'Basic Greetings'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SEED LESSONS FOR CAMP 2: Gym Essentials
-- =============================================================================

INSERT INTO lessons (camp_id, title, difficulty, content, xp_reward, "order")
SELECT
  c.id,
  'Training Equipment',
  'beginner',
  '{
    "vocabulary": [
      {"thai": "นวม", "phonetic": "nuam", "english": "Boxing gloves", "example": "Essential for pad work"},
      {"thai": "ผ้าพันมือ", "phonetic": "pâa-pan-meu", "english": "Hand wraps", "example": "Protect your hands"},
      {"thai": "กระสอบทราย", "phonetic": "grà-sòp-saai", "english": "Heavy bag", "example": "For power training"},
      {"thai": "เป้า", "phonetic": "bpâo", "english": "Thai pads", "example": "Used by trainer to hold"}
    ],
    "exercises": [
      {
        "type": "multiple_choice",
        "question": "What is the Thai word for boxing gloves?",
        "options": ["นวม", "ผ้าพันมือ", "เป้า", "กระสอบทราย"],
        "correct_answer": 0,
        "explanation": "นวม (nuam) means boxing gloves."
      }
    ]
  }'::jsonb,
  15,
  1
FROM camps c WHERE c.title = 'Gym Essentials'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SEED BADGES
-- =============================================================================

INSERT INTO badges (name, description, icon_url, criteria, tier) VALUES
  (
    'First Step',
    'Complete your first lesson',
    '/badges/first-step.svg',
    '{"type": "lessons_completed", "value": 1}'::jsonb,
    'bronze'
  ),
  (
    'Quick Learner',
    'Complete 5 lessons in one day',
    '/badges/quick-learner.svg',
    '{"type": "lessons_per_day", "value": 5}'::jsonb,
    'silver'
  ),
  (
    'Week Warrior',
    'Maintain a 7-day streak',
    '/badges/week-warrior.svg',
    '{"type": "streak_days", "value": 7}'::jsonb,
    'gold'
  ),
  (
    'Perfect Score',
    'Get 100% on a lesson',
    '/badges/perfect-score.svg',
    '{"type": "perfect_scores", "value": 1}'::jsonb,
    'bronze'
  ),
  (
    'XP Master',
    'Earn 1000 total XP',
    '/badges/xp-master.svg',
    '{"type": "xp_threshold", "value": 1000}'::jsonb,
    'gold'
  ),
  (
    'Camp Crusher',
    'Complete an entire camp',
    '/badges/camp-crusher.svg',
    '{"type": "camps_completed", "value": 1}'::jsonb,
    'silver'
  ),
  (
    'Level 10',
    'Reach level 10',
    '/badges/level-10.svg',
    '{"type": "level_threshold", "value": 10}'::jsonb,
    'platinum'
  ),
  (
    'Social Butterfly',
    'Complete 10 AI sparring sessions',
    '/badges/social-butterfly.svg',
    '{"type": "sparring_sessions", "value": 10}'::jsonb,
    'silver'
  )
ON CONFLICT DO NOTHING;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
DECLARE
  camp_count INTEGER;
  lesson_count INTEGER;
  badge_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO camp_count FROM camps;
  SELECT COUNT(*) INTO lesson_count FROM lessons;
  SELECT COUNT(*) INTO badge_count FROM badges;

  RAISE NOTICE '🌱 Seed data inserted successfully!';
  RAISE NOTICE '📚 Camps created: %', camp_count;
  RAISE NOTICE '📖 Lessons created: %', lesson_count;
  RAISE NOTICE '🏆 Badges created: %', badge_count;
  RAISE NOTICE '✅ Database is ready for testing!';
END $$;
