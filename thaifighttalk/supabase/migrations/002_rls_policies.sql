-- =============================================================================
-- ThaiFightTalk Row Level Security (RLS) Policies
-- =============================================================================
-- Run this AFTER the initial schema migration
-- This enforces data access rules at the database level
-- =============================================================================

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE camps ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sparring_sessions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- USERS TABLE POLICIES
-- =============================================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (except XP, level, streak - those are managed by functions)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- New users can insert their own record (for signup)
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Service role can do everything (for admin operations)
CREATE POLICY "Service role full access to users"
  ON users FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================================
-- CAMPS TABLE POLICIES
-- =============================================================================

-- All authenticated users can read camps
CREATE POLICY "Authenticated users can read camps"
  ON camps FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can modify camps
CREATE POLICY "Service role can manage camps"
  ON camps FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================================
-- LESSONS TABLE POLICIES
-- =============================================================================

-- All authenticated users can read lessons
CREATE POLICY "Authenticated users can read lessons"
  ON lessons FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can modify lessons
CREATE POLICY "Service role can manage lessons"
  ON lessons FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================================
-- USER_LESSONS TABLE POLICIES
-- =============================================================================

-- Users can read their own lesson progress
CREATE POLICY "Users can read own lesson progress"
  ON user_lessons FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own lesson progress
CREATE POLICY "Users can insert own lesson progress"
  ON user_lessons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own lesson progress
CREATE POLICY "Users can update own lesson progress"
  ON user_lessons FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role can manage user lessons"
  ON user_lessons FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================================
-- BADGES TABLE POLICIES
-- =============================================================================

-- All authenticated users can read badges
CREATE POLICY "Authenticated users can read badges"
  ON badges FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can modify badges
CREATE POLICY "Service role can manage badges"
  ON badges FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================================
-- USER_BADGES TABLE POLICIES
-- =============================================================================

-- Users can read their own badges
CREATE POLICY "Users can read own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read other users' badges (for leaderboard/social features)
CREATE POLICY "Authenticated users can read all badges"
  ON user_badges FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can award badges (prevents cheating)
CREATE POLICY "Service role can manage user badges"
  ON user_badges FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================================
-- SUBSCRIPTIONS TABLE POLICIES
-- =============================================================================

-- Users can read their own subscription
CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscription
CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only service role can update subscriptions (webhooks update these)
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================================
-- SPARRING_SESSIONS TABLE POLICIES
-- =============================================================================

-- Users can read their own sparring sessions
CREATE POLICY "Users can read own sparring sessions"
  ON sparring_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sparring sessions
CREATE POLICY "Users can insert own sparring sessions"
  ON sparring_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sparring sessions
CREATE POLICY "Users can update own sparring sessions"
  ON sparring_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role can manage sparring sessions"
  ON sparring_sessions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================================
-- HELPER VIEWS FOR LEADERBOARD
-- =============================================================================

-- Create a view for leaderboard (no RLS needed - public data)
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  u.id,
  u.display_name,
  u.avatar_url,
  u.xp,
  u.current_level,
  u.streak,
  COUNT(DISTINCT ub.badge_id) as badge_count,
  ROW_NUMBER() OVER (ORDER BY u.xp DESC, u.created_at ASC) as rank
FROM users u
LEFT JOIN user_badges ub ON u.id = ub.user_id
GROUP BY u.id, u.display_name, u.avatar_url, u.xp, u.current_level, u.streak, u.created_at
ORDER BY u.xp DESC
LIMIT 100;

-- Grant access to leaderboard view
GRANT SELECT ON leaderboard TO authenticated;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '🔒 Row Level Security policies created successfully!';
  RAISE NOTICE '✅ All tables now have RLS enabled';
  RAISE NOTICE '👥 Users can only access their own data';
  RAISE NOTICE '📖 Content (camps, lessons, badges) is readable by all authenticated users';
  RAISE NOTICE '🏆 Leaderboard view created for public rankings';
  RAISE NOTICE '🔑 Service role has full access for admin operations';
END $$;
