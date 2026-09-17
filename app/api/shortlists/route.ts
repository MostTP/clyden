import { NextResponse } from 'next/server'
import { activityDetails, readSessionFromRequest } from '@/lib/auth'
import { addActivity, createId, readStore, updateStore } from '@/lib/server/store'
import { buildErrorPayload } from '@/lib/api'
import { validateShortlistPayload } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await readSessionFromRequest(request)
  if (!session) return NextResponse.json(buildErrorPayload('Authentication required.', 401, 'AUTH_REQUIRED'), { status: 401 })
  const data = readStore().shortlists.filter((item) => item.buyerId === session.userId)
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const session = await readSessionFromRequest(request)
  if (!session || session.role !== 'buyer') return NextResponse.json(buildErrorPayload('Authentication required.', 401, 'AUTH_REQUIRED'), { status: 401 })
  const body = await request.json().catch(() => null)
  const validated = validateShortlistPayload(body)
  if (!validated.ok) return NextResponse.json(buildErrorPayload(validated.error, 400, 'VALIDATION_ERROR'), { status: 400 })

  const { lotId } = validated.value
  const buyerId = session.userId
  const audit = await activityDetails(request, 'shortlist_created', 'shortlist', lotId)
  let result: { id: string; buyerId: string; lotId: string; createdAt: string } | undefined
  let error = ''
  updateStore((store) => {
    if (!store.lots.some((lot) => lot.id === lotId)) { error = 'Lot not found.'; return }
    const existing = store.shortlists.find((item) => item.buyerId === buyerId && item.lotId === lotId)
    if (existing) { result = existing; return }
    result = { id: createId('shortlist'), buyerId, lotId, createdAt: new Date().toISOString() }
    store.shortlists.unshift(result)
    addActivity(store, `Lot ${lotId} added to buyer shortlist`, audit)
  })
  if (error) return NextResponse.json(buildErrorPayload(error, 404, 'LOT_NOT_FOUND'), { status: 404 })
  return NextResponse.json({ data: result }, { status: 201 })
}
