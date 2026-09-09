import { NextResponse } from 'next/server'
import { createSessionToken, rolePassword, sessionCookieName, type Role } from '@/lib/auth'

const roles: Role[] = ['seller', 'buyer', 'admin']

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const role = body?.role as Role
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!roles.includes(role) || !password) return NextResponse.json({ error: 'Role and password are required.' }, { status: 400 })
  const expectedPassword = rolePassword(role)
  if (!expectedPassword) return NextResponse.json({ error: `${role.toUpperCase()}_PASSWORD is not configured.` }, { status: 503 })
  if (password !== expectedPassword) return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })

  const response = NextResponse.json({ data: { role } })
  response.cookies.set(sessionCookieName, await createSessionToken(role), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 7 * 24 * 60 * 60 })
  return response
}
