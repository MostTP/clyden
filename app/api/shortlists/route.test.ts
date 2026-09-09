import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createSessionToken } from '@/lib/auth'
import { POST } from './route'

test('shortlist creation uses the authenticated buyer identity', async () => {
  const env = process.env as Record<string, string | undefined>
  const previousDataFile = env.AGROBRIDGE_DATA_FILE
  const previousStoreMode = env.AGROBRIDGE_STORE_MODE
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'agrobridge-route-'))
  env.AGROBRIDGE_DATA_FILE = path.join(temporaryDirectory, 'store.json')
  env.AGROBRIDGE_STORE_MODE = 'file'

  try {
    const token = await createSessionToken('buyer', 'buyer_test_account')
    const response = await POST(new Request('http://localhost/api/shortlists', {
      method: 'POST',
      headers: { cookie: `agrobridge_session=${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ buyerId: 'attacker', lotId: 'lot_sb_2406_018' }),
    }))
    const payload = await response.json()

    assert.equal(response.status, 201)
    assert.equal(payload.data.buyerId, 'buyer_test_account')
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true })
    if (previousDataFile === undefined) Reflect.deleteProperty(env, 'AGROBRIDGE_DATA_FILE')
    else env.AGROBRIDGE_DATA_FILE = previousDataFile
    if (previousStoreMode === undefined) Reflect.deleteProperty(env, 'AGROBRIDGE_STORE_MODE')
    else env.AGROBRIDGE_STORE_MODE = previousStoreMode
  }
})

test('shortlist creation rejects unauthenticated requests', async () => {
  const response = await POST(new Request('http://localhost/api/shortlists', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ lotId: 'lot_sb_2406_018' }),
  }))
  assert.equal(response.status, 401)
})
