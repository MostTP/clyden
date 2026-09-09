export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string }

const validCrops = ['Sesame', 'Soybean'] as const

export function validateLotPayload(input: unknown): ValidationResult<{
  name: string
  crop: 'Sesame' | 'Soybean'
  location: string
  quantityTonnes: number
  pricePerTonne: number
}> {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Lot payload is required.' }

  const payload = input as Record<string, unknown>
  const name = typeof payload.name === 'string' ? payload.name.trim() : ''
  const crop = payload.crop
  const location = typeof payload.location === 'string' ? payload.location.trim() : ''
  const quantityTonnes = Number(payload.quantityTonnes)
  const pricePerTonne = Number(payload.pricePerTonne)

  if (!name) return { ok: false, error: 'Lot name is required.' }
  if (!validCrops.includes(crop as 'Sesame' | 'Soybean')) return { ok: false, error: 'Lot crop is invalid.' }
  if (!location) return { ok: false, error: 'Lot location is required.' }
  if (!Number.isFinite(quantityTonnes) || quantityTonnes <= 0) return { ok: false, error: 'Lot quantityTonnes must be a positive number.' }
  if (!Number.isFinite(pricePerTonne) || pricePerTonne <= 0) return { ok: false, error: 'Lot pricePerTonne must be a positive number.' }

  return { ok: true, value: { name, crop: crop as 'Sesame' | 'Soybean', location, quantityTonnes, pricePerTonne } }
}

export function validateBuyerRequestPayload(input: unknown): ValidationResult<{
  buyerName: string
  buyerLocation: string
  crop: 'Sesame' | 'Soybean'
  quantityTonnes: number
  targetPricePerTonne: number
}> {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Buyer request payload is required.' }

  const payload = input as Record<string, unknown>
  const buyerName = typeof payload.buyerName === 'string' ? payload.buyerName.trim() : ''
  const buyerLocation = typeof payload.buyerLocation === 'string' ? payload.buyerLocation.trim() : ''
  const crop = payload.crop
  const quantityTonnes = Number(payload.quantityTonnes)
  const targetPricePerTonne = Number(payload.targetPricePerTonne)

  if (!buyerName) return { ok: false, error: 'buyerName is required.' }
  if (!buyerLocation) return { ok: false, error: 'buyerLocation is required.' }
  if (!validCrops.includes(crop as 'Sesame' | 'Soybean')) return { ok: false, error: 'Invalid crop.' }
  if (!Number.isFinite(quantityTonnes) || quantityTonnes <= 0) return { ok: false, error: 'quantityTonnes must be a positive number.' }
  if (!Number.isFinite(targetPricePerTonne) || targetPricePerTonne <= 0) return { ok: false, error: 'targetPricePerTonne must be a positive number.' }

  return { ok: true, value: { buyerName, buyerLocation, crop: crop as 'Sesame' | 'Soybean', quantityTonnes, targetPricePerTonne } }
}

export function validateShortlistPayload(input: unknown): ValidationResult<{ lotId: string }> {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Shortlist payload is required.' }

  const payload = input as Record<string, unknown>
  const lotId = typeof payload.lotId === 'string' ? payload.lotId.trim() : ''

  if (!lotId) return { ok: false, error: 'lotId is required.' }

  return { ok: true, value: { lotId } }
}
