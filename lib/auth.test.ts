import test from 'node:test'
import assert from 'node:assert/strict'
import { requiredRoleForPath, requiredRolesForPath, rolePassword } from './auth'

test('requiredRoleForPath assigns the correct role to page routes', () => {
  assert.equal(requiredRoleForPath('/seller'), 'seller')
  assert.equal(requiredRoleForPath('/buyer'), 'buyer')
  assert.equal(requiredRoleForPath('/admin'), 'admin')
  assert.equal(requiredRoleForPath('/'), null)
})

test('requiredRolesForPath assigns the correct role set to API routes', () => {
  assert.deepEqual(requiredRolesForPath('/api/admin'), ['admin'])
  assert.deepEqual(requiredRolesForPath('/api/dashboard'), ['seller'])
  assert.equal(requiredRolesForPath('/api/overview'), null)
  assert.deepEqual(requiredRolesForPath('/api/lots'), ['seller', 'buyer'])
  assert.equal(requiredRolesForPath('/api/public'), null)
})

test('rolePassword rejects missing production credentials', () => {
  const env = process.env as Record<string, string | undefined>
  const previousNodeEnv = env.NODE_ENV
  const previousSellerPassword = env.SELLER_PASSWORD
  const previousBuyerPassword = env.BUYER_PASSWORD
  const previousAdminPassword = env.ADMIN_PASSWORD

  try {
    env.NODE_ENV = 'production'
    Reflect.deleteProperty(env, 'SELLER_PASSWORD')
    Reflect.deleteProperty(env, 'BUYER_PASSWORD')
    Reflect.deleteProperty(env, 'ADMIN_PASSWORD')

    assert.equal(rolePassword('seller'), null)
    assert.equal(rolePassword('buyer'), null)
    assert.equal(rolePassword('admin'), null)
  } finally {
    if (previousNodeEnv === undefined) Reflect.deleteProperty(env, 'NODE_ENV')
    else env.NODE_ENV = previousNodeEnv

    if (previousSellerPassword === undefined) Reflect.deleteProperty(env, 'SELLER_PASSWORD')
    else env.SELLER_PASSWORD = previousSellerPassword

    if (previousBuyerPassword === undefined) Reflect.deleteProperty(env, 'BUYER_PASSWORD')
    else env.BUYER_PASSWORD = previousBuyerPassword

    if (previousAdminPassword === undefined) Reflect.deleteProperty(env, 'ADMIN_PASSWORD')
    else env.ADMIN_PASSWORD = previousAdminPassword
  }
})
