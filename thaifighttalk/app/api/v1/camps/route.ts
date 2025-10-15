import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleAPIError } from '@/lib/api/errors'

/**
 * GET /api/v1/camps
 * Fetch all training camps with unlock status
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Get user's current level
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('current_level')
      .eq('id', user.id)
      .single()

    if (userError) throw userError

    const userLevel = userData?.current_level || 1

    // Fetch all camps ordered by order field
    const { data: camps, error: campsError } = await supabase
      .from('camps')
      .select('*')
      .order('order', { ascending: true })

    if (campsError) throw campsError

    // Enrich camps with is_unlocked field
    const enrichedCamps = camps.map((camp) => ({
      ...camp,
      is_unlocked: userLevel >= (camp.unlock_level || 1)
    }))

    return NextResponse.json({ data: enrichedCamps }, { status: 200 })
  } catch (error) {
    return handleAPIError(error)
  }
}
