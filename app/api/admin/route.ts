import { NextResponse } from 'next/server'
import { readSessionFromRequest } from '@/lib/auth'
import { buildErrorPayload } from '@/lib/api'
import { addActivity, readStore, updateStore } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await readSessionFromRequest(request)
  if (!session || session.role !== 'admin') return NextResponse.json(buildErrorPayload('Admin authentication required.', 403, 'ROLE_REQUIRED'), { status: 403 })
  const store = readStore()
  return NextResponse.json({
    data: {
      stats: {
        activeFarmers: new Set(store.lots.map((lot) => lot.sellerId)).size,
        lotsInNetwork: store.lots.length,
        shipmentsMoving: store.snapshot.logistics.filter((quote) => quote.status === 'booked').length,
        needsReview: store.reviews.filter((item) => item.status === 'pending').length,
      },
      reviews: store.reviews,
      activity: store.activity.slice(0, 10),
    },
  })
}

export async function PATCH(request: Request) {
  const session = await readSessionFromRequest(request)
  if (!session || session.role !== 'admin') return NextResponse.json(buildErrorPayload('Authentication required.', 401, 'AUTH_REQUIRED'), { status: 401 })
  const body = await request.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : ''
  const status = body?.status
  if (!id || !['pending', 'approved', 'rejected', 'escalated'].includes(status)) return NextResponse.json(buildErrorPayload('id and a valid status are required.', 400, 'INVALID_REVIEW_STATUS'), { status: 400 })

  let found = false
  updateStore((store) => {
    const review = store.reviews.find((item) => item.id === id)
    if (!review) return
    if (review.status !== 'pending' && status !== 'pending') { return }
    review.status = status
    review.reviewedBy = session.userId
    review.reviewedAt = new Date().toISOString()
    review.decisionReason = typeof body?.reason === 'string' ? body.reason.trim() : undefined
    found = true
    addActivity(store, `${review.label} review ${status}`, { actorId: session.userId, actorRole: session.role, action: 'review_status_changed', entityType: 'review', entityId: review.id, metadata: { status, reason: review.decisionReason } })
  })

  if (!found) return NextResponse.json(buildErrorPayload('Review item not found.', 404, 'REVIEW_NOT_FOUND'), { status: 404 })
  return NextResponse.json({ data: readStore().reviews.find((item) => item.id === id) })
}
