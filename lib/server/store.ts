import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { demoSnapshot, type BuyerMatch, type Crop, type DashboardSnapshot, type DocumentStatus, type DocumentType, type LogisticsQuote, type ReadinessItem, type RequestStatus, type ReviewStatus, type ReviewType, type UserRole, type LotStatus } from '@/lib/agrobridge'

export type { LotStatus } from '@/lib/agrobridge'

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
  buyerId: string
  buyerName: string
  buyerLocation: string
  crop: Crop
  quantityTonnes: number
  targetPricePerTonne: number
  status: RequestStatus
  createdAt: string
}

export type Shortlist = {
  id: string
  buyerId: string
  lotId: string
  createdAt: string
}

export type UserAccount = {
  id: string
  role: UserRole
  email: string
  displayName: string
  active: boolean
  createdAt: string
  passwordHash?: string
}

export type DocumentRecord = ReadinessItem & {
  lotId: string
  type: DocumentType
  status: DocumentStatus
  updatedAt: string
}

export type ReviewItem = {
  id: string
  type: ReviewType
  label: string
  status: ReviewStatus
  createdAt: string
  reviewedBy?: string
  reviewedAt?: string
  decisionReason?: string
}

export type ActivityItem = {
  id: string
  message: string
  createdAt: string
  actorId?: string
  actorRole?: string
  action?: string
  entityType?: string
  entityId?: string
  metadata?: Record<string, unknown>
}

export type StoreData = {
  snapshot: DashboardSnapshot
  accounts: UserAccount[]
  lots: Lot[]
  requests: BuyerRequest[]
  shortlists: Shortlist[]
  documents: DocumentRecord[]
  reviews: ReviewItem[]
  activity: ActivityItem[]
}

export type StoreRepository = {
  readStore: () => StoreData
  writeStore: (data: StoreData) => StoreData
  updateStore: (mutator: (data: StoreData) => void) => StoreData
  close?: () => void
}

function resolveDataFile() {
  const configuredDataFile = process.env.AGROBRIDGE_DATA_FILE
  if (configuredDataFile) return path.resolve(configuredDataFile)
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AGROBRIDGE_DATA_FILE must be configured in production. Use a managed database-backed store instead of the local JSON file.')
  }
  return path.join(process.cwd(), 'data', 'agrobridge.json')
}

function now() {
  return new Date().toISOString()
}

function seedData(): StoreData {
  const timestamp = now()
  const sellerId = demoSnapshot.farmer.id
  return {
    snapshot: demoSnapshot,
    accounts: [
      { id: 'seller_account', role: 'seller', email: 'seller@agrobridge.local', displayName: demoSnapshot.farmer.name, active: true, createdAt: timestamp },
      { id: 'buyer_account', role: 'buyer', email: 'buyer@agrobridge.local', displayName: 'Demo Buyer', active: true, createdAt: timestamp },
      { id: 'admin_account', role: 'admin', email: 'admin@agrobridge.local', displayName: 'Platform Admin', active: true, createdAt: timestamp },
    ],
    lots: [
      { id: 'lot_sb_2406_018', name: 'Kwara Sesame Lot SB-2406', crop: 'Sesame', quantityTonnes: 3, pricePerTonne: 535000, location: 'Ilorin, Kwara', sellerId, status: 'available', verified: true, qualityScore: 94, readinessPercent: 72, createdAt: '2025-06-18T07:00:00.000Z' },
      { id: 'lot_kano_001', name: 'Kano Premium Sesame', crop: 'Sesame', quantityTonnes: 20, pricePerTonne: 570000, location: 'Kano, Nigeria', sellerId: 'farmer_kano_002', status: 'available', verified: true, qualityScore: 91, readinessPercent: 86, createdAt: '2025-06-17T09:00:00.000Z' },
      { id: 'lot_kaduna_004', name: 'Northstar Soybean Batch', crop: 'Soybean', quantityTonnes: 8, pricePerTonne: 420000, location: 'Kaduna, Nigeria', sellerId: 'farmer_kaduna_004', status: 'available', verified: true, qualityScore: 88, readinessPercent: 79, createdAt: '2025-06-16T11:00:00.000Z' },
    ],
    requests: [
      { id: 'request_demo_001', buyerId: 'buyer_account', buyerName: 'Lagos Food Hub', buyerLocation: 'Lagos', crop: 'Sesame', quantityTonnes: 8, targetPricePerTonne: 535000, status: 'open', createdAt: '2025-06-18T08:30:00.000Z' },
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

function emptyStore(): StoreData {
  return {
    snapshot: {
      farmer: { id: '', name: '', farmName: '', location: '', verified: false },
      marketSignals: [],
      buyers: [],
      logistics: [],
      readiness: [],
      infrastructure: { mode: 'local', persistence: 'SQLite database', services: [] },
    },
    accounts: [],
    lots: [],
    requests: [],
    shortlists: [],
    documents: [],
    reviews: [],
    activity: [],
  }
}

function ensureDataFile() {
  const dataFile = resolveDataFile()
  const dataDirectory = path.dirname(dataFile)
  if (!fs.existsSync(dataDirectory)) fs.mkdirSync(dataDirectory, { recursive: true })
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify(seedData(), null, 2), 'utf8')
}

function createFileRepository(): StoreRepository {
  return {
    readStore() {
      const dataFile = resolveDataFile()
      ensureDataFile()
      try {
        return JSON.parse(fs.readFileSync(dataFile, 'utf8')) as StoreData
      } catch {
        const fresh = seedData()
        fs.writeFileSync(dataFile, JSON.stringify(fresh, null, 2), 'utf8')
        return fresh
      }
    },
    writeStore(data) {
      const dataFile = resolveDataFile()
      ensureDataFile()
      const temporaryFile = `${dataFile}.${process.pid}.tmp`
      fs.writeFileSync(temporaryFile, JSON.stringify(data, null, 2), 'utf8')
      fs.renameSync(temporaryFile, dataFile)
      return data
    },
    updateStore(mutator) {
      const data = this.readStore()
      mutator(data)
      return this.writeStore(data)
    },
  }
}

function createDatabaseRepository(): StoreRepository {
  const databaseUrl = process.env.AGROBRIDGE_DATABASE_URL
  if (!databaseUrl) {
    throw new Error('AGROBRIDGE_DATABASE_URL must be configured when AGROBRIDGE_STORE_MODE=database.')
  }

  const databaseFile = databaseUrl.replace(/^sqlite:\/\//, '')
  if (!databaseFile) throw new Error('AGROBRIDGE_DATABASE_URL must point to a SQLite database file.')
  const database = new DatabaseSync(path.resolve(databaseFile))
  database.exec('CREATE TABLE IF NOT EXISTS agrobridge_store (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL, updated_at TEXT NOT NULL)')

  const read = () => {
    const row = database.prepare('SELECT data FROM agrobridge_store WHERE id = 1').get() as { data?: string } | undefined
    if (row?.data) return JSON.parse(row.data) as StoreData
    const initial = process.env.NODE_ENV === 'production' ? emptyStore() : seedData()
    database.prepare('INSERT INTO agrobridge_store (id, data, updated_at) VALUES (1, ?, ?)').run(JSON.stringify(initial), now())
    return initial
  }

  const write = (data: StoreData) => {
    database.prepare('INSERT INTO agrobridge_store (id, data, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at').run(JSON.stringify(data), now())
    return data
  }

  return {
    readStore: read,
    writeStore: write,
    close: () => database.close(),
    updateStore(mutator) {
      database.exec('BEGIN IMMEDIATE')
      try {
        const data = read()
        mutator(data)
        const result = write(data)
        database.exec('COMMIT')
        return result
      } catch (error) {
        database.exec('ROLLBACK')
        throw error
      }
    },
  }
}

export function createRepository(): StoreRepository {
  const storeMode = (process.env.AGROBRIDGE_STORE_MODE ?? 'file').toLowerCase()
  if (storeMode === 'database') return createDatabaseRepository()
  return createFileRepository()
}

export function readStore(): StoreData {
  return createRepository().readStore()
}

export function writeStore(data: StoreData) {
  return createRepository().writeStore(data)
}

export function updateStore(mutator: (data: StoreData) => void) {
  return createRepository().updateStore(mutator)
}

export function createId(prefix: string) {
  return `${prefix}_${randomUUID()}`
}

export function addActivity(data: StoreData, message: string, details: Omit<ActivityItem, 'id' | 'message' | 'createdAt'> = {}) {
  data.activity.unshift({ id: createId('activity'), message, createdAt: now(), ...details })
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
  return resolveDataFile()
}
