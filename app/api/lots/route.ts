import { NextResponse } from 'next/server'
import { activityDetails, readSessionFromRequest } from '@/lib/auth'
import { addActivity, createId, readStore, updateStore, type Lot, type LotStatus } from '@/lib/server/store'
import type { Crop } from '@/lib/agrobridge'
import { buildErrorPayload } from '@/lib/api'
import { validateLotPayload } from '@/lib/validation'

export const dynamic = 'force-dynamic'

const validCrops: Crop[] = ['Sesame', 'Soybean']

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const crop = params.get('crop')
  const status = params.get('status') as LotStatus | null
  const search = params.get('search')?.toLowerCase().trim()
  if (crop && !validCrops.includes(crop as Crop)) return NextResponse.json(buildErrorPayload('Invalid crop filter.', 400, 'INVALID_CROP_FILTER'), { status: 400 })
  if (status && !['available', 'reserved', 'sold'].includes(status)) return NextResponse.json(buildErrorPayload('Invalid status filter.', 400, 'INVALID_STATUS_FILTER'), { status: 400 })
  const store = readStore()
  const lots = store.lots.filter((lot) => (!crop || lot.crop === crop) && (!status || lot.status === status) && (!search || `${lot.name} ${lot.location}`.toLowerCase().includes(search)))
  return NextResponse.json({ data: lots, meta: { total: lots.length } })
}

export async function POST(request: Request) {
  const session = await readSessionFromRequest(request)
  if (!session || session.role !== 'seller') return NextResponse.json(buildErrorPayload('Seller authentication required.', 403, 'ROLE_REQUIRED'), { status: 403 })
  const body = await request.json().catch(() => null)
  const validated = validateLotPayload(body)
  if (!validated.ok) return NextResponse.json(buildErrorPayload(validated.error, 400, 'VALIDATION_ERROR'), { status: 400 })

  const { name, crop, location, quantityTonnes, pricePerTonne } = validated.value
  const sellerId = session.userId
  const lotId = createId('lot')
  const audit = await activityDetails(request, 'lot_created', 'lot', lotId)

  let created: Lot | undefined
  updateStore((store) => {
    created = { id: lotId, name, crop, quantityTonnes, pricePerTonne, location, sellerId, status: 'available', verified: false, qualityScore: 0, readinessPercent: 0, createdAt: new Date().toISOString() }
    store.lots.unshift(created)
    addActivity(store, `New ${crop.toLowerCase()} lot listed: ${name}`, audit)
  })
  return NextResponse.json({ data: created }, { status: 201 })
}
