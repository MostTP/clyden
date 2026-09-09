import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRepository, getDataFilePath } from './store'

test('production mode refuses the repository-local JSON store by default', () => {
  const env = process.env as Record<string, string | undefined>
  const previousNodeEnv = env.NODE_ENV
  const previousDataFile = env.AGROBRIDGE_DATA_FILE

  try {
    env.NODE_ENV = 'production'
    Reflect.deleteProperty(env, 'AGROBRIDGE_DATA_FILE')
    assert.throws(() => getDataFilePath(), /AGROBRIDGE_DATA_FILE.*production/i)
  } finally {
    if (previousNodeEnv === undefined) Reflect.deleteProperty(env, 'NODE_ENV')
    else env.NODE_ENV = previousNodeEnv

    if (previousDataFile === undefined) Reflect.deleteProperty(env, 'AGROBRIDGE_DATA_FILE')
    else env.AGROBRIDGE_DATA_FILE = previousDataFile
  }
})

test('production mode requires a database-backed repository when configured', () => {
  const env = process.env as Record<string, string | undefined>
  const previousNodeEnv = env.NODE_ENV
  const previousStoreMode = env.AGROBRIDGE_STORE_MODE
  const previousDatabaseUrl = env.AGROBRIDGE_DATABASE_URL

  try {
    env.NODE_ENV = 'production'
    env.AGROBRIDGE_STORE_MODE = 'database'
    Reflect.deleteProperty(env, 'AGROBRIDGE_DATABASE_URL')

    assert.throws(() => createRepository(), /AGROBRIDGE_DATABASE_URL.*database/i)
  } finally {
    if (previousNodeEnv === undefined) Reflect.deleteProperty(env, 'NODE_ENV')
    else env.NODE_ENV = previousNodeEnv

    if (previousStoreMode === undefined) Reflect.deleteProperty(env, 'AGROBRIDGE_STORE_MODE')
    else env.AGROBRIDGE_STORE_MODE = previousStoreMode

    if (previousDatabaseUrl === undefined) Reflect.deleteProperty(env, 'AGROBRIDGE_DATABASE_URL')
    else env.AGROBRIDGE_DATABASE_URL = previousDatabaseUrl
  }
})

test('database repository persists updates across repository instances', () => {
  const env = process.env as Record<string, string | undefined>
  const previousNodeEnv = env.NODE_ENV
  const previousStoreMode = env.AGROBRIDGE_STORE_MODE
  const previousDatabaseUrl = env.AGROBRIDGE_DATABASE_URL
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'agrobridge-store-'))
  const databaseFile = path.join(temporaryDirectory, 'agrobridge.db')
  let firstRepository: ReturnType<typeof createRepository> | undefined
  let secondRepository: ReturnType<typeof createRepository> | undefined

  try {
    env.NODE_ENV = 'test'
    env.AGROBRIDGE_STORE_MODE = 'database'
    env.AGROBRIDGE_DATABASE_URL = databaseFile

    firstRepository = createRepository()
    const initialName = firstRepository.readStore().snapshot.farmer.name
    firstRepository.updateStore((store) => { store.snapshot.farmer.name = 'Persisted farmer' })

    secondRepository = createRepository()
    assert.equal(secondRepository.readStore().snapshot.farmer.name, 'Persisted farmer')
    assert.notEqual(initialName, 'Persisted farmer')
  } finally {
    firstRepository?.close?.()
    secondRepository?.close?.()
    fs.rmSync(temporaryDirectory, { recursive: true, force: true })
    if (previousNodeEnv === undefined) Reflect.deleteProperty(env, 'NODE_ENV')
    else env.NODE_ENV = previousNodeEnv

    if (previousStoreMode === undefined) Reflect.deleteProperty(env, 'AGROBRIDGE_STORE_MODE')
    else env.AGROBRIDGE_STORE_MODE = previousStoreMode

    if (previousDatabaseUrl === undefined) Reflect.deleteProperty(env, 'AGROBRIDGE_DATABASE_URL')
    else env.AGROBRIDGE_DATABASE_URL = previousDatabaseUrl
  }
})

test('production database mode starts without demo records', () => {
  const env = process.env as Record<string, string | undefined>
  const previousNodeEnv = env.NODE_ENV
  const previousStoreMode = env.AGROBRIDGE_STORE_MODE
  const previousDatabaseUrl = env.AGROBRIDGE_DATABASE_URL
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'agrobridge-production-'))
  let repository: ReturnType<typeof createRepository> | undefined

  try {
    env.NODE_ENV = 'production'
    env.AGROBRIDGE_STORE_MODE = 'database'
    env.AGROBRIDGE_DATABASE_URL = path.join(temporaryDirectory, 'agrobridge.db')
    repository = createRepository()

    const store = repository.readStore()
    assert.equal(store.lots.length, 0)
    assert.equal(store.requests.length, 0)
    assert.equal(store.snapshot.farmer.id, '')
    assert.equal(store.accounts.length, 0)
  } finally {
    repository?.close?.()
    fs.rmSync(temporaryDirectory, { recursive: true, force: true })
    if (previousNodeEnv === undefined) Reflect.deleteProperty(env, 'NODE_ENV')
    else env.NODE_ENV = previousNodeEnv

    if (previousStoreMode === undefined) Reflect.deleteProperty(env, 'AGROBRIDGE_STORE_MODE')
    else env.AGROBRIDGE_STORE_MODE = previousStoreMode

    if (previousDatabaseUrl === undefined) Reflect.deleteProperty(env, 'AGROBRIDGE_DATABASE_URL')
    else env.AGROBRIDGE_DATABASE_URL = previousDatabaseUrl
  }
})
