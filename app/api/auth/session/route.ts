import { NextResponse } from 'next/server'
import { readSessionFromRequest } from '@/lib/auth'
import { buildErrorPayload } from '@/lib/api'

export async function GET(request: Request) {
  const session = await readSessionFromRequest(request)
  return session ? NextResponse.json({ data: session }) : NextResponse.json(buildErrorPayload('Authentication required.', 401, 'AUTH_REQUIRED'), { status: 401 })
}
