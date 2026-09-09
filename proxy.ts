import { NextResponse, type NextRequest } from 'next/server'
import { readSessionToken, requiredRoleForPath, requiredRolesForPath, sessionCookieName } from '@/lib/auth'

export default async function proxy(request: NextRequest) {
  const requiredRole = requiredRoleForPath(request.nextUrl.pathname)
  const requiredApiRoles = requiredRolesForPath(request.nextUrl.pathname)
  if (!requiredRole && !requiredApiRoles) return NextResponse.next()
  const session = await readSessionToken(request.cookies.get(sessionCookieName)?.value)
  if (session && (requiredRole === session.role || requiredApiRoles?.includes(session.role))) return NextResponse.next()
  if (requiredApiRoles) return NextResponse.json({ error: 'Authentication required.' }, { status: session ? 403 : 401 })
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('role', requiredRole ?? 'seller')
  loginUrl.searchParams.set('next', request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = { matcher: ['/seller/:path*', '/buyer/:path*', '/admin/:path*', '/api/:path*'] }
