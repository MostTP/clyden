import { NextResponse } from 'next/server'
import { readSessionFromRequest } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await readSessionFromRequest(request)
  return NextResponse.json({ data: { authenticated: Boolean(session), session } })
}
