import test from 'node:test'
import assert from 'node:assert/strict'
import { buildOverview } from './analytics'
import { createRepository } from './server/store'

test('buildOverview derives metrics from verified persisted lots', () => {
  const repository = createRepository()
  const store = repository.readStore()
  const overview = buildOverview(store, '2026-09-09T00:00:00.000Z')

  assert.equal(overview.source, 'persisted-marketplace-data')
  assert.equal(overview.updatedAt, '2026-09-09T00:00:00.000Z')
  assert.equal(overview.averageLotReadiness, 79)
  assert.equal(overview.opportunities.every((lot) => lot.verified), true)
})