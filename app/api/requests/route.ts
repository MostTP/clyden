import { NextResponse } from 'next/server'
import { activityDetails, readSessionFromRequest } from '@/lib/auth'
import { addActivity, createId, readStore, updateStore, type BuyerRequest } from '@/lib/server/store'
import { buildErrorPayload } from '@/lib/api'
import { validateBuyerRequestPayload } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await readSessionFromRequest(request)
  const requests = readStore().requests.filter((item) => session?.role === 'seller' || item.buyerId === session?.userId)
  return NextResponse.json({ data: requests, meta: { total: requests.length } })
}

export async function POST(request: Request) {
  const session = await readSessionFromRequest(request)
  if (!session || session.role !== 'buyer') return NextResponse.json(buildErrorPayload('Authentication required.', 401, 'AUTH_REQUIRED'), { status: 401 })
  const body = await request.json().catch(() => null)
  const validated = validateBuyerRequestPayload(body)
  if (!validated.ok) return NextResponse.json(buildErrorPayload(validated.error, 400, 'VALIDATION_ERROR'), { status: 400 })

  const { buyerName, buyerLocation, crop, quantityTonnes, targetPricePerTonne } = validated.value
  const requestId = createId('request')
  const audit = await activityDetails(request, 'request_created', 'request', requestId)
  let created: BuyerRequest | undefined
  updateStore((store) => {
    created = { id: requestId, buyerId: session.userId, buyerName, buyerLocation, crop, quantityTonnes, targetPricePerTonne, status: 'open', createdAt: new Date().toISOString() }
    store.requests.unshift(created)
    addActivity(store, `${buyerName} opened a ${quantityTonnes}t ${crop.toLowerCase()} request`, audit)
  })
  return NextResponse.json({ data: created }, { status: 201 })
}
