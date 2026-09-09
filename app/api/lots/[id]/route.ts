import { NextResponse } from 'next/server'
import { addActivity, readStore, updateStore, type LotStatus } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: { params: Promise<Record<string, string>> }) {
  const id = (await context.params).id
  const lot = readStore().lots.find((item) => item.id === id)
  return lot ? NextResponse.json({ data: lot }) : NextResponse.json({ error: 'Lot not found.' }, { status: 404 })
}

export async function PATCH(request: Request, context: { params: Promise<Record<string, string>> }) {
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
    addActivity(store, `Lot ${lot.name} updated`)
  })
  if (error) return NextResponse.json({ error }, { status: error === 'Lot not found.' ? 404 : 400 })
  const lot = readStore().lots.find((item) => item.id === id)
  return updated && lot ? NextResponse.json({ data: lot }) : NextResponse.json({ error: 'Unable to update lot.' }, { status: 400 })
}
