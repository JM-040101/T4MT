import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BadgeDisplay } from '@/components/gamification/BadgeDisplay'
import { XPBar } from '@/components/gamification/XPBar'
import { Trophy, BookOpen, Flame } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const { count: completedLessons } = await supabase
    .from('user_lessons')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('completed', true)

  const { data: allBadges } = await supabase
    .from('badges')
    .select('*')

  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('badge_id, earned_at')
    .eq('user_id', user.id)

  const userBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || [])
  const earnedAtMap = new Map(userBadges?.map(ub => [ub.badge_id, ub.earned_at]) || [])

  const enrichedBadges = allBadges?.map(badge => ({
    ...badge,
    earned: userBadgeIds.has(badge.id),
    earned_at: earnedAtMap.get(badge.id)
  }))

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Profile</h1>
        <p className="text-gray-600">Track your progress and achievements</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-blue to-primary-gold rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {profile?.display_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{profile?.display_name}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-primary-gold" />
              <div>
                <div className="text-2xl font-bold">{profile?.xp || 0}</div>
                <div className="text-sm text-gray-600">Total XP</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary-blue" />
              <div>
                <div className="text-2xl font-bold">{completedLessons || 0}</div>
                <div className="text-sm text-gray-600">Lessons Completed</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{profile?.streak || 0}</div>
                <div className="text-sm text-gray-600">Day Streak</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle>Level Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <XPBar currentXP={profile?.xp || 0} level={profile?.current_level || 1} />
        </CardContent>
      </Card>

      {/* Badges Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Achievements</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {enrichedBadges?.map((badge) => (
            <BadgeDisplay key={badge.id} badge={badge} />
          ))}
        </div>
      </div>
    </div>
  )
}
