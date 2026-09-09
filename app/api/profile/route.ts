import { NextResponse } from 'next/server'
import { addActivity, readStore, updateStore } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ data: readStore().snapshot.farmer })
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const farmName = typeof body?.farmName === 'string' ? body.farmName.trim() : ''
  const location = typeof body?.location === 'string' ? body.location.trim() : ''
  if (!name || !farmName || !location) return NextResponse.json({ error: 'name, farmName, and location are required.' }, { status: 400 })

  updateStore((store) => {
    store.snapshot.farmer = { ...store.snapshot.farmer, name, farmName, location }
    addActivity(store, `${farmName} profile updated`)
  })
  return NextResponse.json({ data: readStore().snapshot.farmer })
}
