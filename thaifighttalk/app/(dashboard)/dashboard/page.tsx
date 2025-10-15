import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { XPBar } from '@/components/gamification/XPBar'
import { StreakCounter } from '@/components/gamification/StreakCounter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookOpen, Trophy } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch completed lessons count
  const { count: completedCount } = await supabase
    .from('user_lessons')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('completed', true)

  // Fetch total lessons
  const { count: totalLessons } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })

  // Fetch earned badges
  const { count: badgesEarned } = await supabase
    .from('user_badges')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Fetch recent badges
  const { data: recentBadges } = await supabase
    .from('user_badges')
    .select('*, badges(*)')
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false })
    .limit(3)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          สวัสดี, {profile?.display_name}! 👋
        </h1>
        <p className="text-gray-600">Ready to train your Thai skills today?</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* XP Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <XPBar currentXP={profile?.xp || 0} level={profile?.current_level || 1} />
          </CardContent>
        </Card>

        {/* Streak Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Learning Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <StreakCounter streak={profile?.streak || 0} />
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-primary-blue" />
              <div>
                <div className="font-bold">{completedCount || 0}/{totalLessons || 0}</div>
                <div className="text-xs text-gray-600">Lessons completed</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-primary-gold" />
              <div>
                <div className="font-bold">{badgesEarned || 0}</div>
                <div className="text-xs text-gray-600">Badges earned</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Continue Learning CTA */}
      <Card className="bg-gradient-to-r from-primary-blue to-primary-red text-white">
        <CardContent className="py-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Continue Learning</h2>
              <p className="text-white/90">Jump back into your training</p>
            </div>
            <Link href="/camps">
              <Button size="lg" variant="secondary">
                View Camps
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Badges */}
      {recentBadges && recentBadges.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentBadges.map((ub: any) => (
              <Card key={ub.badge_id}>
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl mb-2">🏆</div>
                  <h3 className="font-bold">{ub.badges.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {ub.badges.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
