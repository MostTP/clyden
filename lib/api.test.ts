import test from 'node:test'
import assert from 'node:assert/strict'
import { buildErrorPayload, buildSuccessPayload } from './api'

test('buildErrorPayload creates a consistent API error payload', () => {
  const payload = buildErrorPayload('Invalid request', 400, 'INVALID_REQUEST')
  assert.deepEqual(payload, { error: 'Invalid request', code: 'INVALID_REQUEST', status: 400 })
})

test('buildSuccessPayload keeps existing data shape with optional meta', () => {
  assert.deepEqual(buildSuccessPayload({ ok: true }, { requestId: 'abc' }), {
    data: { ok: true },
    meta: { requestId: 'abc' },
  })
})
