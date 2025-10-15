import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleAPIError } from '@/lib/api/errors'

/**
 * GET /api/v1/leaderboard
 * Fetch leaderboard with pagination and current user's rank
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const { data: users, error } = await supabase
      .from('users')
      .select('id, display_name, xp, current_level, streak')
      .order('xp', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (error) throw error

    const leaderboard = users.map((u, index) => ({
      rank: (page - 1) * limit + index + 1,
      user_id: u.id,
      display_name: u.display_name,
      xp: u.xp,
      level: u.current_level,
      streak: u.streak
    }))

    // Get current user's rank
    const { data: userProfile } = await supabase
      .from('users')
      .select('xp')
      .eq('id', user.id)
      .single()

    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gt('xp', userProfile?.xp || 0)

    const currentUserRank = (count || 0) + 1

    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      data: leaderboard,
      meta: {
        page,
        limit,
        total: totalUsers || 0,
        current_user_rank: currentUserRank
      }
    })
  } catch (error) {
    return handleAPIError(error)
  }
}
