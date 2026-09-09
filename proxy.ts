import { NextResponse, type NextRequest } from 'next/server'
import { readSessionToken, sessionCookieName, type Role } from '@/lib/auth'

const routeRoles: Record<string, Role> = { '/seller': 'seller', '/buyer': 'buyer', '/admin': 'admin' }

function apiRoles(pathname: string): Role[] | null {
  if (pathname.startsWith('/api/admin')) return ['admin']
  if (pathname.startsWith('/api/profile') || pathname.startsWith('/api/documents') || pathname.startsWith('/api/logistics')) return ['seller']
  if (pathname.startsWith('/api/lots') || pathname.startsWith('/api/shortlists') || pathname.startsWith('/api/requests')) return ['seller', 'buyer']
  if (pathname.startsWith('/api/dashboard')) return ['seller']
  return null
}

export default async function proxy(request: NextRequest) {
  const requiredRole = Object.entries(routeRoles).find(([path]) => request.nextUrl.pathname.startsWith(path))?.[1]
  const requiredApiRoles = apiRoles(request.nextUrl.pathname)
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
