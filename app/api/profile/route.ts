import { NextResponse } from 'next/server'
import { readSessionFromRequest } from '@/lib/auth'
import { buildErrorPayload } from '@/lib/api'
import { addActivity, readStore, updateStore } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await readSessionFromRequest(request)
  if (!session) return NextResponse.json(buildErrorPayload('Authentication required.', 401, 'AUTH_REQUIRED'), { status: 401 })
  return NextResponse.json({ data: readStore().snapshot.farmer })
}

export async function PATCH(request: Request) {
  const session = await readSessionFromRequest(request)
  if (!session || session.role !== 'seller') return NextResponse.json(buildErrorPayload('Seller authentication required.', 403, 'ROLE_REQUIRED'), { status: 403 })
  const body = await request.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const farmName = typeof body?.farmName === 'string' ? body.farmName.trim() : ''
  const location = typeof body?.location === 'string' ? body.location.trim() : ''
  if (!name || !farmName || !location) return NextResponse.json(buildErrorPayload('name, farmName, and location are required.', 400, 'INVALID_PROFILE'), { status: 400 })

  updateStore((store) => {
    store.snapshot.farmer = { ...store.snapshot.farmer, name, farmName, location }
    addActivity(store, `${farmName} profile updated`, { actorId: session.userId, actorRole: session.role, action: 'profile_updated', entityType: 'profile', entityId: session.userId })
  })
  return NextResponse.json({ data: readStore().snapshot.farmer })
}
