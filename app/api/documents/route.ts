import { NextResponse } from 'next/server'
import { addActivity, readStore, updateStore } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const lotId = new URL(request.url).searchParams.get('lotId')
  return NextResponse.json({ data: readStore().documents.filter((item) => !lotId || item.lotId === lotId) })
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : ''
  if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 })

  let documentFound = false
  updateStore((store) => {
    const document = store.documents.find((item) => item.id === id)
    if (!document) return
    document.complete = body?.complete === undefined ? document.complete : Boolean(body.complete)
    document.status = document.complete ? 'uploaded' : 'needed'
    document.updatedAt = new Date().toISOString()
    documentFound = true
    addActivity(store, `${document.label} marked ${document.complete ? 'complete' : 'incomplete'}`)
  })

  if (!documentFound) return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
  return NextResponse.json({ data: readStore().documents.find((item) => item.id === id) })
}
