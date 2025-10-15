import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleAPIError } from '@/lib/api/errors'
import OpenAI from 'openai'
import { z } from 'zod'

const SparringSchema = z.object({
  message: z.string().min(1),
  conversation_history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional()
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/**
 * POST /api/v1/ai/sparring
 * AI-powered Thai language conversation practice
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Check if user has Pro plan
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .single()

    if (subscription?.plan === 'free') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'AI sparring requires Pro plan' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { message, conversation_history = [] } = SparringSchema.parse(body)

    const systemPrompt = `You are a friendly Thai language tutor helping a Muay Thai trainee practice conversational Thai.
Respond naturally in Thai, and provide English translations in parentheses after each sentence.
Correct errors gently by restating the correct phrase.
Keep responses under 50 words.
Focus on practical phrases for gym life, travel, and daily conversation.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversation_history.slice(-10), // Last 10 messages only
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 150
    })

    const response = completion.choices[0].message.content || ''

    // Basic parsing of Thai text and translation
    // Assumes format: "Thai text (English translation)"
    const parts = response.split(/\(([^)]+)\)/)
    const thaiText = parts[0]?.trim() || response
    const translation = parts[1]?.trim() || ''

    return NextResponse.json({
      data: {
        response: thaiText,
        translation: translation || 'Translation not available',
        corrections: [] // Can be enhanced later
      }
    })
  } catch (error) {
    return handleAPIError(error)
  }
}
