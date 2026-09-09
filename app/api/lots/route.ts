import { NextResponse } from 'next/server'
import { addActivity, createId, readStore, updateStore, type Lot, type LotStatus } from '@/lib/server/store'
import type { Crop } from '@/lib/agrobridge'

export const dynamic = 'force-dynamic'

const validCrops: Crop[] = ['Sesame', 'Soybean']

function numberValue(value: unknown, fallback = 0) {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? number : fallback
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const crop = params.get('crop')
  const status = params.get('status') as LotStatus | null
  const search = params.get('search')?.toLowerCase().trim()
  if (crop && !validCrops.includes(crop as Crop)) return NextResponse.json({ error: 'Invalid crop filter.' }, { status: 400 })
  if (status && !['available', 'reserved', 'sold'].includes(status)) return NextResponse.json({ error: 'Invalid status filter.' }, { status: 400 })
  const store = readStore()
  const lots = store.lots.filter((lot) => (!crop || lot.crop === crop) && (!status || lot.status === status) && (!search || `${lot.name} ${lot.location}`.toLowerCase().includes(search)))
  return NextResponse.json({ data: lots, meta: { total: lots.length } })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const crop = body?.crop as Crop
  const location = typeof body?.location === 'string' ? body.location.trim() : ''
  const sellerId = typeof body?.sellerId === 'string' && body.sellerId.trim() ? body.sellerId.trim() : readStore().snapshot.farmer.id
  const quantityTonnes = numberValue(body?.quantityTonnes)
  const pricePerTonne = numberValue(body?.pricePerTonne)
  if (!name || !validCrops.includes(crop) || !location || quantityTonnes <= 0 || pricePerTonne <= 0) return NextResponse.json({ error: 'name, crop, location, quantityTonnes, and pricePerTonne are required.' }, { status: 400 })
  let created: Lot | undefined
  updateStore((store) => {
    created = { id: createId('lot'), name, crop, quantityTonnes, pricePerTonne, location, sellerId, status: 'available', verified: false, qualityScore: 0, readinessPercent: 0, createdAt: new Date().toISOString() }
    store.lots.unshift(created)
    addActivity(store, `New ${crop.toLowerCase()} lot listed: ${name}`)
  })
  return NextResponse.json({ data: created }, { status: 201 })
}
