# ThaiFightTalk — Claude Code Workspace Configuration

## Project Overview

**ThaiFightTalk** is a gamified Thai language learning SaaS for Muay Thai travelers. Users progress through "training camps" (lesson modules), earn XP and badges, maintain learning streaks, and practice with an AI sparring partner.

**Core Metaphor:** A Muay Thai training journey — level up from novice to fluent.

**Tech Stack:** Next.js 15, Supabase (PostgreSQL + Auth), Tailwind CSS, Lemon Squeezy (payments), OpenAI GPT-4o Mini (AI features).

## Core Architecture Summary
```
Next.js 15 App Router (Frontend + API Routes)
    ↓
Supabase (Database, Auth, Storage, Realtime)
    ↓
External Services (OpenAI, Lemon Squeezy, Analytics)
```

### Key Architectural Principles
1. **Serverless-first:** All API routes are edge functions (Vercel)
2. **Progressive enhancement:** Core lessons work offline; AI features require internet
3. **Security-first:** Supabase RLS policies enforce data isolation
4. **Multi-tenancy ready:** Use `org_id` column for gym partnerships (V1.5+)
5. **CDN-optimized:** Static assets cached at edge; dynamic content via API

## Module Structure

This project is organized into the following modules. Each has a detailed specification file:

- **[Authentication](./modules/auth-module.md)** — User signup, login, session management (Supabase Auth)
- **[API](./modules/api-module.md)** — RESTful endpoints for lessons, progress, XP, streaks
- **[Database](./modules/database-module.md)** — PostgreSQL schema, RLS policies, multi-tenancy
- **[UI](./modules/ui-module.md)** — Pages, components, design system (Next.js + Tailwind)
- **[Payments](./modules/payments-module.md)** — Subscriptions, webhooks, upgrade flow (Lemon Squeezy)

## Critical Constraints and Rules

### Security
- **Never hardcode secrets** — Use environment variables for all API keys
- **Validate all inputs** — Sanitize user inputs to prevent XSS/SQL injection
- **Enforce RLS policies** — Every table must have Row-Level Security enabled
- **Rate limiting** — Implement rate limits on all API routes (10 req/min for AI endpoints)
- **HTTPS only** — All traffic must be encrypted in production

### Code Quality
- **TypeScript strict mode** — Enable `"strict": true` in tsconfig.json
- **No `any` types** — Define proper types for all functions and components
- **Consistent naming** — PascalCase for components, camelCase for functions/variables
- **Component size** — Keep components under 200 lines; extract subcomponents
- **Pure functions** — Prefer pure functions; avoid side effects in utility code

### Performance
- **Server Components by default** — Use `"use client"` only when necessary
- **Image optimization** — Always use Next.js `<Image>` component
- **Lazy loading** — Code-split heavy features (AI sparring partner, pronunciation feedback)
- **Database indexes** — Index all foreign keys and frequently queried columns
- **Caching** — Cache lesson content at edge; invalidate on content updates

### Accessibility
- **WCAG AA compliance** — Ensure color contrast ratios, keyboard navigation
- **Semantic HTML** — Use proper heading hierarchy, ARIA labels
- **Responsive design** — Mobile-first approach; test on 320px to 1920px viewports
- **Focus management** — Clear focus indicators; logical tab order

### Data Handling
- **GDPR compliance** — Allow users to export/delete their data
- **Minimal data collection** — Only collect what's necessary
- **Encryption at rest** — Supabase encrypts data by default; verify in production
- **Audit logs** — Log all subscription changes, user deletions

## MCP Server Requirements

This project requires the following MCP servers for Claude Code:

### 1. Supabase MCP
```bash
npm install -g @modelcontextprotocol/server-supabase
```
**Purpose:** Direct database queries, schema inspection, RLS policy management

**Configuration:**
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "your_supabase_url",
        "SUPABASE_SERVICE_ROLE_KEY": "your_service_role_key"
      }
    }
  }
}
```

### 2. Playwright MCP (Optional, for E2E testing)
```bash
npm install -g @modelcontextprotocol/server-playwright
```
**Purpose:** Automated testing of user flows

## Development Commands
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests (when implemented)
npm run test

# Build for production
npm run build

# Start production server
npm run start

# Database migrations
npm run db:migrate

# Database seed (initial data)
npm run db:seed

# Generate TypeScript types from Supabase schema
npm run types:generate
```

## Database Schema Overview

### Core Tables

**users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  last_activity TIMESTAMP WITH TIME ZONE,
  org_id UUID REFERENCES orgs(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**camps** (lesson modules)
```sql
CREATE TABLE camps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  theme TEXT,
  description TEXT,
  "order" INTEGER NOT NULL,
  unlock_level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**lessons**
```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id UUID REFERENCES camps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  media_url TEXT,
  content JSONB NOT NULL,
  xp_reward INTEGER DEFAULT 10,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**user_lessons** (progress tracking)
```sql
CREATE TABLE user_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  score INTEGER,
  attempts INTEGER DEFAULT 0,
  last_attempt TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, lesson_id)
);
```

**badges**
```sql
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  criteria JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**user_badges**
```sql
CREATE TABLE user_badges (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);
```

**subscriptions**
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  plan TEXT CHECK (plan IN ('free', 'pro', 'gym_edition')),
  status TEXT CHECK (status IN ('active', 'cancelled', 'past_due', 'paused')),
  lemon_squeezy_id TEXT UNIQUE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### RLS Policy Summary

All tables must have RLS enabled:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lessons ENABLE ROW LEVEL SECURITY;
-- etc.
```

**Key policies:**
- Users can only read/update their own profile
- Lessons are readable by all authenticated users
- User progress is private (user can only see their own)
- Subscriptions are private (user can only see their own)

See `modules/database-module.md` for full RLS policy definitions.

## Environment Variables

Required variables (store in `.env.local`):
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI (AI sparring partner, pronunciation feedback)
OPENAI_API_KEY=sk-proj-...

# Lemon Squeezy
LEMON_SQUEEZY_API_KEY=your_api_key
LEMON_SQUEEZY_STORE_ID=12345
LEMON_SQUEEZY_WEBHOOK_SECRET=whsec_...

# Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Monitoring (optional)
SENTRY_DSN=https://...@sentry.io/...

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Security Requirements

### Authentication
- **Supabase Auth** handles all authentication
- Support email/password, Google OAuth, Apple OAuth
- Session tokens stored in HTTP-only cookies
- Refresh tokens rotated automatically
- MFA optional (added in V1.5)

### Authorization
- **Row-Level Security (RLS)** enforces all access control
- No business logic in client code relies on hiding UI
- API routes verify JWT tokens
- Admin routes check user roles

### Data Protection
- **Input validation:** Zod schemas for all API inputs
- **XSS prevention:** React auto-escapes; sanitize markdown user content
- **SQL injection:** Use parameterized queries (Supabase client handles this)
- **Rate limiting:** 
  - 10 req/min for AI endpoints
  - 100 req/min for standard API routes
  - 1000 req/hour per user globally

### Payment Security
- **Never store card details** — Lemon Squeezy handles PCI compliance
- **Webhook signature verification** — Validate all incoming webhooks
- **Idempotency keys** — Prevent duplicate charges
- **Audit log** — Log all subscription changes

## Module Implementation Order

When building this project, follow this sequence:

1. **Setup Project** (`prompts/01-setup-project.md`)
   - Initialize Next.js 15
   - Install dependencies
   - Configure environment variables

2. **Setup Database** (`prompts/02-setup-database.md`)
   - Create Supabase project
   - Run migrations
   - Set up RLS policies
   - Seed initial data

3. **Setup Auth** (`prompts/03-setup-auth.md`)
   - Implement Supabase Auth
   - Create login/signup pages
   - Add session management

4. **Create API** (`prompts/04-create-api.md`)
   - Build lesson endpoints
   - Implement progress tracking
   - Add XP/streak logic
   - Create AI sparring partner endpoint

5. **Create UI** (`prompts/05-create-ui.md`)
   - Build dashboard layout
   - Create camp/lesson pages
   - Implement gamification UI (XP bar, badges)
   - Add profile page

6. **Integrate Payments** (`prompts/06-integrate-payments.md`)
   - Set up Lemon Squeezy
   - Create checkout flow
   - Implement webhooks
   - Build billing page

7. **Deploy** (`prompts/07-deploy.md`)
   - Configure Vercel project
   - Set production environment variables
   - Set up monitoring
   - Configure custom domain

## AI Integration Notes

### GPT-4o Mini (AI Sparring Partner)
- **Model:** `gpt-4o-mini`
- **Purpose:** Real-time Thai conversation practice
- **Cost control:** 
  - Cache system messages
  - Limit conversation history to last 10 messages
  - Timeout after 30 seconds
  - Rate limit: 10 conversations per day (free), unlimited (pro)

**System prompt structure:**
```
You are a friendly Thai language tutor helping a Muay Thai trainee practice conversational Thai. 
Respond naturally in Thai, and provide English translations in parentheses.
Correct errors gently by restating the correct phrase.
Keep responses under 50 words.
```

### Whisper API (Pronunciation Feedback)
- **Model:** `whisper-1`
- **Purpose:** Speech-to-text for pronunciation scoring
- **Implementation:**
  - User records audio (max 30 seconds)
  - Upload to Supabase Storage
  - Send to Whisper API
  - Compare transcription to expected text
  - Return similarity score (0-100%)

### Claude 3.5 Haiku (Internal Lesson Generation)
- **Purpose:** Generate lesson content, vocabulary drills
- **Usage:** Internal tool for content team
- **Not exposed to users** — used for authoring only

## Design System

### Colors (Thai Flag Theme)
```css
/* Primary */
--primary-red: #DA291C; /* Thai flag red */
--primary-blue: #241663; /* Thai flag blue */
--primary-gold: #FFD700; /* Gold accents */

/* Neutrals */
--gray-50: #F9FAFB;
--gray-900: #111827;

/* Feedback */
--success: #10B981;
--error: #EF4444;
--warning: #F59E0B;
```

### Typography
- **Headings:** Inter, bold
- **Body:** Inter, regular
- **Thai text:** Noto Sans Thai, regular

### Component Library
- **Base:** shadcn/ui (Radix UI + Tailwind)
- **Custom components:** 
  - `<LessonCard />` — Camp/lesson display
  - `<XPBar />` — Progress indicator
  - `<BadgeDisplay />` — Badge showcase
  - `<StreakCounter />` — Streak visualization

## Testing Strategy

### Unit Tests (Jest + React Testing Library)
- Utility functions (XP calculation, streak logic)
- Component rendering
- API route handlers (mocked Supabase)

### Integration Tests (Playwright)
- User signup flow
- Lesson completion flow
- XP/badge award flow
- Payment upgrade flow

### E2E Tests (Playwright)
- Critical user journeys
- Run in CI on every PR

### Manual Testing Checklist
- [ ] Mobile responsiveness (iPhone SE, iPad, desktop)
- [ ] Dark mode (if implemented)
- [ ] Keyboard navigation
- [ ] Screen reader compatibility

## Monitoring and Observability

### Error Tracking (Sentry)
- Frontend errors
- API route errors
- Background job failures

### Analytics (PostHog)
- Track key events:
  - `user_signed_up`
  - `lesson_started`
  - `lesson_completed`
  - `xp_earned`
  - `badge_earned`
  - `upgrade_initiated`
  - `subscription_created`

### Alerts (LogSnag)
- New user signups
- Payment failures
- API error rate spikes
- Daily active user milestones

## Deployment Checklist

Before deploying to production:
- [ ] All environment variables set in Vercel
- [ ] Database migrations run on production Supabase
- [ ] RLS policies enabled on all tables
- [ ] Lemon Squeezy webhook configured
- [ ] Sentry DSN configured
- [ ] Analytics tracking verified
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Rate limiting enabled
- [ ] Backup strategy configured

## Common Tasks

### Adding a New Lesson
1. Add audio file to `public/audio/`
2. Insert lesson record in Supabase `lessons` table
3. Define lesson content (vocab, exercises) in JSONB format
4. Test lesson rendering on frontend
5. Update camp `order` if needed

### Adding a New Badge
1. Design badge icon (SVG)
2. Upload to Supabase Storage
3. Insert badge record with criteria (JSONB)
4. Implement badge-checking logic in API
5. Test badge award flow

### Updating Subscription Plans
1. Update pricing in Lemon Squeezy dashboard
2. Update plan descriptions in `modules/payments-module.md`
3. Update UI copy in billing page
4. Test checkout flow
5. Announce changes to users

## Troubleshooting

### Common Issues

**Build fails with TypeScript errors:**
- Run `npm run type-check` locally
- Fix type errors before committing
- Ensure all imports are correct

**Supabase RLS policies blocking queries:**
- Check RLS policies in Supabase dashboard
- Verify JWT token is being sent in requests
- Use Supabase client's `.from('table').select()` syntax
- Test with service role key to verify data exists

**Lemon Squeezy webhooks not received:**
- Verify webhook URL in Lemon Squeezy dashboard
- Check webhook secret matches `.env.local`
- Test webhook with Lemon Squeezy's testing tool
- Review API route logs in Vercel

**AI sparring partner timing out:**
- Check OpenAI API key is valid
- Reduce conversation history length
- Increase timeout to 60 seconds
- Implement retry logic with exponential backoff

## Additional Resources

- **Next.js 15 Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com
- **Lemon Squeezy API:** https://docs.lemonsqueezy.com
- **OpenAI API:** https://platform.openai.com/docs

---

**Train hard, learn easy — one Thai word at a time!** 🥋
- apart from the ones ive already created. Create the following blank markdown files with this exact structure:

thaifighttalk/
├── USER_INSTRUCTIONS.md
├── README.md
├── CLAUDE.md
├── modules/
│   ├── auth-module.md
│   ├── api-module.md
│   ├── database-module.md
│   ├── ui-module.md
│   └── payments-module.md
└── prompts/
    ├── 01-setup-project.md
    ├── 02-setup-database.md
    ├── 03-setup-auth.md
    ├── 04-create-api.md
    ├── 05-create-ui.md
    ├── 06-integrate-payments.md
    └── 07-deploy.md