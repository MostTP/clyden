import { NextResponse } from 'next/server'
import { sessionCookieName } from '@/lib/auth'

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/', request.url))
  response.cookies.set(sessionCookieName, '', { httpOnly: true, path: '/', maxAge: 0 })
  return response
}

export async function POST() {
  const response = NextResponse.json({ data: { loggedOut: true } })
  response.cookies.set(sessionCookieName, '', { httpOnly: true, path: '/', maxAge: 0 })
  return response
}
