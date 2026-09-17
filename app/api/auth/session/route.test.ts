import test from 'node:test'
import assert from 'node:assert/strict'
import { createSessionToken } from '@/lib/auth'
import { GET } from './route'

test('session endpoint returns the authenticated account', async () => {
  const token = await createSessionToken('buyer', 'buyer_test_account')
  const response = await GET(new Request('http://localhost/api/auth/session', {
    headers: { cookie: `agrobridge_session=${token}` },
  }))
  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.equal(payload.data.authenticated, true)
  assert.equal(payload.data.session.userId, 'buyer_test_account')
  assert.equal(payload.data.session.role, 'buyer')
})

test('session endpoint returns null without a valid cookie', async () => {
  const response = await GET(new Request('http://localhost/api/auth/session'))
  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.equal(payload.data.authenticated, false)
  assert.equal(payload.data.session, null)
})
