import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Medal, Award } from 'lucide-react'

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: users } = await supabase
    .from('users')
    .select('id, display_name, xp, current_level, streak')
    .order('xp', { ascending: false })
    .limit(50)

  const leaderboard = users?.map((u, index) => ({
    rank: index + 1,
    ...u
  }))

  const currentUserRank = leaderboard ? leaderboard.findIndex(u => u.id === user.id) + 1 : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Leaderboard</h1>
        <p className="text-gray-600">See how you rank against other learners</p>
      </div>

      {currentUserRank > 0 && (
        <Card className="bg-primary-blue text-white">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="font-bold">Your Rank</span>
              <span className="text-2xl font-bold">#{currentUserRank}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {leaderboard?.map((entry) => {
          const isCurrentUser = entry.id === user.id
          const getRankIcon = (rank: number) => {
            if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
            if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
            if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />
            return <span className="w-6 text-center font-bold text-gray-600">{rank}</span>
          }

          return (
            <Card
              key={entry.id}
              className={isCurrentUser ? 'ring-2 ring-primary-blue' : ''}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {getRankIcon(entry.rank)}
                    <div className="flex-1">
                      <div className="font-bold">
                        {entry.display_name}
                        {isCurrentUser && (
                          <span className="ml-2 text-sm text-primary-blue">(You)</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        Level {entry.current_level} • {entry.streak} day streak
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{entry.xp}</div>
                    <div className="text-sm text-gray-600">XP</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
