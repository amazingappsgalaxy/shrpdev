import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Default: allow request to continue
  const response = NextResponse.next({ request })

  // Only check for presence of session cookie in middleware (Edge)
  // Do NOT validate against server-side store here, as Edge and Node runtimes don't share memory
  const hasSessionCookie = !!request.cookies.get('session')?.value

  // If user is already authenticated and visits the login page, redirect to dashboard
  if (hasSessionCookie && request.nextUrl.pathname.startsWith('/app/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/app/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirect unauthenticated users to login (except for login and auth pages)
  if (
    !hasSessionCookie &&
    !request.nextUrl.pathname.startsWith('/app/login') &&
    !request.nextUrl.pathname.startsWith('/app/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/app/login'
    return NextResponse.redirect(url)
  }

  return response
}