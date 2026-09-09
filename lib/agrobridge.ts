export type Crop = 'Sesame' | 'Soybean'

export type MarketSignal = {
  crop: Crop
  region: string
  currentPrice: number
  changePercent: number
  trend: number[]
  updatedAt: string
}

export type BuyerMatch = {
  id: string
  name: string
  location: string
  distanceKm: number
  crop: Crop
  quantityTonnes: number
  pricePerTonne: number
  matchPercent: number
  verified: boolean
}

export type LogisticsQuote = {
  id: string
  origin: string
  destination: string
  price: number
  durationDays: string
  provider: string
  status: 'available' | 'booked'
}

export type ReadinessItem = {
  id: string
  label: string
  complete: boolean
}

export type DashboardSnapshot = {
  farmer: { id: string; name: string; farmName: string; location: string; verified: boolean }
  marketSignals: MarketSignal[]
  buyers: BuyerMatch[]
  logistics: LogisticsQuote[]
  readiness: ReadinessItem[]
  infrastructure: { mode: 'demo' | 'local'; persistence: string; services: string[] }
}

export const demoSnapshot: DashboardSnapshot = {
  farmer: { id: 'farmer_demo_001', name: 'Amina Yusuf', farmName: 'Kwara Farm', location: 'Ilorin, Kwara', verified: true },
  marketSignals: [
    { crop: 'Sesame', region: 'North Central', currentPrice: 570000, changePercent: 8.4, trend: [42, 38, 44, 50, 47, 56, 61, 68, 64, 76], updatedAt: '2025-06-18T08:00:00.000Z' },
    { crop: 'Soybean', region: 'North Central', currentPrice: 410000, changePercent: 4.8, trend: [42, 45, 43, 48, 52, 50, 57, 58, 62, 66], updatedAt: '2025-06-18T08:00:00.000Z' },
  ],
  buyers: [
    { id: 'buyer_kano_export', name: 'Kano Grains & Export', location: 'Kano', distanceKm: 413, crop: 'Sesame', quantityTonnes: 20, pricePerTonne: 570000, matchPercent: 84, verified: true },
    { id: 'buyer_lagos_hub', name: 'Lagos Food Hub', location: 'Lagos', distanceKm: 319, crop: 'Sesame', quantityTonnes: 8, pricePerTonne: 535000, matchPercent: 62, verified: true },
  ],
  logistics: [{ id: 'quote_001', origin: 'Kwara Farm', destination: 'Kano hub', price: 42000, durationDays: '2–3 days', provider: 'Northline Haulage', status: 'available' }],
  readiness: [
    { id: 'identity', label: 'Farmer identity verified', complete: true },
    { id: 'quality', label: 'Batch quality recorded', complete: true },
    { id: 'lab', label: 'Lab certificate', complete: false },
  ],
  infrastructure: { mode: 'local', persistence: 'JSON file store', services: ['Dashboard API', 'Lots', 'Buyer requests', 'Shortlists', 'Documents', 'Logistics', 'Admin reviews'] },
}

export function getSnapshot(crop: Crop = 'Sesame') {
  return { ...demoSnapshot, marketSignals: demoSnapshot.marketSignals.filter((signal) => signal.crop === crop) }
}

export function answerCopilot(prompt: string, snapshot: DashboardSnapshot) {
  const strongestBuyer = snapshot.buyers.reduce((best, buyer) => buyer.matchPercent > best.matchPercent ? buyer : best, snapshot.buyers[0])
  if (!strongestBuyer) return `I could not find a current buyer match for “${prompt.trim()}”. Review your lot details and try again.`
  return `For “${prompt.trim()}”, the strongest current match is ${strongestBuyer.name} at ${strongestBuyer.matchPercent}% fit, offering ${strongestBuyer.quantityTonnes} tonnes at ${strongestBuyer.pricePerTonne.toLocaleString('en-NG')} per tonne.`
}
