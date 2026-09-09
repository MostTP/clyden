import { NextResponse } from 'next/server'
import { addActivity, createId, readStore, updateStore, type BuyerRequest } from '@/lib/server/store'
import type { Crop } from '@/lib/agrobridge'

export const dynamic = 'force-dynamic'

export async function GET() {
  const requests = readStore().requests
  return NextResponse.json({ data: requests, meta: { total: requests.length } })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const buyerName = typeof body?.buyerName === 'string' ? body.buyerName.trim() : ''
  const buyerLocation = typeof body?.buyerLocation === 'string' ? body.buyerLocation.trim() : ''
  const crop = body?.crop as Crop
  const quantityTonnes = Number(body?.quantityTonnes)
  const targetPricePerTonne = Number(body?.targetPricePerTonne)
  if (!buyerName || !buyerLocation || !['Sesame', 'Soybean'].includes(crop) || !Number.isFinite(quantityTonnes) || quantityTonnes <= 0 || !Number.isFinite(targetPricePerTonne) || targetPricePerTonne <= 0) return NextResponse.json({ error: 'buyerName, buyerLocation, crop, quantityTonnes, and targetPricePerTonne are required.' }, { status: 400 })
  let created: BuyerRequest | undefined
  updateStore((store) => {
    created = { id: createId('request'), buyerName, buyerLocation, crop, quantityTonnes, targetPricePerTonne, status: 'open', createdAt: new Date().toISOString() }
    store.requests.unshift(created)
    addActivity(store, `${buyerName} opened a ${quantityTonnes}t ${crop.toLowerCase()} request`)
  })
  return NextResponse.json({ data: created }, { status: 201 })
}
