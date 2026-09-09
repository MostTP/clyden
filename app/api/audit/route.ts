import { NextResponse } from 'next/server'
import { readSessionFromRequest } from '@/lib/auth'
import { buildErrorPayload } from '@/lib/api'
import { readStore } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await readSessionFromRequest(request)
  if (!session || session.role !== 'admin') return NextResponse.json(buildErrorPayload('Authentication required.', 401, 'AUTH_REQUIRED'), { status: 401 })

  const params = new URL(request.url).searchParams
  const entityType = params.get('entityType')
  const actorId = params.get('actorId')
  const action = params.get('action')
  const activity = readStore().activity.filter((item) =>
    (!entityType || item.entityType === entityType) &&
    (!actorId || item.actorId === actorId) &&
    (!action || item.action === action),
  )
  return NextResponse.json({ data: activity, meta: { total: activity.length } })
}