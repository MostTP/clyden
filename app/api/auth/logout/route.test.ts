import test from 'node:test'
import assert from 'node:assert/strict'
import { POST } from './route'

test('logout endpoint clears the session cookie', async () => {
  const response = await POST()
  const cookie = response.headers.get('set-cookie') ?? ''

  assert.equal(response.status, 200)
  assert.match(cookie, /agrobridge_session=;/)
  assert.match(cookie, /Max-Age=0/)
})
