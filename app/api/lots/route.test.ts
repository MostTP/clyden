import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createSessionToken } from '@/lib/auth'
import { POST } from './route'

test('lot creation scopes seller identity to the session', async () => {
  const env = process.env as Record<string, string | undefined>
  const previousDataFile = env.AGROBRIDGE_DATA_FILE
  const previousStoreMode = env.AGROBRIDGE_STORE_MODE
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'agrobridge-lot-'))
  env.AGROBRIDGE_DATA_FILE = path.join(temporaryDirectory, 'store.json')
  env.AGROBRIDGE_STORE_MODE = 'file'

  try {
    const token = await createSessionToken('seller', 'seller_test_account')
    const response = await POST(new Request('http://localhost/api/lots', {
      method: 'POST',
      headers: { cookie: `agrobridge_session=${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Test sesame lot', crop: 'Sesame', location: 'Kano', quantityTonnes: 12, pricePerTonne: 850 }),
    }))
    const payload = await response.json()

    assert.equal(response.status, 201)
    assert.equal(payload.data.sellerId, 'seller_test_account')
    assert.equal(payload.data.status, 'available')
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true })
    if (previousDataFile === undefined) Reflect.deleteProperty(env, 'AGROBRIDGE_DATA_FILE')
    else env.AGROBRIDGE_DATA_FILE = previousDataFile
    if (previousStoreMode === undefined) Reflect.deleteProperty(env, 'AGROBRIDGE_STORE_MODE')
    else env.AGROBRIDGE_STORE_MODE = previousStoreMode
  }
})

test('lot creation rejects non-seller sessions', async () => {
  const token = await createSessionToken('buyer', 'buyer_test_account')
  const response = await POST(new Request('http://localhost/api/lots', {
    method: 'POST',
    headers: { cookie: `agrobridge_session=${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Unauthorized lot', crop: 'Sesame', location: 'Kano', quantityTonnes: 12, pricePerTonne: 850 }),
  }))
  assert.equal(response.status, 403)
})
