File: modules/ui-module.md
markdown# UI Module

## Purpose

The UI module defines the frontend architecture, component structure, design system, routing, state management, and user experience patterns for ThaiFightTalk. The frontend is built with **Next.js 15** (App Router), **Tailwind CSS**, **shadcn/ui**, and **Framer Motion** for animations.

## Key Features

### Design System
- Thai flag color palette (red, blue, gold)
- Consistent typography (Inter font family)
- shadcn/ui component library
- Dark mode support (future)
- Responsive design (mobile-first)

### Page Structure
- Dashboard (home, progress overview)
- Camps (browse available camps)
- Lessons (interactive lesson player)
- Profile (user stats, badges, settings)
- Leaderboard (global and gym rankings)
- Billing (subscription management)

### Component Library
- Reusable UI components (buttons, cards, modals)
- Gamification components (XP bar, badge display, streak counter)
- Lesson components (vocab cards, exercise player)

### Animations
- Page transitions (Framer Motion)
- XP bar fill animations
- Badge unlock celebrations
- Streak fire effect

### State Management
- React Server Components (RSC) for data fetching
- Client Components for interactivity
- Context API for global state (auth, theme)
- SWR or TanStack Query for client-side data fetching (future)

## Implementation Constraints

### Next.js 15 App Router Rules
- **Use Server Components by default** — Only add `"use client"` when necessary
- **Co-locate data fetching** — Fetch data in Server Components, pass props to Client Components
- **Streaming and Suspense** — Use React Suspense for loading states
- **Server Actions** — Use for form submissions and mutations

### Component Guidelines
- **Keep components small** — Max 200 lines per component
- **Extract subcomponents** — If a component grows, split it
- **Use TypeScript** — Define props interfaces for all components
- **Consistent naming** — PascalCase for components, camelCase for functions

### Styling Constraints
- **Tailwind utility classes only** — No custom CSS unless absolutely necessary
- **Use shadcn/ui components** — Don't reinvent common UI patterns
- **Mobile-first** — Design for 320px viewports first, scale up
- **Accessibility** — WCAG AA compliance (color contrast, keyboard nav, ARIA labels)

### Performance Constraints
- **Image optimization** — Always use `next/image`
- **Code splitting** — Lazy load heavy components (AI sparring partner)
- **Bundle size** — Keep client JS under 200KB gzipped
- **Lighthouse score** — Target 90+ on all metrics

## Design System

### Color Palette
```typescript
// tailwind.config.ts

const colors = {
  // Thai flag inspired
  primary: {
    red: '#DA291C', // Thai flag red
    blue: '#241663', // Thai flag blue
    gold: '#FFD700', // Gold accents for badges
  },
  
  // Neutrals
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Feedback colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
}
```

### Typography
```typescript
// tailwind.config.ts

const fontFamily = {
  sans: ['Inter', 'sans-serif'],
  thai: ['Noto Sans Thai', 'sans-serif'],
}

const fontSize = {
  xs: ['0.75rem', { lineHeight: '1rem' }],
  sm: ['0.875rem', { lineHeight: '1.25rem' }],
  base: ['1rem', { lineHeight: '1.5rem' }],
  lg: ['1.125rem', { lineHeight: '1.75rem' }],
  xl: ['1.25rem', { lineHeight: '1.75rem' }],
  '2xl': ['1.5rem', { lineHeight: '2rem' }],
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
}
```

### Spacing

- Use Tailwind's default spacing scale (4px increments)
- Consistent padding: `p-4` (1rem) for cards, `p-6` (1.5rem) for pages
- Consistent gaps: `gap-4` for grids, `gap-2` for inline elements

### Border Radius

- Small: `rounded-md` (0.375rem) for buttons
- Medium: `rounded-lg` (0.5rem) for cards
- Large: `rounded-xl` (0.75rem) for modals
- Full: `rounded-full` for avatars, badges

## Page Structure

### Dashboard Page (`/dashboard`)

**Purpose:** Home page showing progress overview

**Sections:**
- Welcome message with current level
- XP progress bar
- Streak counter with flame icon
- Quick stats (lessons completed, badges earned)
- Continue learning CTA (next lesson)
- Recent badges

**Layout:**
```tsx
// app/(dashboard)/dashboard/page.tsx

import { getUserProgress } from '@/lib/supabase/queries'

export default async function DashboardPage() {
  const progress = await getUserProgress()
  
  return (
    
      
      
      
      
      
      
    
  )
}
```

### Camps Page (`/camps`)

**Purpose:** Browse available lesson camps

**Layout:**
```tsx
// app/(dashboard)/camps/page.tsx

import { getCamps } from '@/lib/supabase/queries'
import { CampCard } from '@/components/camps/CampCard'

export default async function CampsPage() {
  const camps = await getCamps()
  
  return (
    
      Training Camps
      
        {camps.map(camp => (
          
        ))}
      
    
  )
}
```

**CampCard Component:**
```tsx
// components/camps/CampCard.tsx
'use client'

import Link from 'next/link'
import { LockIcon } from 'lucide-react'

export function CampCard({ camp }: { camp: Camp }) {
  return (
    
      
        
          {camp.title}
          {!camp.is_unlocked && }
        
        {camp.description}
        
          {camp.lesson_count} lessons
          
            Level {camp.unlock_level}+
          
        
        {camp.completed_count > 0 && (
          
            
              <div
                className="bg-primary-blue h-2 rounded-full transition-all"
                style={{ width: `${(camp.completed_count / camp.lesson_count) * 100}%` }}
              />
            
            
              {camp.completed_count}/{camp.lesson_count} completed
            
          
        )}
      
    
  )
}
```

### Lesson Player Page (`/lessons/:lessonId`)

**Purpose:** Interactive lesson with exercises

**Layout:**
```tsx
// app/(dashboard)/lessons/[lessonId]/page.tsx

import { getLesson } from '@/lib/supabase/queries'
import { LessonPlayer } from '@/components/lessons/LessonPlayer'

export default async function LessonPage({ params }: { params: { lessonId: string } }) {
  const lesson = await getLesson(params.lessonId)
  
  return (
    
      
    
  )
}
```

**LessonPlayer Component:**
```tsx
// components/lessons/LessonPlayer.tsx
'use client'

import { useState } from 'react'
import { VocabularySection } from './VocabularySection'
import { ExerciseSection } from './ExerciseSection'
import { CompletionModal } from './CompletionModal'

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const [step, setStep] = useState('vocabulary')
  const [score, setScore] = useState(0)
  const [showCompletion, setShowCompletion] = useState(false)
  
  async function handleComplete() {
    // Submit lesson completion to API
    const response = await fetch(`/api/v1/lessons/${lesson.id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ score, time_spent: 120 })
    })
    
    const data = await response.json()
    setShowCompletion(true)
    // Show XP earned, badges, level up
  }
  
  return (
    
      {lesson.title}
      
      {step === 'vocabulary' && (
        <VocabularySection
          vocabulary={lesson.content.vocabulary}
          onComplete={() => setStep('exercises')}
        />
      )}
      
      {step === 'exercises' && (
        <ExerciseSection
          exercises={lesson.content.exercises}
          onComplete={(finalScore) => {
            setScore(finalScore)
            handleComplete()
          }}
        />
      )}
      
      {showCompletion && (
        
      )}
    
  )
}
```

### Profile Page (`/profile`)

**Purpose:** User stats, badges, settings

**Sections:**
- Avatar and display name
- XP and level
- Streak counter
- Badges showcase
- Settings (change password, delete account)

**Layout:**
```tsx
// app/(dashboard)/profile/page.tsx

import { getUser, getUserBadges } from '@/lib/supabase/queries'
import { Avatar } from '@/components/ui/Avatar'
import { BadgeGrid } from '@/components/profile/BadgeGrid'

export default async function ProfilePage() {
  const user = await getUser()
  const badges = await getUserBadges()
  
  return (
    
      
        
          
          
            {user.display_name}
            Level {user.current_level}
          
        
        
        
          
          
          <StatCard label="Badges" value={badges.filter(b => b.earned).length} />
        
      
      
      
      
      
    
  )
}
```

### Leaderboard Page (`/leaderboard`)

**Purpose:** Global rankings

**Layout:**
```tsx
// app/(dashboard)/leaderboard/page.tsx

import { getLeaderboard } from '@/lib/supabase/queries'
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable'

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard()
  
  return (
    
      Leaderboard
      
    
  )
}
```

### Billing Page (`/billing`)

**Purpose:** Manage subscription

**Sections:**
- Current plan
- Usage stats (lessons completed, AI conversations)
- Upgrade CTA (if free)
- Cancel subscription button (if pro)

**Layout:**
```tsx
// app/(dashboard)/billing/page.tsx

import { getSubscription } from '@/lib/supabase/queries'
import { PlanCard } from '@/components/billing/PlanCard'
import { UpgradeButton } from '@/components/billing/UpgradeButton'

export default async function BillingPage() {
  const subscription = await getSubscription()
  
  return (
    
      Billing
      
      
      
      {subscription.plan === 'free' && (
        
          Upgrade to Pro
          
            
            
          
          
        
      )}
    
  )
}
```

## Component Library

### Gamification Components

#### XPBar
```tsx
// components/gamification/XPBar.tsx
'use client'

import { motion } from 'framer-motion'

export function XPBar({ currentXP, level }: { currentXP: number; level: number }) {
  const progress = calculateXPProgress(currentXP, level)
  const nextLevelXP = xpForNextLevel(level)
  
  return (
    
      
        Level {level}
        {currentXP} / {nextLevelXP} XP
      
      
        
      
    
  )
}
```

#### StreakCounter
```tsx
// components/gamification/StreakCounter.tsx
'use client'

import { FlameIcon } from 'lucide-react'
import { motion } from 'framer-motion'

export function StreakCounter({ streak }: { streak: number }) {
  return (
    
      
        
      
      {streak}
      day streak
    
  )
}
```

#### BadgeDisplay
```tsx
// components/gamification/BadgeDisplay.tsx
'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

export function BadgeDisplay({ badge, earned }: { badge: Badge; earned: boolean }) {
  return (
    <motion.div
      className={`p-4 rounded-lg ${earned ? 'bg-primary-gold/10' : 'bg-gray-100'}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      
      {badge.name}
      {badge.description}
      {earned && (
        Earned {formatDate(badge.earned_at)}
      )}
    
  )
}
```

### shadcn/ui Components

Import and use shadcn/ui components:
```tsx
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
```

## Routing

### Route Structure
```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   └── layout.tsx (auth layout, no nav)
├── (dashboard)/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── camps/
│   │   ├── page.tsx
│   │   └── [campId]/
│   │       └── page.tsx
│   ├── lessons/
│   │   └── [lessonId]/
│   │       └── page.tsx
│   ├── profile/
│   │   └── page.tsx
│   ├── leaderboard/
│   │   └── page.tsx
│   ├── billing/
│   │   └── page.tsx
│   └── layout.tsx (dashboard layout with nav)
├── api/
│   └── v1/
│       ├── camps/
│       ├── lessons/
│       └── ...
├── layout.tsx (root layout)
└── page.tsx (landing page)
```

### Navigation Component
```tsx
// components/layout/DashboardNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HomeRetryMMContinuePlotted course to complete UI module documentation.The user wants me to continue generating the export package files. I was in the middle of the UI module file (modules/ui-module.md) and need to complete it, then continue with the remaining files:

✅ USER_INSTRUCTIONS.md
✅ README.md
✅ CLAUDE.md
✅ modules/auth-module.md
✅ modules/api-module.md
✅ modules/database-module.md
🔄 modules/ui-module.md (IN PROGRESS - need to complete)
⏳ modules/payments-module.md
⏳ prompts/01-setup-project.md
⏳ prompts/02-setup-database.md
⏳ prompts/03-setup-auth.md
⏳ prompts/04-create-api.md
⏳ prompts/05-create-ui.md
⏳ prompts/06-integrate-payments.md
⏳ prompts/07-deploy.md

Let me continue from where I left off in the ui-module.md file, specifically from the Navigation Component section., BookOpen, Trophy, User, CreditCard } from 'lucide-react'
const navItems = [
{ href: '/dashboard', label: 'Dashboard', icon: Home },
{ href: '/camps', label: 'Camps', icon: BookOpen },
{ href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
{ href: '/profile', label: 'Profile', icon: User },
{ href: '/billing', label: 'Billing', icon: CreditCard },
]
export function DashboardNav() {
const pathname = usePathname()
return (
<nav className="bg-white shadow-sm border-b">
<div className="container mx-auto px-4">
<div className="flex items-center justify-between h-16">
<Link href="/dashboard" className="text-xl font-bold text-primary-blue">
ThaiFightTalk
</Link>
      <div className="flex items-center gap-6">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-primary-blue text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  </div>
</nav>
)
}

## State Management

### Auth Context
```tsx
// components/auth/AuthProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })
    
    return () => subscription.unsubscribe()
  }, [])
  
  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

### Client-Side Data Fetching (Optional, for future)
```tsx
// Using SWR for client-side data fetching
'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useLeaderboard() {
  const { data, error, isLoading } = useSWR('/api/v1/leaderboard', fetcher, {
    refreshInterval: 30000, // Refresh every 30s
    revalidateOnFocus: true
  })
  
  return {
    leaderboard: data?.data ?? [],
    isLoading,
    error
  }
}
```

## Animations

### Page Transitions
```tsx
// components/layout/PageTransition.tsx
'use client'

import { motion } from 'framer-motion'

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}
```

### XP Earned Animation
```tsx
// components/gamification/XPEarnedAnimation.tsx
'use client'

import { motion } from 'framer-motion'

export function XPEarnedAnimation({ amount }: { amount: number }) {
  return (
    <motion.div
      className="text-primary-gold text-4xl font-bold"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 1] }}
      transition={{ duration: 0.6 }}
    >
      +{amount} XP
    </motion.div>
  )
}
```

### Badge Unlock Celebration
```tsx
// components/gamification/BadgeUnlockModal.tsx
'use client'

import { motion } from 'framer-motion'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import Image from 'next/image'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

export function BadgeUnlockModal({ badge, open, onClose }: {
  badge: Badge
  open: boolean
  onClose: () => void
}) {
  useEffect(() => {
    if (open) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    }
  }, [open])
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <Image
            src={badge.icon_url}
            alt={badge.name}
            width={128}
            height={128}
            className="mx-auto"
          />
        </motion.div>
        <h2 className="text-2xl font-bold mt-4">Badge Unlocked!</h2>
        <p className="text-xl text-primary-gold font-bold">{badge.name}</p>
        <p className="text-gray-600">{badge.description}</p>
      </DialogContent>
    </Dialog>
  )
}
```

## Responsive Design

### Breakpoints
```typescript
// Use Tailwind's default breakpoints
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px
// 2xl: 1536px

// Example responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>

// Example responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Title
</h1>

// Example responsive padding
<div className="px-4 md:px-6 lg:px-8">
  {/* Content */}
</div>
```

### Mobile Navigation (Future)
```tsx
// components/layout/MobileNav.tsx
'use client'

import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="md:hidden">
      <button onClick={() => setIsOpen(!isOpen)} className="p-2">
        {isOpen ? <X /> : <Menu />}
      </button>
      
      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white shadow-lg p-4">
          <nav className="flex flex-col gap-4">
            <Link href="/dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link>
            <Link href="/camps" onClick={() => setIsOpen(false)}>Camps</Link>
            <Link href="/leaderboard" onClick={() => setIsOpen(false)}>Leaderboard</Link>
            <Link href="/profile" onClick={() => setIsOpen(false)}>Profile</Link>
          </nav>
        </div>
      )}
    </div>
  )
}
```

## Accessibility

### WCAG AA Compliance Checklist

- [ ] **Color Contrast:** All text meets 4.5:1 ratio (normal text), 3:1 (large text)
- [ ] **Keyboard Navigation:** All interactive elements accessible via keyboard
- [ ] **Focus Indicators:** Clear focus styles on all interactive elements
- [ ] **ARIA Labels:** Proper labels on icon buttons, form inputs
- [ ] **Semantic HTML:** Use proper heading hierarchy, landmarks
- [ ] **Alt Text:** All images have descriptive alt text
- [ ] **Form Labels:** All form inputs have associated labels
- [ ] **Skip Links:** Skip to main content link for keyboard users

### Example Accessible Button
```tsx
<button
  type="button"
  className="px-4 py-2 bg-primary-blue text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
  aria-label="Start lesson"
>
  Start
</button>
```

## Performance Optimization

### Image Optimization
```tsx
// Always use next/image
import Image from 'next/image'

<Image
  src="/images/camp-bangkok.jpg"
  alt="Bangkok Basics Camp"
  width={400}
  height={300}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### Code Splitting
```tsx
// Lazy load heavy components
import dynamic from 'next/dynamic'

const AISparringPartner = dynamic(
  () => import('@/components/ai/AISparringPartner'),
  { 
    loading: () => <p>Loading AI...</p>,
    ssr: false 
  }
)
```

### Bundle Analysis
```bash
# Add to package.json scripts
"analyze": "ANALYZE=true next build"

# Install bundle analyzer
npm install @next/bundle-analyzer
```

## Testing Strategy

### Component Testing (Jest + React Testing Library)
```tsx
// __tests__/components/XPBar.test.tsx
import { render, screen } from '@testing-library/react'
import { XPBar } from '@/components/gamification/XPBar'

describe('XPBar', () => {
  it('renders current XP and level', () => {
    render(<XPBar currentXP={250} level={2} />)
    expect(screen.getByText(/250/)).toBeInTheDocument()
    expect(screen.getByText(/Level 2/)).toBeInTheDocument()
  })
  
  it('calculates progress correctly', () => {
    render(<XPBar currentXP={150} level={2} />)
    // Level 2 requires 100 XP, Level 3 requires 400 XP
    // Progress = (150 - 100) / (400 - 100) = 50/300 = 16.67%
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveStyle({ width: '16.67%' })
  })
})
```

### E2E Testing (Playwright)
```typescript
// tests/e2e/lesson-flow.spec.ts
import { test, expect } from '@playwright/test'

test('complete lesson flow', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  // Navigate to camps
  await page.click('text=Camps')
  await expect(page).toHaveURL('/camps')
  
  // Select camp
  await page.click('text=Bangkok Basics')
  
  // Start first lesson
  await page.click('text=Greetings')
  await expect(page).toHaveURL(/\/lessons\//)
  
  // Complete vocabulary section
  await page.click('text=Next')
  
  // Complete exercises
  await page.click('text=สวัสดี') // Answer exercise
  await page.click('text=Submit')
  
  // Verify XP earned
  await expect(page.locator('text=/\\+\\d+ XP/')).toBeVisible()
})
```

## Testing Checklist

- [ ] All pages render without errors
- [ ] Navigation works across all routes
- [ ] XP bar animates correctly
- [ ] Streak counter updates on activity
- [ ] Badges display earned/unearned states
- [ ] Forms validate inputs
- [ ] Loading states show during data fetching
- [ ] Error states display helpful messages
- [ ] Responsive design works on mobile (320px+)
- [ ] Keyboard navigation works
- [ ] Screen reader announces content correctly

## Security Considerations

- **Never expose API keys** in client code
- **Validate user inputs** before submission
- **Sanitize HTML** if displaying user-generated content
- **Use HTTPS** in production
- **Implement CSP headers** to prevent XSS

## Future Enhancements (V1.5+)

- Dark mode toggle
- Custom themes (per gym)
- Offline mode (PWA)
- Push notifications (lesson reminders)
- Voice interface (hands-free practice during training)
- Social sharing (share badges on social media)

---

**References:**
- Next.js 15 Docs: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com
- Framer Motion: https://www.framer.com/motion