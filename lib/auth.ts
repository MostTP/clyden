import { NextResponse } from 'next/server'

export type Role = 'seller' | 'buyer' | 'admin'

export const sessionCookieName = 'agrobridge_session'

type Session = { role: Role; expiresAt: number }

function secret() {
  const value = process.env.AUTH_SECRET
  if (value) return value
  if (process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET must be configured in production.')
  return 'agrobridge-local-development-secret'
}

function base64UrlEncode(value: string | Uint8Array) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '')
}

function base64UrlDecode(value: string) {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

async function signature(payload: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return base64UrlEncode(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))))
}

export async function createSessionToken(role: Role) {
  const payload = base64UrlEncode(JSON.stringify({ role, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 }))
  return `${payload}.${await signature(payload)}`
}

export async function readSessionToken(token?: string): Promise<Session | null> {
  if (!token) return null
  const [payload, providedSignature] = token.split('.')
  if (!payload || !providedSignature || providedSignature !== await signature(payload)) return null
  try {
    const session = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload))) as Session
    if (!['seller', 'buyer', 'admin'].includes(session.role) || session.expiresAt < Date.now()) return null
    return session
  } catch {
    return null
  }
}

export async function authorize(request: Request, allowedRoles: Role[]) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const token = cookieHeader.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${sessionCookieName}=`))?.slice(sessionCookieName.length + 1)
  const session = await readSessionToken(token)
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!allowedRoles.includes(session.role)) return NextResponse.json({ error: 'You do not have access to this resource.' }, { status: 403 })
  return null
}

export function rolePassword(role: Role) {
  const configured = process.env[`${role.toUpperCase()}_PASSWORD`]
  if (configured) return configured
  if (process.env.NODE_ENV === 'production') return null
  return `${role}123`
}
