-- =============================================================================
-- ThaiFightTalk Database Schema - Initial Migration
-- =============================================================================
-- Run this in Supabase SQL Editor
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- USERS TABLE
-- =============================================================================
-- Core user profiles with gamification data

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  xp INTEGER DEFAULT 0 CHECK (xp >= 0),
  streak INTEGER DEFAULT 0 CHECK (streak >= 0),
  current_level INTEGER DEFAULT 1 CHECK (current_level >= 1),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  org_id UUID, -- For future gym partnerships feature
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- CAMPS TABLE
-- =============================================================================
-- Training camp modules (lesson collections)

CREATE TABLE IF NOT EXISTS camps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  theme TEXT,
  description TEXT,
  "order" INTEGER NOT NULL UNIQUE,
  unlock_level INTEGER DEFAULT 1 CHECK (unlock_level >= 1),
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_camps_order ON camps("order");
CREATE INDEX IF NOT EXISTS idx_camps_unlock_level ON camps(unlock_level);

-- Auto-update trigger
CREATE TRIGGER update_camps_updated_at
  BEFORE UPDATE ON camps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- LESSONS TABLE
-- =============================================================================
-- Individual lessons within camps

CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id UUID NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  media_url TEXT,
  content JSONB NOT NULL,
  xp_reward INTEGER DEFAULT 10 CHECK (xp_reward >= 0),
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(camp_id, "order")
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lessons_camp_id ON lessons(camp_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(camp_id, "order");
CREATE INDEX IF NOT EXISTS idx_lessons_difficulty ON lessons(difficulty);

-- Auto-update trigger
CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- USER_LESSONS TABLE
-- =============================================================================
-- Track user progress through lessons

CREATE TABLE IF NOT EXISTS user_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  attempts INTEGER DEFAULT 0 CHECK (attempts >= 0),
  last_attempt TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_lessons_user_id ON user_lessons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lessons_lesson_id ON user_lessons(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_lessons_completed ON user_lessons(user_id, completed);

-- Auto-update trigger
CREATE TRIGGER update_user_lessons_updated_at
  BEFORE UPDATE ON user_lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- BADGES TABLE
-- =============================================================================
-- Achievement badges

CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  criteria JSONB NOT NULL,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_badges_tier ON badges(tier);

-- Auto-update trigger
CREATE TRIGGER update_badges_updated_at
  BEFORE UPDATE ON badges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- USER_BADGES TABLE
-- =============================================================================
-- Track which badges users have earned

CREATE TABLE IF NOT EXISTS user_badges (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON user_badges(earned_at DESC);

-- =============================================================================
-- SUBSCRIPTIONS TABLE
-- =============================================================================
-- User subscription and payment tracking

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'gym_edition')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'paused')),
  lemon_squeezy_id TEXT UNIQUE,
  lemon_squeezy_customer_id TEXT,
  variant_id TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_lemon_squeezy_id ON subscriptions(lemon_squeezy_id);

-- Auto-update trigger
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SPARRING SESSIONS TABLE (AI Conversation Practice)
-- =============================================================================

CREATE TABLE IF NOT EXISTS sparring_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  messages JSONB DEFAULT '[]'::jsonb,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sparring_sessions_user_id ON sparring_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sparring_sessions_created_at ON sparring_sessions(created_at DESC);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN FLOOR(SQRT(xp / 100.0)) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get XP needed for next level
CREATE OR REPLACE FUNCTION xp_for_next_level(current_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN current_level * current_level * 100;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to award XP and auto-level up
CREATE OR REPLACE FUNCTION award_xp(p_user_id UUID, p_xp_amount INTEGER)
RETURNS TABLE(new_xp INTEGER, new_level INTEGER, leveled_up BOOLEAN) AS $$
DECLARE
  v_old_xp INTEGER;
  v_new_xp INTEGER;
  v_old_level INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Get current XP and level
  SELECT xp, current_level INTO v_old_xp, v_old_level
  FROM users
  WHERE id = p_user_id;

  -- Calculate new XP
  v_new_xp := v_old_xp + p_xp_amount;

  -- Calculate new level
  v_new_level := calculate_level(v_new_xp);

  -- Update user
  UPDATE users
  SET xp = v_new_xp,
      current_level = v_new_level,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Return results
  RETURN QUERY SELECT v_new_xp, v_new_level, (v_new_level > v_old_level);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ ThaiFightTalk database schema created successfully!';
  RAISE NOTICE '📊 Tables created: users, camps, lessons, user_lessons, badges, user_badges, subscriptions, sparring_sessions';
  RAISE NOTICE '⚡ Functions created: calculate_level, xp_for_next_level, award_xp';
  RAISE NOTICE '🔒 Next step: Run RLS policies migration';
END $$;
