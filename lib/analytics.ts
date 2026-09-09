import type { StoreData } from '@/lib/server/store'

export function buildOverview(data: StoreData, updatedAt = new Date().toISOString()) {
  const verifiedLots = data.lots.filter((lot) => lot.verified)
  const verifiedBuyers = data.snapshot.buyers.filter((buyer) => buyer.verified)
  const averageLotReadiness = verifiedLots.length
    ? Math.round(verifiedLots.reduce((total, lot) => total + lot.readinessPercent, 0) / verifiedLots.length)
    : 0

  return {
    marketsMonitored: new Set(data.snapshot.buyers.map((buyer) => buyer.location)).size,
    verifiedBuyerSignals: verifiedBuyers.length,
    averageLotReadiness,
    opportunities: data.lots.filter((lot) => lot.status === 'available' && lot.verified).slice(0, 3),
    updatedAt,
    source: 'persisted-marketplace-data',
  }
}