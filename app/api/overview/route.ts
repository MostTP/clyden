import { NextResponse } from 'next/server'
import { readStore } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const store = readStore()
  const verifiedLots = store.lots.filter((lot) => lot.verified)
  const verifiedBuyers = store.snapshot.buyers.filter((buyer) => buyer.verified)
  const readiness = verifiedLots.length
    ? Math.round(verifiedLots.reduce((total, lot) => total + lot.readinessPercent, 0) / verifiedLots.length)
    : 0

  return NextResponse.json({
    data: {
      marketsMonitored: new Set(store.snapshot.buyers.map((buyer) => buyer.location)).size,
      verifiedBuyerSignals: verifiedBuyers.length,
      averageLotReadiness: readiness,
      opportunities: store.lots.filter((lot) => lot.status === 'available').slice(0, 3),
      updatedAt: store.snapshot.marketSignals.reduce((latest, signal) => signal.updatedAt > latest ? signal.updatedAt : latest, ''),
    },
  })
}
