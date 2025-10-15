# API Module

## Purpose

The API module provides RESTful endpoints for the ThaiFightTalk application. It handles lesson delivery, progress tracking, XP calculations, streak management, badge awards, and AI-powered features (sparring partner, pronunciation feedback).

## Key Features

### Lesson Management
- Fetch available camps (lesson modules)
- Fetch lessons within a camp
- Get lesson content (vocab, exercises, audio)
- Track lesson completion
- Award XP on completion

### Progress Tracking
- Record user progress on lessons
- Update XP and level
- Maintain learning streaks
- Award badges based on criteria

### Gamification Logic
- XP calculation and level-up system
- Streak tracking (daily activity)
- Streak recovery (grace period)
- Badge eligibility checks

### AI Features
- AI sparring partner (text conversation in Thai)
- Pronunciation feedback (Whisper API)
- Lesson content generation (internal tool)

### Leaderboards
- Global leaderboard (top XP earners)
- Gym-specific leaderboards (V1.5+)
- Friend leaderboards (future)

## Implementation Constraints

### API Design Principles
- **RESTful conventions:** Use standard HTTP methods (GET, POST, PUT, DELETE)
- **Versioning:** All routes under `/api/v1/` for future compatibility
- **JSON only:** All requests/responses use `Content-Type: application/json`
- **Error handling:** Consistent error format across all endpoints
- **Pagination:** Use `page` and `limit` query params for large datasets
- **Rate limiting:** Enforce per-user and per-IP rate limits

### Authentication
- All API routes require valid JWT token (except public endpoints)
- Extract user ID from JWT payload
- Never trust client-provided user IDs

### Validation
- Use Zod schemas for all input validation
- Validate on both client and server
- Return 400 Bad Request with detailed error messages

### Error Response Format
```typescript
{
  error: {
    code: string; // e.g., "INVALID_INPUT"
    message: string; // Human-readable error
    details?: any; // Optional additional context
  }
}
```

### Success Response Format
```typescript
{
  data: any; // The actual response data
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
```

## API Endpoints

### Camps

#### GET /api/v1/camps
**Purpose:** Fetch all available camps

**Auth:** Required

**Query Params:**
- `unlocked_only` (boolean) — Only return camps user has unlocked

**Response:**
```typescript
{
  data: {
    id: string;
    title: string;
    theme: string;
    description: string;
    order: number;
    unlock_level: number;
    lesson_count: number;
    completed_count: number; // User's progress
    is_unlocked: boolean; // Based on user's level
  }[]
}
```

**Logic:**
```typescript
// Fetch camps with user progress
const { data: camps } = await supabase
  .from('camps')
  .select(`
    *,
    lessons (count),
    user_lessons!inner (
      completed,
      user_id
    )
  `)
  .eq('user_lessons.user_id', userId)
  .order('order')

// Check if each camp is unlocked
const enrichedCamps = camps.map(camp => ({
  ...camp,
  is_unlocked: userLevel >= camp.unlock_level
}))
```

### Lessons

#### GET /api/v1/camps/:campId/lessons
**Purpose:** Fetch lessons in a specific camp

**Auth:** Required

**Response:**
```typescript
{
  data: {
    id: string;
    camp_id: string;
    title: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    xp_reward: number;
    order: number;
    completed: boolean; // User's completion status
    score: number | null; // User's best score
  }[]
}
```

#### GET /api/v1/lessons/:lessonId
**Purpose:** Fetch detailed lesson content

**Auth:** Required

**Response:**
```typescript
{
  data: {
    id: string;
    title: string;
    difficulty: string;
    media_url: string; // Audio file URL
    xp_reward: number;
    content: {
      vocabulary: {
        thai: string;
        romanization: string;
        english: string;
        audio_url: string;
      }[];
      exercises: {
        type: 'multiple_choice' | 'fill_blank' | 'audio_match';
        question: string;
        options?: string[];
        correct_answer: string;
      }[];
    };
    user_progress: {
      completed: boolean;
      score: number | null;
      attempts: number;
      last_attempt: string | null;
    };
  }
}
```

#### POST /api/v1/lessons/:lessonId/complete
**Purpose:** Mark lesson as completed and award XP

**Auth:** Required

**Body:**
```typescript
{
  score: number; // 0-100
  time_spent: number; // Seconds
}
```

**Response:**
```typescript
{
  data: {
    xp_earned: number;
    new_total_xp: number;
    level_up: boolean;
    new_level?: number;
    badges_earned?: {
      id: string;
      name: string;
      icon_url: string;
    }[];
  }
}
```

**Logic:**
```typescript
// 1. Update user_lessons
await supabase
  .from('user_lessons')
  .upsert({
    user_id: userId,
    lesson_id: lessonId,
    completed: true,
    score,
    attempts: existingAttempts + 1,
    last_attempt: new Date().toISOString()
  })

// 2. Calculate XP earned
const xp_earned = lesson.xp_reward * (score / 100)

// 3. Update user XP
const { data: user } = await supabase
  .from('users')
  .update({
    xp: user.xp + xp_earned,
    last_activity: new Date().toISOString()
  })
  .eq('id', userId)
  .select()
  .single()

// 4. Check for level up
const newLevel = calculateLevel(user.xp)
const leveledUp = newLevel > user.current_level

if (leveledUp) {
  await supabase
    .from('users')
    .update({ current_level: newLevel })
    .eq('id', userId)
}

// 5. Check for badge eligibility
const newBadges = await checkBadgeEligibility(userId)

return {
  xp_earned,
  new_total_xp: user.xp,
  level_up: leveledUp,
  new_level: leveledUp ? newLevel : undefined,
  badges_earned: newBadges
}
```

### Progress

#### GET /api/v1/progress
**Purpose:** Fetch user's overall progress

**Auth:** Required

**Response:**
```typescript
{
  data: {
    xp: number;
    level: number;
    streak: number;
    total_lessons_completed: number;
    total_lessons_available: number;
    badges_earned: number;
    last_activity: string;
  }
}
```

#### POST /api/v1/progress/streak
**Purpose:** Update user's streak (called on daily first activity)

**Auth:** Required

**Response:**
```typescript
{
  data: {
    streak: number;
    streak_maintained: boolean;
    streak_broken: boolean;
  }
}
```

**Logic:**
```typescript
const now = new Date()
const lastActivity = new Date(user.last_activity)
const hoursSinceLastActivity = (now - lastActivity) / (1000 * 60 * 60)

if (hoursSinceLastActivity < 24) {
  // Same day, no change
  return { streak: user.streak, streak_maintained: true }
} else if (hoursSinceLastActivity < 48) {
  // Within grace period, increment streak
  const newStreak = user.streak + 1
  await supabase
    .from('users')
    .update({ streak: newStreak })
    .eq('id', userId)
  return { streak: newStreak, streak_maintained: true }
} else {
  // Streak broken, reset to 1
  await supabase
    .from('users')
    .update({ streak: 1 })
    .eq('id', userId)
  return { streak: 1, streak_broken: true }
}
```

### Badges

#### GET /api/v1/badges
**Purpose:** Fetch all available badges and user's earned status

**Auth:** Required

**Response:**
```typescript
{
  data: {
    id: string;
    name: string;
    description: string;
    icon_url: string;
    earned: boolean;
    earned_at: string | null;
  }[]
}
```

#### POST /api/v1/badges/check
**Purpose:** Check if user is eligible for any new badges (internal, called after lesson completion)

**Auth:** Required (service role)

**Response:**
```typescript
{
  data: {
    id: string;
    name: string;
    icon_url: string;
  }[]
}
```

**Logic:**
```typescript
async function checkBadgeEligibility(userId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('*, user_lessons(*), user_badges(*)')
    .eq('id', userId)
    .single()

  const allBadges = await supabase.from('badges').select('*')
  const newBadges = []

  for (const badge of allBadges.data) {
    const alreadyEarned = user.user_badges.some(ub => ub.badge_id === badge.id)
    if (alreadyEarned) continue

    const eligible = evaluateCriteria(badge.criteria, user)
    if (eligible) {
      await supabase
        .from('user_badges')
        .insert({ user_id: userId, badge_id: badge.id })
      newBadges.push(badge)
    }
  }

  return newBadges
}

function evaluateCriteria(criteria: any, user: any): boolean {
  // Example criteria:
  // { type: 'lessons_completed', count: 10 }
  // { type: 'streak', count: 7 }
  // { type: 'xp', count: 1000 }

  switch (criteria.type) {
    case 'lessons_completed':
      return user.user_lessons.filter(ul => ul.completed).length >= criteria.count
    case 'streak':
      return user.streak >= criteria.count
    case 'xp':
      return user.xp >= criteria.count
    default:
      return false
  }
}
```

### Leaderboard

#### GET /api/v1/leaderboard
**Purpose:** Fetch global leaderboard

**Auth:** Required

**Query Params:**
- `page` (number, default 1)
- `limit` (number, default 50, max 100)
- `scope` (string, optional) — `global` | `gym:{gym_id}`

**Response:**
```typescript
{
  data: {
    rank: number;
    user_id: string;
    display_name: string;
    xp: number;
    level: number;
    streak: number;
  }[],
  meta: {
    page: number;
    limit: number;
    total: number;
    current_user_rank: number;
  }
}
```

**Logic:**
```typescript
const { data: users } = await supabase
  .from('users')
  .select('id, display_name, xp, current_level as level, streak')
  .order('xp', { ascending: false })
  .range((page - 1) * limit, page * limit - 1)

const leaderboard = users.map((user, index) => ({
  rank: (page - 1) * limit + index + 1,
  ...user
}))

// Get current user's rank
const { count } = await supabase
  .from('users')
  .select('*', { count: 'exact', head: true })
  .gt('xp', currentUser.xp)

const currentUserRank = (count || 0) + 1

return { data: leaderboard, meta: { page, limit, total: totalUsers, current_user_rank: currentUserRank } }
```

### AI Sparring Partner

#### POST /api/v1/ai/sparring
**Purpose:** Chat with AI in Thai for conversation practice

**Auth:** Required (Pro plan only)

**Body:**
```typescript
{
  message: string; // User's message in Thai or English
  conversation_history?: {
    role: 'user' | 'assistant';
    content: string;
  }[]; // Last 10 messages for context
}
```

**Response:**
```typescript
{
  data: {
    response: string; // AI's response in Thai
    translation: string; // English translation
    corrections?: {
      original: string;
      corrected: string;
      explanation: string;
    }[];
  }
}
```

**Logic:**
```typescript
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const systemPrompt = `You are a friendly Thai language tutor helping a Muay Thai trainee practice conversational Thai. 
Respond naturally in Thai, provide English translations in parentheses, and correct errors gently by restating the correct phrase. 
Keep responses under 50 words.`

const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: message }
  ],
  temperature: 0.7,
  max_tokens: 150
})

const response = completion.choices[0].message.content

// Extract Thai text and translation (assuming format: "Thai text (English)")
const [thai, english] = parseResponse(response)

return { response: thai, translation: english }
```

**Rate Limiting:**
- Free users: 10 conversations per day
- Pro users: Unlimited
- Max 1 request per 5 seconds per user

### Pronunciation Feedback

#### POST /api/v1/ai/pronunciation
**Purpose:** Evaluate user's pronunciation of a Thai phrase

**Auth:** Required (Pro plan only)

**Body (multipart/form-data):**
```typescript
{
  audio: File; // WAV or MP3, max 30 seconds
  expected_text: string; // Thai text user is trying to pronounce
}
```

**Response:**
```typescript
{
  data: {
    transcription: string; // What Whisper heard
    score: number; // 0-100, similarity to expected_text
    feedback: string; // Specific guidance
  }
}
```

**Logic:**
```typescript
import OpenAI from 'openai'
import { similarity } from 'string-similarity'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// 1. Upload audio to Supabase Storage
const { data: upload } = await supabase.storage
  .from('audio-temp')
  .upload(`${userId}/${Date.now()}.mp3`, audioFile)

// 2. Transcribe with Whisper
const transcription = await openai.audio.transcriptions.create({
  file: audioFile,
  model: 'whisper-1',
  language: 'th' // Thai
})

// 3. Calculate similarity score
const score = similarity(transcription.text, expectedText) * 100

// 4. Generate feedback
let feedback = ''
if (score >= 90) {
  feedback = 'Excellent pronunciation! 🎉'
} else if (score >= 70) {
  feedback = 'Good job! Try emphasizing the tones more.'
} else {
  feedback = `Listen again to the correct pronunciation and focus on: ${expectedText}`
}

// 5. Clean up temp audio
await supabase.storage.from('audio-temp').remove([upload.path])

return { transcription: transcription.text, score, feedback }
```

**Rate Limiting:**
- Max 20 attempts per hour per user

## Utility Functions

### XP and Level Calculation
```typescript
// lib/gamification.ts

export function calculateLevel(xp: number): number {
  // Level formula: level = floor(sqrt(xp / 100))
  // Level 1: 0-99 XP
  // Level 2: 100-399 XP
  // Level 3: 400-899 XP
  // etc.
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

export function xpForNextLevel(currentLevel: number): number {
  const nextLevel = currentLevel + 1
  return (nextLevel - 1) ** 2 * 100
}

export function xpProgress(currentXP: number, currentLevel: number): number {
  const currentLevelXP = (currentLevel - 1) ** 2 * 100
  const nextLevelXP = xpForNextLevel(currentLevel)
  const progress = ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
  return Math.min(progress, 100)
}
```

### Streak Calculation
```typescript
// lib/gamification.ts

export function calculateStreak(lastActivity: Date): { streak: number; broken: boolean } {
  const now = new Date()
  const hoursSince = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60)

  if (hoursSince < 24) {
    // Same day, streak continues
    return { streak: 0, broken: false } // No change
  } else if (hoursSince < 48) {
    // Next day within grace period, increment
    return { streak: 1, broken: false }
  } else {
    // Streak broken
    return { streak: 1, broken: true }
  }
}
```

## Error Handling

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHENTICATED` | 401 | No valid JWT token |
| `FORBIDDEN` | 403 | User lacks required permissions |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `INVALID_INPUT` | 400 | Validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

### Example Error Handler
```typescript
// lib/api/errorHandler.ts

export function handleAPIError(error: unknown) {
  console.error('API Error:', error)

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_INPUT',
          message: 'Validation failed',
          details: error.errors
        }
      },
      { status: 400 }
    )
  }

  if (error.code === 'PGRST116') {
    return NextResponse.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found'
        }
      },
      { status: 404 }
    )
  }

  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    },
    { status: 500 }
  )
}
```

## Rate Limiting

### Implementation (Upstash Redis + Vercel)
```typescript
// lib/api/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

// Standard API rate limit: 100 requests per minute
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true
})

// AI endpoint rate limit: 10 requests per minute
export const aiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true
})

// Usage in API route:
const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
const { success, limit, reset, remaining } = await apiRateLimit.limit(identifier)

if (!success) {
  return NextResponse.json(
    { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString()
      }
    }
  )
}
```

## Testing Checklist

- [ ] Camps endpoint returns correct data
- [ ] Lessons endpoint filters by user progress
- [ ] Lesson completion awards correct XP
- [ ] Level-up logic triggers at correct thresholds
- [ ] Streak increments on daily activity
- [ ] Streak resets after 48 hours
- [ ] Badges are awarded when criteria met
- [ ] Leaderboard ranks users correctly
- [ ] AI sparring partner responds appropriately
- [ ] Pronunciation feedback scores accurately
- [ ] Rate limiting blocks excessive requests
- [ ] Error responses follow consistent format
- [ ] Unauthorized requests return 401
- [ ] Invalid inputs return 400 with details

## Security Considerations

- **Always verify JWT tokens** on all protected routes
- **Never trust client-provided user IDs** — extract from JWT
- **Validate all inputs** with Zod schemas
- **Sanitize user-generated content** (especially for AI prompts)
- **Rate limit AI endpoints** to prevent abuse and cost overruns
- **Log all AI interactions** for debugging and monitoring
- **Implement request timeouts** (30s for standard, 60s for AI)

## Future Enhancements (V1.5+)

- GraphQL API for more flexible queries
- WebSocket support for real-time leaderboards
- Voice-to-voice AI conversations (not just text)
- Adaptive lesson difficulty based on performance
- Social features (follow friends, send challenges)

---

**References:**
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- OpenAI API: https://platform.openai.com/docs
- Upstash Rate Limiting: https://upstash.com/docs/redis/features/ratelimiting

