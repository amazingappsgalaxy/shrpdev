import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession as getServerSession } from '@/lib/auth-simple'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ user: null, session: null })
    }
    
    const data = await getServerSession(sessionToken)
    
    if (!data || !data.user) {
      // Clear invalid/expired cookie on response
      const res = NextResponse.json({ user: null, session: null })
      res.cookies.set('session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      })
      return res
    }

    // Normalize shape to minimal fields expected by client
    const user = data.user && {
      id: (data.user as any).id,
      email: (data.user as any).email,
      name: (data.user as any).name ?? (data.user as any).full_name ?? ((data.user as any).email?.split?.('@')?.[0] ?? 'User'),
    }

    const session = data.session && {
      id: (data.session as any).id,
      token: (data.session as any).token,
    }

    return NextResponse.json({ user, session })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ user: null, session: null })
  }
}