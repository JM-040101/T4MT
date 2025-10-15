/**
 * ThaiFightTalk Type Definitions
 * All TypeScript types for the application
 */

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string
  email: string
  display_name: string | null
  xp: number
  streak: number
  current_level: number
  last_activity: string | null
  org_id: string | null
  created_at: string
}

export interface UserProfile extends User {
  total_lessons_completed: number
  badges_earned: number
  rank?: number
}

// ============================================================================
// Camp & Lesson Types
// ============================================================================

export interface Camp {
  id: string
  title: string
  theme: string | null
  description: string | null
  order: number
  unlock_level: number
  created_at: string
  lessons?: Lesson[]
  progress?: number // Calculated field (percentage complete)
}

export interface Lesson {
  id: string
  camp_id: string
  title: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  media_url: string | null
  content: LessonContent
  xp_reward: number
  order: number
  created_at: string
  user_progress?: UserLessonProgress
}

export interface LessonContent {
  vocabulary?: VocabularyItem[]
  exercises?: Exercise[]
  audio_url?: string
  transcript?: string
  cultural_note?: string
}

export interface VocabularyItem {
  thai: string
  phonetic: string
  english: string
  example?: string
}

export interface Exercise {
  type: 'multiple_choice' | 'fill_blank' | 'pronunciation' | 'translation'
  question: string
  options?: string[]
  correct_answer: string | number
  explanation?: string
}

// ============================================================================
// Progress Types
// ============================================================================

export interface UserLessonProgress {
  id: string
  user_id: string
  lesson_id: string
  completed: boolean
  score: number | null
  attempts: number
  last_attempt: string | null
}

// ============================================================================
// Gamification Types
// ============================================================================

export interface Badge {
  id: string
  name: string
  description: string | null
  icon_url: string | null
  criteria: BadgeCriteria
  created_at: string
}

export interface BadgeCriteria {
  type: 'xp_threshold' | 'streak_days' | 'lessons_completed' | 'perfect_scores'
  value: number
}

export interface UserBadge {
  user_id: string
  badge_id: string
  earned_at: string
  badge?: Badge
}

export interface LeaderboardEntry {
  user_id: string
  display_name: string
  xp: number
  current_level: number
  rank: number
}

// ============================================================================
// Subscription Types
// ============================================================================

export type SubscriptionPlan = 'free' | 'pro' | 'gym_edition'
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'paused'

export interface Subscription {
  id: string
  user_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  lemon_squeezy_id: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

// ============================================================================
// AI Sparring Partner Types
// ============================================================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface SparringSession {
  id: string
  user_id: string
  messages: ChatMessage[]
  topic: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  created_at: string
  ended_at: string | null
}

// ============================================================================
// Form Types
// ============================================================================

export interface LoginFormData {
  email: string
  password: string
}

export interface SignupFormData {
  email: string
  password: string
  display_name: string
}

export interface ProfileUpdateData {
  display_name?: string
  email?: string
}

// ============================================================================
// Utility Types
// ============================================================================

export type SortDirection = 'asc' | 'desc'

export interface SortOptions {
  field: string
  direction: SortDirection
}

export interface FilterOptions {
  difficulty?: Lesson['difficulty']
  completed?: boolean
  min_xp?: number
  max_xp?: number
}
