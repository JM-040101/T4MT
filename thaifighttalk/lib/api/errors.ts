import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * Standard API error handler
 * Converts various error types into consistent API responses
 */
export function handleAPIError(error: unknown) {
  console.error('API Error:', error)

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_INPUT',
          message: 'Validation failed',
          details: error.issues
        }
      },
      { status: 400 }
    )
  }

  // PostgreSQL/Supabase errors
  const pgError = error as { code?: string; message?: string }

  // Not found error (PGRST116)
  if (pgError?.code === 'PGRST116') {
    return NextResponse.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found'
        }
      },
      { status: 404 }
    )
  }

  // Unique constraint violation (23505)
  if (pgError?.code === '23505') {
    return NextResponse.json(
      {
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'This resource already exists'
        }
      },
      { status: 409 }
    )
  }

  // Foreign key violation (23503)
  if (pgError?.code === '23503') {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_REFERENCE',
          message: 'Referenced resource does not exist'
        }
      },
      { status: 400 }
    )
  }

  // Unauthorized (Row Level Security)
  if (pgError?.message?.includes('Row Level Security')) {
    return NextResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'You do not have permission to access this resource'
        }
      },
      { status: 403 }
    )
  }

  // Generic error
  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    },
    { status: 500 }
  )
}

/**
 * Create a success response
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

/**
 * Create an error response
 */
export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: unknown
) {
  const errorObj: { code: string; message: string; details?: unknown } = {
    code,
    message
  }

  if (details) {
    errorObj.details = details
  }

  return NextResponse.json({ error: errorObj }, { status })
}
