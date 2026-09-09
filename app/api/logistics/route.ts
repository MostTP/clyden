import { NextResponse } from 'next/server'
import { addActivity, readStore, updateStore } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ data: readStore().snapshot.logistics })
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : ''
  const status = body?.status
  if (!id || !['available', 'booked'].includes(status)) return NextResponse.json({ error: 'id and a valid status are required.' }, { status: 400 })
  let found = false
  updateStore((store) => {
    const quote = store.snapshot.logistics.find((item) => item.id === id)
    if (!quote) return
    quote.status = status
    found = true
    addActivity(store, `${quote.provider} logistics quote ${status}`)
  })
  if (!found) return NextResponse.json({ error: 'Logistics quote not found.' }, { status: 404 })
  return NextResponse.json({ data: readStore().snapshot.logistics.find((item) => item.id === id) })
}
