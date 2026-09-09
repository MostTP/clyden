import { NextResponse } from 'next/server'
import { readSessionFromRequest } from '@/lib/auth'
import { buildErrorPayload } from '@/lib/api'
import { addActivity, readStore, updateStore, type LotStatus } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: { params: Promise<Record<string, string>> }) {
  const id = (await context.params).id
  const lot = readStore().lots.find((item) => item.id === id)
  return lot ? NextResponse.json({ data: lot }) : NextResponse.json(buildErrorPayload('Lot not found.', 404, 'LOT_NOT_FOUND'), { status: 404 })
}

export async function PATCH(request: Request, context: { params: Promise<Record<string, string>> }) {
  const session = await readSessionFromRequest(request)
  if (!session || session.role !== 'seller') return NextResponse.json(buildErrorPayload('Seller authentication required.', 403, 'ROLE_REQUIRED'), { status: 403 })
  const id = (await context.params).id
  const body = await request.json().catch(() => null)
  const allowedStatuses: LotStatus[] = ['available', 'reserved', 'sold']
  let updated = false
  let error = ''
  updateStore((store) => {
    const lot = store.lots.find((item) => item.id === id)
    if (!lot) { error = 'Lot not found.'; return }
    if (body?.status !== undefined) {
      if (!allowedStatuses.includes(body.status)) { error = 'Invalid lot status.'; return }
      lot.status = body.status
    }
    if (typeof body?.verified === 'boolean') lot.verified = body.verified
    if (typeof body?.qualityScore === 'number' && body.qualityScore >= 0 && body.qualityScore <= 100) lot.qualityScore = body.qualityScore
    if (typeof body?.readinessPercent === 'number' && body.readinessPercent >= 0 && body.readinessPercent <= 100) lot.readinessPercent = body.readinessPercent
    updated = true
    addActivity(store, `Lot ${lot.name} updated`, { actorId: session.userId, actorRole: session.role, action: 'lot_updated', entityType: 'lot', entityId: lot.id })
  })
  if (error) return NextResponse.json(buildErrorPayload(error, error === 'Lot not found.' ? 404 : 400, error === 'Lot not found.' ? 'LOT_NOT_FOUND' : 'INVALID_LOT_STATUS'), { status: error === 'Lot not found.' ? 404 : 400 })
  const lot = readStore().lots.find((item) => item.id === id)
  return updated && lot ? NextResponse.json({ data: lot }) : NextResponse.json(buildErrorPayload('Unable to update lot.', 400, 'LOT_UPDATE_FAILED'), { status: 400 })
}
