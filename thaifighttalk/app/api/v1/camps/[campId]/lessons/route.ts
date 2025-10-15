import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleAPIError } from '@/lib/api/errors'

/**
 * GET /api/v1/camps/[campId]/lessons
 * Fetch all lessons for a specific camp with user progress
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campId: string }> }
) {
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

    const { campId } = await params

    // Verify camp exists
    const { data: camp, error: campError } = await supabase
      .from('camps')
      .select('id')
      .eq('id', campId)
      .single()

    if (campError || !camp) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Camp not found' } },
        { status: 404 }
      )
    }

    // Fetch lessons with user progress
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        *,
        user_lessons!left (
          completed,
          score,
          attempts,
          last_attempt
        )
      `)
      .eq('camp_id', campId)
      .eq('user_lessons.user_id', user.id)
      .order('order', { ascending: true })

    if (lessonsError) throw lessonsError

    // Transform data to flatten user progress
    const enrichedLessons = lessons.map((lesson) => ({
      ...lesson,
      user_progress: lesson.user_lessons?.[0] || {
        completed: false,
        score: null,
        attempts: 0,
        last_attempt: null
      },
      user_lessons: undefined // Remove the nested array
    }))

    return NextResponse.json({ data: enrichedLessons }, { status: 200 })
  } catch (error) {
    return handleAPIError(error)
  }
}
