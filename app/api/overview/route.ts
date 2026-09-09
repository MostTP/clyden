import { NextResponse } from 'next/server'
import { buildOverview } from '@/lib/analytics'
import { readStore } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const store = readStore()
  return NextResponse.json({ data: buildOverview(store) })
}
