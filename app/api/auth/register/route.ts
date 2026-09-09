import { NextResponse } from 'next/server'
import { createSessionToken, hashPassword, sessionCookieName, type Role } from '@/lib/auth'
import { buildErrorPayload } from '@/lib/api'
import { createId, readStore, updateStore, type UserAccount } from '@/lib/server/store'

const roles: Role[] = ['seller', 'buyer']

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const role = body?.role as Role
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const displayName = typeof body?.displayName === 'string' ? body.displayName.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!roles.includes(role) || !displayName || !email || !email.includes('@') || password.length < 8) return NextResponse.json(buildErrorPayload('Role, name, valid email, and a password of at least 8 characters are required.', 400, 'INVALID_ACCOUNT'), { status: 400 })
  if (readStore().accounts.some((account) => account.email === email)) return NextResponse.json(buildErrorPayload('An account with that email already exists.', 409, 'ACCOUNT_EXISTS'), { status: 409 })

  const account: UserAccount = { id: createId('user'), role, email, displayName, active: true, createdAt: new Date().toISOString(), passwordHash: await hashPassword(password) }
  updateStore((store) => { store.accounts.push(account) })
  const response = NextResponse.json({ data: { id: account.id, role: account.role, email: account.email, displayName: account.displayName } }, { status: 201 })
  response.cookies.set(sessionCookieName, await createSessionToken(account.role, account.id), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 7 * 24 * 60 * 60 })
  return response
}