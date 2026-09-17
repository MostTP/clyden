import test from 'node:test'
import assert from 'node:assert/strict'
import { createSessionToken } from '@/lib/auth'
import { GET } from './route'

test('admin dashboard rejects unauthenticated reads', async () => {
  const response = await GET(new Request('http://localhost/api/admin'))
  assert.equal(response.status, 403)
})

test('admin dashboard rejects non-admin sessions', async () => {
  const token = await createSessionToken('buyer', 'buyer_test_account')
  const response = await GET(new Request('http://localhost/api/admin', {
    headers: { cookie: `agrobridge_session=${token}` },
  }))
  assert.equal(response.status, 403)
})

test('admin dashboard allows admin sessions', async () => {
  const token = await createSessionToken('admin', 'admin_test_account')
  const response = await GET(new Request('http://localhost/api/admin', {
    headers: { cookie: `agrobridge_session=${token}` },
  }))
  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.ok(payload.data.stats)
})

process.env.AGROBRIDGE_STORE_MODE = 'file'
