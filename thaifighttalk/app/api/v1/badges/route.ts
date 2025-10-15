import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleAPIError } from '@/lib/api/errors'

/**
 * GET /api/v1/badges
 * Fetch all badges with user's earned status
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { data: badges } = await supabase
      .from('badges')
      .select('*')
      .order('created_at')

    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at')
      .eq('user_id', user.id)

    const userBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || [])
    const earnedAtMap = new Map(userBadges?.map(ub => [ub.badge_id, ub.earned_at]) || [])

    const enrichedBadges = badges?.map(badge => ({
      ...badge,
      earned: userBadgeIds.has(badge.id),
      earned_at: earnedAtMap.get(badge.id) || null
    }))

    return NextResponse.json({ data: enrichedBadges })
  } catch (error) {
    return handleAPIError(error)
  }
}
