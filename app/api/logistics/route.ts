import { NextResponse } from 'next/server'
import { readSessionFromRequest } from '@/lib/auth'
import { buildErrorPayload } from '@/lib/api'
import { addActivity, readStore, updateStore } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ data: readStore().snapshot.logistics })
}

export async function PATCH(request: Request) {
  const session = await readSessionFromRequest(request)
  if (!session || session.role !== 'seller') return NextResponse.json(buildErrorPayload('Seller authentication required.', 403, 'ROLE_REQUIRED'), { status: 403 })
  const body = await request.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : ''
  const status = body?.status
  if (!id || !['available', 'booked'].includes(status)) return NextResponse.json(buildErrorPayload('id and a valid status are required.', 400, 'INVALID_LOGISTICS_STATUS'), { status: 400 })
  let found = false
  updateStore((store) => {
    const quote = store.snapshot.logistics.find((item) => item.id === id)
    if (!quote) return
    quote.status = status
    found = true
    addActivity(store, `${quote.provider} logistics quote ${status}`, { actorId: session.userId, actorRole: session.role, action: 'logistics_updated', entityType: 'logistics', entityId: quote.id })
  })
  if (!found) return NextResponse.json(buildErrorPayload('Logistics quote not found.', 404, 'LOGISTICS_NOT_FOUND'), { status: 404 })
  return NextResponse.json({ data: readStore().snapshot.logistics.find((item) => item.id === id) })
}
