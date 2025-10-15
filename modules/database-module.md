# Database Module

## Purpose

The Database module defines the data schema, relationships, indexing strategy, Row-Level Security (RLS) policies, and multi-tenancy architecture for ThaiFightTalk. The database uses **PostgreSQL** hosted on **Supabase**, with real-time subscriptions and file storage.

## Key Features

### Schema Design
- Normalized relational schema
- Foreign key constraints
- Check constraints for data integrity
- JSONB columns for flexible content

### Multi-Tenancy
- Single-database, shared schema architecture
- `org_id` column for gym partnerships (V1.5+)
- Row-Level Security for data isolation
- Prepared for database-per-tenant scaling (V2.0+)

### Real-Time Features
- Supabase Realtime for leaderboard updates
- WebSocket subscriptions for live data
- Optimistic UI updates

### File Storage
- Supabase Storage for lesson audio
- User avatar uploads
- Temporary audio files for pronunciation feedback

### Migrations
- Version-controlled SQL migration files
- Rollback support
- Seed data for initial camps/lessons

## Database Schema

### Core Tables

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  xp INTEGER DEFAULT 0 CHECK (xp >= 0),
  streak INTEGER DEFAULT 0 CHECK (streak >= 0),
  current_level INTEGER DEFAULT 1 CHECK (current_level >= 1),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  org_id UUID REFERENCES orgs(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_xp ON users(xp DESC);
CREATE INDEX idx_users_org_id ON users(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX idx_users_email ON users(email);
```

#### camps
```sql
CREATE TABLE camps (
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

CREATE INDEX idx_camps_order ON camps("order");
```

#### lessons
```sql
CREATE TABLE lessons (
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

CREATE INDEX idx_lessons_camp_id ON lessons(camp_id);
CREATE INDEX idx_lessons_order ON lessons(camp_id, "order");
```

**content JSONB structure:**
```json
{
  "vocabulary": [
    {
      "thai": "สวัสดี",
      "romanization": "sà-wàt-dii",
      "english": "hello",
      "audio_url": "/audio/vocab/sawasdee.mp3"
    }
  ],
  "exercises": [
    {
      "type": "multiple_choice",
      "question": "How do you say 'hello' in Thai?",
      "options": ["สวัสดี", "ขอบคุณ", "ไม่เป็นไร"],
      "correct_answer": "สวัสดี"
    }
  ]
}
```

#### user_lessons
```sql
CREATE TABLE user_lessons (
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

CREATE INDEX idx_user_lessons_user_id ON user_lessons(user_id);
CREATE INDEX idx_user_lessons_lesson_id ON user_lessons(lesson_id);
CREATE INDEX idx_user_lessons_completed ON user_lessons(user_id, completed);
```

#### badges
```sql
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  criteria JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**criteria JSONB examples:**
```json
// First lesson completed
{ "type": "lessons_completed", "count": 1 }

// 7-day streak
{ "type": "streak", "count": 7 }

// Reach level 5
{ "type": "level", "count": 5 }

// Earn 1000 XP
{ "type": "xp", "count": 1000 }
```

#### user_badges
```sql
CREATE TABLE user_badges (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
```

#### subscriptions
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'gym_edition')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'paused')),
  lemon_squeezy_id TEXT UNIQUE,
  lemon_squeezy_customer_id TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

#### orgs (V1.5+, for gym partnerships)
```sql
CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT CHECK (plan IN ('free', 'gym_edition')),
  contact_email TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orgs_slug ON orgs(slug);
```

### Triggers

#### Updated At Timestamp
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON camps
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Repeat for lessons, subscriptions, orgs
```

#### Auto-Create User Profile
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NOW()
  );
  
  -- Create free subscription by default
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## Row-Level Security (RLS) Policies

### Enable RLS on All Tables
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE camps ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
```

### users Policies
```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Users can view leaderboard (limited fields)
CREATE POLICY "Users can view leaderboard"
  ON users FOR SELECT
  USING (true)
  WITH CHECK (
    -- Only expose display_name, xp, level, streak
    -- Handled in application logic, not RLS
  );
```

### camps Policies
```sql
-- All authenticated users can view camps
CREATE POLICY "Authenticated users can view camps"
  ON camps FOR SELECT
  TO authenticated
  USING (true);
```

### lessons Policies
```sql
-- All authenticated users can view lessons
CREATE POLICY "Authenticated users can view lessons"
  ON lessons FOR SELECT
  TO authenticated
  USING (true);
```

### user_lessons Policies
```sql
-- Users can view their own progress
CREATE POLICY "Users can view own progress"
  ON user_lessons FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress"
  ON user_lessons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own progress"
  ON user_lessons FOR UPDATE
  USING (auth.uid() = user_id);
```

### badges Policies
```sql
-- All authenticated users can view badges
CREATE POLICY "Authenticated users can view badges"
  ON badges FOR SELECT
  TO authenticated
  USING (true);
```

### user_badges Policies
```sql
-- Users can view their own badges
CREATE POLICY "Users can view own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert badges (via API)
CREATE POLICY "Service role can award badges"
  ON user_badges FOR INSERT
  TO service_role
  WITH CHECK (true);
```

### subscriptions Policies
```sql
-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own subscription (for cancellation)
CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);
```

### orgs Policies (V1.5+)
```sql
-- Users can view their own org
CREATE POLICY "Users can view own org"
  ON orgs FOR SELECT
  USING (
    id IN (
      SELECT org_id FROM users WHERE auth.uid() = id
    )
  );

-- Org admins can update org (requires admin role, implemented in V1.5)
```

## Multi-Tenancy Strategy

### Phase 1 (MVP): No Multi-Tenancy
- All users in shared pool
- No `org_id` filtering needed
- Simple RLS policies

### Phase 2 (V1.5): Shared Database, Multi-Tenant
- Add `org_id` column to `users` table
- Gyms can invite users to their org
- Leaderboards filtered by org
- RLS policies check `org_id` for org-specific data

**Example org-filtered query:**
```sql
SELECT * FROM users
WHERE org_id = 'some-gym-uuid'
ORDER BY xp DESC;
```

### Phase 3 (V2.0): Database-per-Tenant (Optional)
- For large gym chains (1000+ users per gym)
- Isolate org data in separate Supabase projects
- Connection pooling per tenant
- Requires infrastructure changes

## Indexing Strategy

### Performance-Critical Indexes
```sql
-- Leaderboard queries
CREATE INDEX idx_users_xp_desc ON users(xp DESC);
CREATE INDEX idx_users_org_xp ON users(org_id, xp DESC) WHERE org_id IS NOT NULL;

-- User progress lookups
CREATE INDEX idx_user_lessons_user_completed ON user_lessons(user_id, completed);
CREATE INDEX idx_user_lessons_lesson_user ON user_lessons(lesson_id, user_id);

-- Badge eligibility checks
CREATE INDEX idx_user_badges_user ON user_badges(user_id);

-- Camp/lesson ordering
CREATE INDEX idx_camps_order ON camps("order");
CREATE INDEX idx_lessons_camp_order ON lessons(camp_id, "order");

-- Subscription lookups
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### Composite Indexes
```sql
-- For filtered leaderboards
CREATE INDEX idx_users_org_xp_streak ON users(org_id, xp DESC, streak DESC)
WHERE org_id IS NOT NULL;
```

## Migrations

### Migration File Structure
```
supabase/
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_badges.sql
│   ├── 003_add_subscriptions.sql
│   ├── 004_add_orgs.sql (V1.5)
│   └── 005_add_org_id_to_users.sql (V1.5)
└── seed.sql
```

### Example Migration: Add Orgs (V1.5)
```sql
-- supabase/migrations/004_add_orgs.sql

CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT CHECK (plan IN ('free', 'gym_edition')),
  contact_email TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orgs_slug ON orgs(slug);

ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org"
  ON orgs FOR SELECT
  USING (
    id IN (
      SELECT org_id FROM users WHERE auth.uid() = id
    )
  );

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON orgs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Seed Data
```sql
-- supabase/seed.sql

-- Insert initial camps
INSERT INTO camps (id, title, theme, description, "order", unlock_level) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Bangkok Basics', 'survival_phrases', 'Essential phrases for navigating Bangkok and daily life', 1, 1),
  ('22222222-2222-2222-2222-222222222222', 'Gym Commands', 'muay_thai', 'Key Muay Thai terminology and training instructions', 2, 1),
  ('33333333-3333-3333-3333-333333333333', 'Food & Drink', 'food', 'Ordering food, discussing dietary preferences', 3, 2),
  ('44444444-4444-4444-4444-444444444444', 'Directions & Transport', 'travel', 'Getting around Thailand safely', 4, 3),
  ('55555555-5555-5555-5555-555555555555', 'Social Situations', 'culture', 'Making friends, gym etiquette, respectful phrases', 5, 4);

-- Insert sample lessons (Bangkok Basics camp)
INSERT INTO lessons (id, camp_id, title, difficulty, content, xp_reward, "order") VALUES
  (
    '11111111-aaaa-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Greetings',
    'beginner',
    '{"vocabulary":[{"thai":"สวัสดี","romanization":"sà-wàt-dii","english":"hello","audio_url":"/audio/vocab/sawasdee.mp3"}],"exercises":[{"type":"multiple_choice","question":"How do you say hello?","options":["สวัสดี","ขอบคุณ","ลาก่อน"],"correct_answer":"สวัสดี"}]}'::jsonb,
    10,
    1
  ),
  (
    '22222222-aaaa-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Thank You & Sorry',
    'beginner',
    '{"vocabulary":[{"thai":"ขอบคุณ","romanization":"kòp-kun","english":"thank you","audio_url":"/audio/vocab/khobkhun.mp3"}],"exercises":[]}'::jsonb,
    10,
    2
  );

-- Insert badges
INSERT INTO badges (id, name, description, icon_url, criteria) VALUES
  ('badge-1', 'First Blood', 'Complete your first lesson', '/badges/first-blood.svg', '{"type":"lessons_completed","count":1}'::jsonb),
  ('badge-2', 'Week Warrior', 'Maintain a 7-day streak', '/badges/week-warrior.svg', '{"type":"streak","count":7}'::jsonb),
  ('badge-3', 'Gym Rat', 'Complete the Gym Commands camp', '/badges/gym-rat.svg', '{"type":"camp_completed","camp_id":"22222222-2222-2222-2222-222222222222"}'::jsonb);
```

## Storage Buckets

### Audio Files
```sql
-- Create storage bucket for lesson audio
INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-audio', 'lesson-audio', true);

-- RLS policy: Allow public read
CREATE POLICY "Public can view lesson audio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lesson-audio');

-- RLS policy: Only service role can upload
CREATE POLICY "Service role can upload lesson audio"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'lesson-audio');
```

### User Avatars
```sql
-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- RLS policy: Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS policy: Anyone can view avatars
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
```

### Temporary Audio (Pronunciation Feedback)
```sql
-- Create storage bucket for temp audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('audio-temp', 'audio-temp', false);

-- RLS policy: Users can upload to their own folder
CREATE POLICY "Users can upload to own temp folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'audio-temp' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS policy: Users can only access their own temp files
CREATE POLICY "Users can access own temp files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'audio-temp' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Auto-delete temp files after 1 hour (implemented in API)
```

## Real-Time Subscriptions

### Leaderboard Updates
```typescript
// Client-side subscription
import { supabase } from '@/lib/supabase/client'

useEffect(() => {
  const channel = supabase
    .channel('leaderboard')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: 'xp=gt.0'
      },
      (payload) => {
        // Update leaderboard UI
        console.log('User XP updated:', payload.new)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

## Backup and Recovery

### Automated Backups
- Supabase provides daily automated backups (retained for 7 days on free tier, 30 days on pro)
- Point-in-time recovery available on paid plans

### Manual Backup Script
```bash
#!/bin/bash
# backup.sh

SUPABASE_PROJECT_REF="your-project-ref"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql"

npx supabase db dump --db-url "postgresql://postgres:[password]@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres" > $BACKUP_FILE

echo "Backup saved to $BACKUP_FILE"
```

## Performance Optimization

### Query Optimization Tips
- Use `select('*', { count: 'exact' })` sparingly (expensive)
- Prefer `select('column1, column2')` over `select('*')`
- Use pagination for large datasets
- Cache frequently accessed data (camps, lessons) at application level

### Connection Pooling
- Supabase handles connection pooling automatically
- Use `supabase-js` client (connection pooling built-in)
- Avoid direct PostgreSQL connections from client

### Caching Strategy
- Cache lesson content in CDN (Vercel Edge)
- Cache user progress in Redis (optional, for high traffic)
- Invalidate cache on content updates

## Testing Checklist

- [ ] All migrations run successfully
- [ ] RLS policies prevent unauthorized access
- [ ] Triggers fire correctly (auto-create profile, update timestamps)
- [ ] Indexes improve query performance (verify with `EXPLAIN ANALYZE`)
- [ ] Storage buckets have correct permissions
- [ ] Real-time subscriptions work
- [ ] Backup script runs successfully
- [ ] Seed data loads correctly

## Security Considerations

- **Always enable RLS** on all tables
- **Use service role key sparingly** (only for admin operations)
- **Validate all inputs** before database writes
- **Audit logs** for sensitive operations (subscription changes, user deletions)
- **Encrypt sensitive data** at rest (Supabase does this by default)
- **Regularly review RLS policies** for gaps

## Future Enhancements (V1.5+)

- Multi-tenant leaderboards (gym-specific)
- Advanced analytics tables (daily active users, retention cohorts)
- Lesson recommendation engine (based on user performance)
- Social features (friends, challenges)

---

**References:**
- Supabase Docs: https://supabase.com/docs
- PostgreSQL RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Supabase Storage: https://supabase.com/docs/guides/storage

