import { NextResponse } from 'next/server'

export type Role = 'seller' | 'buyer' | 'admin'

export const sessionCookieName = 'agrobridge_session'

export function requiredRoleForPath(pathname: string): Role | null {
  const routeRoles: Record<string, Role> = { '/seller': 'seller', '/buyer': 'buyer', '/admin': 'admin' }
  return Object.entries(routeRoles).find(([path]) => pathname.startsWith(path))?.[1] ?? null
}

export function requiredRolesForPath(pathname: string): Role[] | null {
  if (pathname.startsWith('/api/admin')) return ['admin']
  if (pathname.startsWith('/api/audit')) return ['admin']
  if (pathname.startsWith('/api/profile') || pathname.startsWith('/api/documents') || pathname.startsWith('/api/logistics')) return ['seller']
  if (pathname.startsWith('/api/lots') || pathname.startsWith('/api/shortlists') || pathname.startsWith('/api/requests')) return ['seller', 'buyer']
  if (pathname.startsWith('/api/dashboard')) return ['seller']
  return null
}

export type Session = { userId: string; role: Role; expiresAt: number }

function isProduction() {
  return process.env.NODE_ENV === 'production'
}

function secret() {
  const value = process.env.AUTH_SECRET
  if (value) return value
  if (isProduction()) throw new Error('AUTH_SECRET must be configured in production.')
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

export async function createSessionToken(role: Role, userId = `${role}_account`) {
  const payload = base64UrlEncode(JSON.stringify({ userId, role, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 }))
  return `${payload}.${await signature(payload)}`
}

export async function readSessionToken(token?: string): Promise<Session | null> {
  if (!token) return null
  const [payload, providedSignature] = token.split('.')
  if (!payload || !providedSignature || providedSignature !== await signature(payload)) return null
  try {
    const session = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload))) as Session
    if (!session.userId || !['seller', 'buyer', 'admin'].includes(session.role) || session.expiresAt < Date.now()) return null
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

export async function readSessionFromRequest(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const token = cookieHeader.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${sessionCookieName}=`))?.slice(sessionCookieName.length + 1)
  return readSessionToken(token)
}

export async function activityDetails(request: Request, action: string, entityType: string, entityId: string) {
  const session = await readSessionFromRequest(request)
  return { actorId: session?.userId, actorRole: session?.role, action, entityType, entityId }
}

export async function hashPassword(password: string, salt = crypto.randomUUID()) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 120000, hash: 'SHA-256' }, key, 256)
  return `${salt}.${base64UrlEncode(new Uint8Array(bits))}`
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt] = storedHash.split('.')
  if (!salt || !storedHash.includes('.')) return false
  return storedHash === await hashPassword(password, salt)
}

export function rolePassword(role: Role) {
  const configured = process.env[`${role.toUpperCase()}_PASSWORD`]
  if (configured) return configured
  if (isProduction()) return null
  return `${role}123`
}
