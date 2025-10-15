import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleAPIError } from '@/lib/api/errors'

/**
 * GET /api/v1/lessons/[lessonId]
 * Fetch a single lesson with full content and user progress
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
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

    const { lessonId } = await params

    // Fetch lesson with user progress
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select(`
        *,
        camps (
          id,
          title,
          theme
        ),
        user_lessons!left (
          completed,
          score,
          attempts,
          last_attempt
        )
      `)
      .eq('id', lessonId)
      .eq('user_lessons.user_id', user.id)
      .single()

    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Lesson not found' } },
        { status: 404 }
      )
    }

    // Transform data to flatten user progress
    const enrichedLesson = {
      ...lesson,
      camp: lesson.camps,
      user_progress: lesson.user_lessons?.[0] || {
        completed: false,
        score: null,
        attempts: 0,
        last_attempt: null
      },
      camps: undefined, // Remove the nested object
      user_lessons: undefined // Remove the nested array
    }

    return NextResponse.json({ data: enrichedLesson }, { status: 200 })
  } catch (error) {
    return handleAPIError(error)
  }
}
