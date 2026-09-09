import { NextResponse } from 'next/server'
import { addActivity, readStore, updateStore } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export async function GET() {
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
  const body = await request.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : ''
  const status = body?.status
  if (!id || !['pending', 'approved', 'rejected'].includes(status)) return NextResponse.json({ error: 'id and a valid status are required.' }, { status: 400 })

  let found = false
  updateStore((store) => {
    const review = store.reviews.find((item) => item.id === id)
    if (!review) return
    review.status = status
    found = true
    addActivity(store, `${review.label} review ${status}`)
  })

  if (!found) return NextResponse.json({ error: 'Review item not found.' }, { status: 404 })
  return NextResponse.json({ data: readStore().reviews.find((item) => item.id === id) })
}
