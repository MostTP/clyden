import { NextResponse } from 'next/server'
import { createSessionToken, rolePassword, sessionCookieName, verifyPassword, type Role } from '@/lib/auth'
import { buildErrorPayload } from '@/lib/api'
import { readStore } from '@/lib/server/store'

const roles: Role[] = ['seller', 'buyer', 'admin']

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const role = body?.role as Role
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!roles.includes(role) || !password) return NextResponse.json(buildErrorPayload('Role and password are required.', 400, 'INVALID_CREDENTIALS'), { status: 400 })
  const store = readStore()
  const account = email ? store.accounts.find((item) => item.email === email && item.role === role && item.active) : store.accounts.find((item) => item.role === role && item.active)
  if (email) {
    if (!account?.passwordHash || !await verifyPassword(password, account.passwordHash)) return NextResponse.json(buildErrorPayload('Invalid credentials.', 401, 'INVALID_CREDENTIALS'), { status: 401 })
  } else {
    const expectedPassword = rolePassword(role)
    if (!expectedPassword) return NextResponse.json(buildErrorPayload(`${role.toUpperCase()}_PASSWORD is not configured.`, 503, 'AUTH_NOT_CONFIGURED'), { status: 503 })
    if (password !== expectedPassword) return NextResponse.json(buildErrorPayload('Invalid credentials.', 401, 'INVALID_CREDENTIALS'), { status: 401 })
  }
  if (!account) return NextResponse.json(buildErrorPayload('No active account is configured for this role.', 503, 'ACCOUNT_NOT_CONFIGURED'), { status: 503 })

  const response = NextResponse.json({ data: { role: account.role, userId: account.id, email: account.email, displayName: account.displayName } })
  response.cookies.set(sessionCookieName, await createSessionToken(account.role, account.id), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 7 * 24 * 60 * 60 })
  return response
}
