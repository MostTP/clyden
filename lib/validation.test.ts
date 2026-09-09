import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validateBuyerRequestPayload,
  validateLotPayload,
  validateShortlistPayload,
} from './validation'

test('validateLotPayload rejects invalid lot input', () => {
  assert.equal(validateLotPayload({ name: '', crop: 'Sesame', location: 'Lagos', quantityTonnes: 0, pricePerTonne: 200000 }).ok, false)
  assert.equal(validateLotPayload({ name: 'Maize', crop: 'Sesame', location: 'Lagos', quantityTonnes: 5, pricePerTonne: 200000 }).ok, true)
})

test('validateBuyerRequestPayload rejects invalid request input', () => {
  assert.equal(validateBuyerRequestPayload({ buyerName: 'Test', buyerLocation: 'Lagos', crop: 'Rice', quantityTonnes: 5, targetPricePerTonne: 200000 }).ok, false)
  assert.equal(validateBuyerRequestPayload({ buyerName: 'Test', buyerLocation: 'Lagos', crop: 'Sesame', quantityTonnes: 5, targetPricePerTonne: 200000 }).ok, true)
})

test('validateShortlistPayload requires a lot id and ignores client ownership', () => {
  assert.equal(validateShortlistPayload({ lotId: '' }).ok, false)
  assert.deepEqual(validateShortlistPayload({ buyerId: 'attacker', lotId: 'lot_123' }), { ok: true, value: { lotId: 'lot_123' } })
})
