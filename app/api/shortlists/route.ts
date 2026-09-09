import { NextResponse } from 'next/server'
import { addActivity, createId, readStore, updateStore } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const buyerId = new URL(request.url).searchParams.get('buyerId')
  const data = readStore().shortlists.filter((item) => !buyerId || item.buyerId === buyerId)
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const buyerId = typeof body?.buyerId === 'string' ? body.buyerId.trim() : ''
  const lotId = typeof body?.lotId === 'string' ? body.lotId.trim() : ''
  if (!lotId) return NextResponse.json({ error: 'lotId is required.' }, { status: 400 })
  let result: { id: string; buyerId: string; lotId: string; createdAt: string } | undefined
  let error = ''
  updateStore((store) => {
    if (!store.lots.some((lot) => lot.id === lotId)) { error = 'Lot not found.'; return }
    const existing = store.shortlists.find((item) => item.buyerId === buyerId && item.lotId === lotId)
    if (existing) { result = existing; return }
    result = { id: createId('shortlist'), buyerId, lotId, createdAt: new Date().toISOString() }
    store.shortlists.unshift(result)
    addActivity(store, `Lot ${lotId} added to buyer shortlist`)
  })
  if (error) return NextResponse.json({ error }, { status: 404 })
  return NextResponse.json({ data: result }, { status: 201 })
}
