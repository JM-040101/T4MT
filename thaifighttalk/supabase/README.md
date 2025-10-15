# ThaiFightTalk Database Setup

Complete guide to setting up the Supabase database for ThaiFightTalk.

## 📋 Prerequisites

- Supabase account (free tier works)
- Project created at https://app.supabase.com
- Environment variables configured in `.env.local`

## 🚀 Quick Setup

Run these migrations **in order** in the Supabase SQL Editor:

### Step 1: Create Schema (Required)
Run: `migrations/001_initial_schema.sql`

This creates:
- ✅ All core tables (users, camps, lessons, user_lessons, badges, user_badges, subscriptions, sparring_sessions)
- ✅ Indexes for performance
- ✅ Auto-update triggers for `updated_at` columns
- ✅ Helper functions (`calculate_level`, `award_xp`, `xp_for_next_level`)

### Step 2: Enable Security (Required)
Run: `migrations/002_rls_policies.sql`

This enables:
- 🔒 Row Level Security on all tables
- 👤 Users can only access their own data
- 📖 Content is readable by all authenticated users
- 🏆 Leaderboard view for rankings
- 🔑 Service role has full admin access

### Step 3: Add Sample Data (Optional)
Run: `migrations/003_seed_data.sql`

This creates:
- 📚 5 training camps (Basic Greetings, Gym Essentials, Fight Talk, Street Survival, Cultural Deep Dive)
- 📖 4+ lessons with Thai vocabulary and exercises
- 🏆 8 achievement badges

## 📊 Database Schema Overview

### Core Tables

#### `users`
User profiles with gamification data
```sql
- id (UUID, PK)
- email (TEXT, UNIQUE)
- display_name (TEXT)
- avatar_url (TEXT)
- xp (INTEGER) - Total experience points
- streak (INTEGER) - Current learning streak
- current_level (INTEGER) - Auto-calculated from XP
- last_activity (TIMESTAMP)
- org_id (UUID) - For gym partnerships (future)
```

#### `camps`
Lesson module collections
```sql
- id (UUID, PK)
- title (TEXT)
- theme (TEXT)
- description (TEXT)
- order (INTEGER, UNIQUE)
- unlock_level (INTEGER) - Minimum level to access
- icon_url (TEXT)
```

#### `lessons`
Individual lessons within camps
```sql
- id (UUID, PK)
- camp_id (UUID, FK -> camps)
- title (TEXT)
- difficulty (TEXT) - beginner, intermediate, advanced
- media_url (TEXT)
- content (JSONB) - Vocabulary, exercises, cultural notes
- xp_reward (INTEGER)
- order (INTEGER)
```

#### `user_lessons`
Tracks user progress through lessons
```sql
- id (UUID, PK)
- user_id (UUID, FK -> users)
- lesson_id (UUID, FK -> lessons)
- completed (BOOLEAN)
- score (INTEGER) - 0-100
- attempts (INTEGER)
- last_attempt (TIMESTAMP)
```

#### `badges`
Achievement badge definitions
```sql
- id (UUID, PK)
- name (TEXT, UNIQUE)
- description (TEXT)
- icon_url (TEXT)
- criteria (JSONB) - Badge unlock criteria
- tier (TEXT) - bronze, silver, gold, platinum
```

#### `user_badges`
Tracks which badges users have earned
```sql
- user_id (UUID, FK -> users)
- badge_id (UUID, FK -> badges)
- earned_at (TIMESTAMP)
- PK (user_id, badge_id)
```

#### `subscriptions`
Payment and subscription tracking
```sql
- id (UUID, PK)
- user_id (UUID, FK -> users, UNIQUE)
- plan (TEXT) - free, pro, gym_edition
- status (TEXT) - active, cancelled, past_due, paused
- lemon_squeezy_id (TEXT, UNIQUE)
- current_period_end (TIMESTAMP)
```

#### `sparring_sessions`
AI conversation practice sessions
```sql
- id (UUID, PK)
- user_id (UUID, FK -> users)
- topic (TEXT)
- difficulty (TEXT)
- messages (JSONB) - Chat history
- xp_earned (INTEGER)
- ended_at (TIMESTAMP)
```

## 🔧 Helper Functions

### `calculate_level(xp INTEGER)`
Calculates user level from total XP.
```sql
SELECT calculate_level(500); -- Returns 3
```

### `xp_for_next_level(current_level INTEGER)`
Returns XP needed for next level.
```sql
SELECT xp_for_next_level(5); -- Returns 2500
```

### `award_xp(user_id UUID, xp_amount INTEGER)`
Awards XP to user and auto-levels up if threshold reached.
```sql
SELECT * FROM award_xp('user-uuid', 50);
-- Returns: (new_xp, new_level, leveled_up)
```

## 🔒 Row Level Security (RLS) Summary

### Users Table
- ✅ Users can read/update their own profile
- ✅ Users can insert their profile on signup
- ❌ Users cannot modify XP/level directly (use `award_xp` function)

### Content Tables (camps, lessons, badges)
- ✅ All authenticated users can read
- ❌ Only service role can create/update/delete

### Progress Tables (user_lessons, user_badges)
- ✅ Users can read/update their own progress
- ❌ Only service role can award badges (prevents cheating)

### Subscriptions Table
- ✅ Users can read their own subscription
- ❌ Only service role can update (webhooks handle this)

### Leaderboard View
- ✅ All authenticated users can view top 100

## 🧪 Testing the Database

After running migrations, verify setup:

```bash
# Run the connection test
node test-supabase.mjs
```

Should output:
```
✅ Connection successful!
✅ Database is healthy
📊 Tables found: 8
```

## 📝 Common Operations

### Create a New Camp
```sql
INSERT INTO camps (title, theme, description, "order", unlock_level)
VALUES ('Advanced Combat', 'fighting', 'Master fight terminology', 6, 10);
```

### Add a Lesson
```sql
INSERT INTO lessons (camp_id, title, difficulty, content, xp_reward, "order")
VALUES (
  'camp-uuid-here',
  'Clinch Techniques',
  'advanced',
  '{"vocabulary": [...], "exercises": [...]}'::jsonb,
  25,
  1
);
```

### Award XP to User
```sql
SELECT * FROM award_xp('user-uuid', 100);
```

### Check User Progress
```sql
SELECT
  u.display_name,
  u.xp,
  u.current_level,
  u.streak,
  COUNT(DISTINCT ul.id) as lessons_completed,
  COUNT(DISTINCT ub.badge_id) as badges_earned
FROM users u
LEFT JOIN user_lessons ul ON u.id = ul.user_id AND ul.completed = true
LEFT JOIN user_badges ub ON u.id = ub.user_id
WHERE u.id = 'user-uuid'
GROUP BY u.id, u.display_name, u.xp, u.current_level, u.streak;
```

### View Leaderboard
```sql
SELECT * FROM leaderboard LIMIT 10;
```

## 🔄 Migration History

| Migration | Description | Status |
|-----------|-------------|--------|
| 001_initial_schema.sql | Core tables, indexes, functions | ✅ |
| 002_rls_policies.sql | Row Level Security policies | ✅ |
| 003_seed_data.sql | Sample camps, lessons, badges | ✅ (Optional) |

## 🐛 Troubleshooting

### Connection Issues
- Verify `.env.local` has correct Supabase URL and keys
- Check project is not paused in Supabase dashboard
- Ensure IP allowlist includes your location (or set to "Allow all")

### RLS Policy Errors
- Make sure migrations run in order (schema → RLS → seed)
- Check user is authenticated (`auth.uid()` is not null)
- Use service role key for admin operations

### Function Errors
- Ensure `uuid-ossp` extension is enabled
- Check function syntax in migration 001
- Verify parameters match expected types

## 📚 Additional Resources

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL JSONB Functions](https://www.postgresql.org/docs/current/functions-json.html)
- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

---

**Need help?** Check the [main CLAUDE.md](../CLAUDE.md) for project architecture or [modules/database-module.md](../modules/database-module.md) for detailed schema docs.
