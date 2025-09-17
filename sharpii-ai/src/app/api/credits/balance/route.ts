import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/simple-auth'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'

const supabase = createClient(config.supabase.url!, config.supabase.serviceKey!)

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's credit balance from the database
    const { data: user, error } = await supabase
      .from('users')
      .select('credits')
      .eq('id', session.user.id)
      .single()

    if (error) {
      console.error('Error fetching user credits:', error)
      return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 })
    }

    return NextResponse.json({
      credits: user?.credits || 0,
      success: true
    })

  } catch (error) {
    console.error('Credits balance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}