import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { demoSnapshot, type BuyerMatch, type Crop, type DashboardSnapshot, type LogisticsQuote, type ReadinessItem } from '@/lib/agrobridge'

export type LotStatus = 'available' | 'reserved' | 'sold'

export type Lot = {
  id: string
  name: string
  crop: Crop
  quantityTonnes: number
  pricePerTonne: number
  location: string
  sellerId: string
  status: LotStatus
  verified: boolean
  qualityScore: number
  readinessPercent: number
  createdAt: string
}

export type BuyerRequest = {
  id: string
  buyerName: string
  buyerLocation: string
  crop: Crop
  quantityTonnes: number
  targetPricePerTonne: number
  status: 'open' | 'matched' | 'closed'
  createdAt: string
}

export type Shortlist = {
  id: string
  buyerId: string
  lotId: string
  createdAt: string
}

export type DocumentRecord = ReadinessItem & {
  lotId: string
  type: 'identity' | 'quality' | 'lab' | 'export'
  status: 'needed' | 'uploaded' | 'approved'
  updatedAt: string
}

export type ReviewItem = {
  id: string
  type: 'buyer_verification' | 'quality_record' | 'delivery_exception'
  label: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export type ActivityItem = {
  id: string
  message: string
  createdAt: string
}

export type StoreData = {
  snapshot: DashboardSnapshot
  lots: Lot[]
  requests: BuyerRequest[]
  shortlists: Shortlist[]
  documents: DocumentRecord[]
  reviews: ReviewItem[]
  activity: ActivityItem[]
}

const configuredDataFile = process.env.AGROBRIDGE_DATA_FILE
const dataFile = configuredDataFile ? path.resolve(configuredDataFile) : path.join(process.cwd(), 'data', 'agrobridge.json')
const dataDirectory = path.dirname(dataFile)

function now() {
  return new Date().toISOString()
}

function seedData(): StoreData {
  const timestamp = now()
  const sellerId = demoSnapshot.farmer.id
  return {
    snapshot: demoSnapshot,
    lots: [
      { id: 'lot_sb_2406_018', name: 'Kwara Sesame Lot SB-2406', crop: 'Sesame', quantityTonnes: 3, pricePerTonne: 535000, location: 'Ilorin, Kwara', sellerId, status: 'available', verified: true, qualityScore: 94, readinessPercent: 72, createdAt: '2025-06-18T07:00:00.000Z' },
      { id: 'lot_kano_001', name: 'Kano Premium Sesame', crop: 'Sesame', quantityTonnes: 20, pricePerTonne: 570000, location: 'Kano, Nigeria', sellerId: 'farmer_kano_002', status: 'available', verified: true, qualityScore: 91, readinessPercent: 86, createdAt: '2025-06-17T09:00:00.000Z' },
      { id: 'lot_kaduna_004', name: 'Northstar Soybean Batch', crop: 'Soybean', quantityTonnes: 8, pricePerTonne: 420000, location: 'Kaduna, Nigeria', sellerId: 'farmer_kaduna_004', status: 'available', verified: true, qualityScore: 88, readinessPercent: 79, createdAt: '2025-06-16T11:00:00.000Z' },
    ],
    requests: [
      { id: 'request_demo_001', buyerName: 'Lagos Food Hub', buyerLocation: 'Lagos', crop: 'Sesame', quantityTonnes: 8, targetPricePerTonne: 535000, status: 'open', createdAt: '2025-06-18T08:30:00.000Z' },
    ],
    shortlists: [],
    documents: [
      { id: 'identity', lotId: 'lot_sb_2406_018', label: 'Farmer identity verified', complete: true, type: 'identity', status: 'approved', updatedAt: timestamp },
      { id: 'quality', lotId: 'lot_sb_2406_018', label: 'Batch quality recorded', complete: true, type: 'quality', status: 'approved', updatedAt: timestamp },
      { id: 'lab', lotId: 'lot_sb_2406_018', label: 'Lab certificate', complete: false, type: 'lab', status: 'needed', updatedAt: timestamp },
      { id: 'export', lotId: 'lot_sb_2406_018', label: 'Export inspection', complete: false, type: 'export', status: 'needed', updatedAt: timestamp },
    ],
    reviews: [
      { id: 'review_buyer_001', type: 'buyer_verification', label: 'Kano Grains & Export', status: 'pending', createdAt: timestamp },
      { id: 'review_quality_001', type: 'quality_record', label: 'Lot SB-2406-018', status: 'pending', createdAt: timestamp },
      { id: 'review_delivery_001', type: 'delivery_exception', label: 'Northline Haulage · Kano route', status: 'pending', createdAt: timestamp },
    ],
    activity: [
      { id: 'activity_001', message: 'Kano Grains verified as an export buyer', createdAt: timestamp },
      { id: 'activity_002', message: 'Lot SB-2406-018 passed quality review', createdAt: timestamp },
      { id: 'activity_003', message: 'Northline Haulage completed a delivery', createdAt: timestamp },
    ],
  }
}

function ensureDataFile() {
  if (!fs.existsSync(dataDirectory)) fs.mkdirSync(dataDirectory, { recursive: true })
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify(seedData(), null, 2), 'utf8')
}

export function readStore(): StoreData {
  ensureDataFile()
  try {
    return JSON.parse(fs.readFileSync(dataFile, 'utf8')) as StoreData
  } catch {
    const fresh = seedData()
    fs.writeFileSync(dataFile, JSON.stringify(fresh, null, 2), 'utf8')
    return fresh
  }
}

export function writeStore(data: StoreData) {
  ensureDataFile()
  const temporaryFile = `${dataFile}.${process.pid}.tmp`
  fs.writeFileSync(temporaryFile, JSON.stringify(data, null, 2), 'utf8')
  fs.renameSync(temporaryFile, dataFile)
  return data
}

export function updateStore(mutator: (data: StoreData) => void) {
  const data = readStore()
  mutator(data)
  return writeStore(data)
}

export function createId(prefix: string) {
  return `${prefix}_${randomUUID()}`
}

export function addActivity(data: StoreData, message: string) {
  data.activity.unshift({ id: createId('activity'), message, createdAt: now() })
  data.activity = data.activity.slice(0, 50)
}

export function snapshotForCrop(data: StoreData, crop: Crop): DashboardSnapshot {
  const base = data.snapshot
  const marketSignals = base.marketSignals.filter((signal) => signal.crop === crop)
  const buyers = base.buyers.filter((buyer) => buyer.crop === crop).map((buyer): BuyerMatch => buyer)
  const logistics = base.logistics.map((quote): LogisticsQuote => quote)
  const sellerLot = data.lots.find((lot) => lot.sellerId === base.farmer.id)
  const readiness = data.documents.filter((document) => document.lotId === sellerLot?.id).map(({ id, label, complete }) => ({ id, label, complete }))
  return { ...base, buyers, marketSignals, logistics, readiness }
}

export function getDataFilePath() {
  return dataFile
}
