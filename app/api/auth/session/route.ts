import { NextResponse } from 'next/server'
import { readSessionToken, sessionCookieName } from '@/lib/auth'

export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const token = cookieHeader.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${sessionCookieName}=`))?.slice(sessionCookieName.length + 1)
  const session = await readSessionToken(token)
  return session ? NextResponse.json({ data: session }) : NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
}
