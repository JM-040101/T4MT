# ThaiFightTalk — Gamified Thai Learning for Muay Thai Travelers

> "Train hard, learn easy — one Thai word at a time." 🥋

## Overview

**ThaiFightTalk** is a gamified Thai language learning platform designed specifically for Muay Thai travelers and trainees visiting Thailand. Unlike generic language apps, ThaiFightTalk focuses on practical, culturally-relevant vocabulary and phrases that help users quickly adapt to gym culture, local life, and social situations.

### The Problem

Foreign Muay Thai practitioners face several challenges when training in Thailand:
- Generic language apps lack **gym-specific vocabulary** (clinch, teep, roundhouse, pad work)
- No context for **travel and local social situations**
- Frustration with irrelevant content that doesn't help them **connect in the gym**
- Missed opportunities to **earn respect** from Thai trainers and locals by speaking the language

### The Solution

A **Muay Thai training journey** where users:
- Progress through "training camps" (themed lesson modules)
- Earn XP, maintain streaks, and unlock badges
- Practice with an **AI sparring partner** for real conversation
- Learn vocabulary that matters: gym commands, food orders, directions, cultural phrases
- Build confidence to speak Thai from day one in Thailand

## Target Users

**Primary ICP (Ideal Customer Profile):**
- Foreign Muay Thai trainees (ages 18-45)
- Visiting Thailand for training camps (1 week to 6 months)
- Motivated by cultural immersion and authentic experiences
- Limited or no prior Thai language knowledge
- Want to **connect faster** and **feel at home** in Thai gyms

**Secondary Audience (V1.5+):**
- Muay Thai gyms offering language support to foreign students
- Combat sports enthusiasts interested in Thai culture
- Travelers visiting Thailand who train casually

## Core Features

### MVP (Phase 1)
✅ **User Accounts** — Sign up with email, Google, or Apple
✅ **Lesson System** — Interactive drills with audio, vocab, and mini-games
✅ **Gamification** — XP, streak tracking, level progression
✅ **Training Camps** — 3-5 themed modules (Bangkok Basics, Gym Commands, Food & Travel)
✅ **Progress Dashboard** — View stats, current level, completed lessons
✅ **Simple Leaderboard** — Compare progress with other learners

### Growth Phase (V1.5)
🚀 **AI Sparring Partner** — Chat in Thai with real-time feedback (GPT-4o Mini)
🚀 **Pronunciation Feedback** — Whisper API for speech-to-text scoring
🚀 **Gym-Specific Phrase Packs** — Custom content for partner gyms
🚀 **Offline Mode** — Download lessons for training without internet
🚀 **Referral System** — Earn rewards for inviting friends

### Enterprise Phase (V2.0)
🏢 **Multi-Tenant Architecture** — Gyms manage student licenses
🏢 **Gym Community Features** — Team leaderboards, group challenges
🏢 **Admin Dashboards** — Track student progress, usage analytics
🏢 **Bulk Licensing** — Discounted plans for gym partners
🏢 **White-Label Options** — Custom branding for large gym chains

## Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS + Radix UI
- **State Management:** React Context + Server Components
- **UI Components:** shadcn/ui
- **Animations:** Framer Motion (lesson transitions, XP feedback)

### Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (Email, OAuth)
- **API:** Next.js API Routes (serverless functions)
- **File Storage:** Supabase Storage (lesson media, audio files)
- **Real-time:** Supabase Realtime (leaderboard updates)

### AI & Media
- **AI Sparring Partner:** GPT-4o Mini (OpenAI)
- **Speech Recognition:** Whisper API (OpenAI)
- **Text-to-Speech:** Google Cloud TTS or ElevenLabs
- **Lesson Generation (internal):** Claude 3.5 Haiku

### Infrastructure
- **Hosting:** Vercel (web app, serverless functions)
- **Database:** Supabase Cloud (managed PostgreSQL)
- **CDN:** Vercel Edge Network + Cloudflare (media assets)
- **Monitoring:** Sentry (errors), LogSnag (usage alerts)
- **Analytics:** PostHog or Mixpanel (activation, retention)

### Payments & Business
- **Payment Processor:** Lemon Squeezy (MoR, handles global VAT/tax)
- **Email:** Resend or SendGrid (transactional emails)
- **CI/CD:** GitHub Actions → Vercel auto-deploy

## Architecture Overview
```
┌─────────────────────────────────────────────────────┐
│                    Next.js 15 App                    │
│  (SSR, App Router, Server Components, API Routes)   │
└───────────┬──────────────────────────┬──────────────┘
            │                          │
            ▼                          ▼
   ┌────────────────┐        ┌─────────────────┐
   │   Supabase     │        │  External APIs  │
   │  - PostgreSQL  │        │  - OpenAI       │
   │  - Auth        │        │  - Lemon Squeezy│
   │  - Storage     │        │  - Analytics    │
   │  - Realtime    │        └─────────────────┘
   └────────────────┘
            │
            ▼
   ┌────────────────┐
   │   User Data    │
   │  - Profile     │
   │  - Progress    │
   │  - Subscriptions│
   └────────────────┘
```

### Key Architectural Decisions

1. **Serverless-First:** Horizontal scaling via Vercel edge functions (handles seasonal traffic spikes)
2. **Multi-Tenancy:** Single database with `org_id` columns; Supabase RLS for data isolation
3. **Progressive Enhancement:** Core lessons work offline; AI features require internet
4. **CDN Strategy:** Static lesson assets cached at edge; dynamic content via API routes
5. **Security:** Encrypt user data at rest; JWT tokens; rate limiting on API endpoints

## Database Schema Overview

### Core Tables

**users**
- `id` (uuid, primary key)
- `email` (text, unique)
- `display_name` (text)
- `xp` (integer, default 0)
- `streak` (integer, default 0)
- `current_level` (integer, default 1)
- `last_activity` (timestamp)
- `org_id` (uuid, nullable, foreign key to orgs)
- `created_at` (timestamp)

**camps**
- `id` (uuid, primary key)
- `title` (text) — e.g., "Bangkok Basics"
- `theme` (text) — e.g., "survival phrases"
- `description` (text)
- `order` (integer) — display sequence
- `unlock_level` (integer) — required level to access

**lessons**
- `id` (uuid, primary key)
- `camp_id` (uuid, foreign key)
- `title` (text)
- `difficulty` (enum: beginner, intermediate, advanced)
- `media_url` (text) — audio file path
- `content` (jsonb) — lesson structure (vocab, exercises)
- `xp_reward` (integer)
- `order` (integer)

**user_lessons**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `lesson_id` (uuid, foreign key)
- `completed` (boolean, default false)
- `score` (integer, nullable)
- `attempts` (integer, default 0)
- `last_attempt` (timestamp)

**badges**
- `id` (uuid, primary key)
- `name` (text) — e.g., "First Blood"
- `description` (text)
- `icon_url` (text)
- `criteria` (jsonb) — unlock conditions

**user_badges**
- `user_id` (uuid, foreign key)
- `badge_id` (uuid, foreign key)
- `earned_at` (timestamp)

**orgs** (V1.5+)
- `id` (uuid, primary key)
- `name` (text) — gym name
- `slug` (text, unique)
- `plan` (enum: free, gym_edition)
- `created_at` (timestamp)

**subscriptions**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `plan` (enum: free, pro, gym_edition)
- `status` (enum: active, cancelled, past_due)
- `lemon_squeezy_id` (text) — external subscription ID
- `current_period_end` (timestamp)

### Multi-Tenancy Strategy

- **Phase 1 (MVP):** No multi-tenancy; all users in shared pool
- **Phase 2 (V1.5):** Add `org_id` to users table; gyms can invite members
- **Phase 3 (Enterprise):** Optional database-per-tenant for large gym chains
- **Access Control:** Supabase Row-Level Security (RLS) policies enforce data isolation

## Pricing Model

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 2 camps unlocked, basic XP/streaks, leaderboard access |
| **Pro** | $6.99/mo | All camps, offline mode, AI sparring partner, pronunciation feedback |
| **Gym Edition** | Custom | Bulk licenses (10+ users), gym-branded content, admin dashboard |

### Billing Flow
1. User signs up (free tier)
2. After completing 2 lessons, upgrade prompt appears
3. Lemon Squeezy handles checkout (includes VAT/tax)
4. Webhook updates subscription status in database
5. User immediately gains access to Pro features

### Payment Provider: Lemon Squeezy
- Merchant of Record (MoR) — handles global VAT/tax compliance
- Supports PayPal, credit cards, Apple Pay
- Built-in EU VAT handling
- Webhook system for subscription events

## Development Setup

### Prerequisites
- Node.js 18+
- npm or pnpm
- Git
- Supabase account
- Vercel account (optional for deployment)

### Quick Start
```bash
# Clone repository
git clone https://github.com/yourusername/thaifighttalk.git
cd thaifighttalk

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Configure Supabase credentials in .env.local
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Run database migrations
npm run db:migrate

# Start development server
npm run dev

# Open http://localhost:3000
```

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# OpenAI (for AI sparring partner)
OPENAI_API_KEY=sk-xxx

# Lemon Squeezy
LEMON_SQUEEZY_API_KEY=xxx
LEMON_SQUEEZY_STORE_ID=xxx
LEMON_SQUEEZY_WEBHOOK_SECRET=xxx

# Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Monitoring (optional)
SENTRY_DSN=https://xxx@sentry.io/xxx
```

## Project Structure
```
thaifighttalk/
├── src/
│   ├── app/                # Next.js 15 App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/
│   │   │   ├── camps/
│   │   │   ├── lessons/
│   │   │   ├── profile/
│   │   │   └── leaderboard/
│   │   ├── api/            # API routes
│   │   │   ├── lessons/
│   │   │   ├── progress/
│   │   │   ├── ai-sparring/
│   │   │   └── webhooks/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── lesson/        # Lesson-specific components
│   │   ├── gamification/  # XP, badges, streaks
│   │   └── layout/        # Nav, footer, etc.
│   ├── lib/               # Utilities
│   │   ├── supabase/      # Supabase client, queries
│   │   ├── ai/            # OpenAI integration
│   │   └── utils/         # Helper functions
│   └── types/             # TypeScript types
├── public/                # Static assets
│   ├── audio/             # Lesson audio files
│   ├── images/            # Icons, illustrations
│   └── fonts/             # Custom fonts
├── supabase/
│   ├── migrations/        # SQL migration files
│   └── seed.sql           # Initial data
├── prompts/               # Implementation prompts (this export)
├── modules/               # Module documentation (this export)
├── CLAUDE.md              # Claude Code config
├── README.md              # This file
└── package.json
```

## Success Metrics (MVP)

### Activation
- **Time to First Value (TTFV):** < 3 minutes from signup to first lesson
- **Onboarding Completion:** 70% complete first lesson
- **Day 3 Retention:** 50% return within 3 days

### Engagement
- **Daily Active Users (DAU):** 20% of MAU
- **Streak Maintenance:** 30% maintain 7-day streak
- **XP Earned per Session:** Average 150 XP

### Monetization
- **Free-to-Pro Conversion:** 5% within first month
- **Churn Rate:** < 5% monthly
- **Average Revenue per User (ARPU):** $4.50/month

### Growth
- **Monthly Active Users (MAU):** 5,000 in first 6 months
- **Viral Coefficient:** 0.3 (referral program in V1.5)
- **Gym Partnerships:** 5 partner gyms by month 6

## Roadmap

### Q1 2025 — MVP Launch
- ✅ Core lesson system
- ✅ Gamification (XP, streaks, badges)
- ✅ 3-5 camps with 30+ lessons
- ✅ User profiles and progress tracking
- ✅ Payment integration (Lemon Squeezy)

### Q2 2025 — AI Features (V1.5)
- 🤖 AI sparring partner (text chat in Thai)
- 🎤 Pronunciation feedback (Whisper API)
- 📴 Offline mode
- 🏋️ Gym-specific phrase packs
- 🎁 Referral rewards

### Q3 2025 — Gym Partnerships
- 🏢 Multi-tenant architecture
- 📊 Admin dashboards for gyms
- 👥 Bulk licensing
- 🏆 Team leaderboards
- 🤝 5-10 gym partnerships

### Q4 2025 — Scale & Optimize
- 📈 Advanced analytics
- 🌐 Internationalization (support for more languages)
- 🎨 White-label options
- 🚀 Performance optimizations
- 📱 Native mobile apps (React Native)

## Contributing

(This section will be added post-MVP when open-sourcing or accepting contributions)

## License

(To be determined — likely proprietary for MVP, potentially open-source core later)

## Contact

- **Website:** https://thaifighttalk.com (coming soon)
- **Email:** hello@thaifighttalk.com
- **Twitter:** @thaifighttalk

---

**Built with ❤️ for the global Muay Thai community.**

Train hard, learn easy — one Thai word at a time! 🥋🇹🇭