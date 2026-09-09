const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:3010'
let sessionCookie = ''

async function request(path, options) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(sessionCookie ? { Cookie: sessionCookie } : {}), ...(options?.headers ?? {}) },
  })
  const setCookie = response.headers.get('set-cookie')
  if (setCookie) sessionCookie = setCookie.split(';', 1)[0]
  const payload = await response.json()
  if (!response.ok) throw new Error(`${options?.method ?? 'GET'} ${path}: ${payload.error ?? response.statusText}`)
  return payload
}

async function login(role) {
  await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ role, password: `${role}123` }),
  })
}

await login('seller')
const dashboard = await request('/api/dashboard?crop=Sesame')
if (!dashboard.data.marketSignals.length) throw new Error('Expected a sesame market signal')

const lot = await request('/api/lots', {
  method: 'POST',
  body: JSON.stringify({ name: `Smoke Test ${Date.now()}`, crop: 'Sesame', quantityTonnes: 1, pricePerTonne: 500000, location: 'Ilorin, Kwara' }),
})
await request('/api/shortlists', { method: 'POST', body: JSON.stringify({ buyerId: `smoke-${Date.now()}`, lotId: lot.data.id }) })
const buyerRequest = await request('/api/requests', {
  method: 'POST',
  body: JSON.stringify({ buyerName: 'Smoke Buyer', buyerLocation: 'Lagos', crop: 'Soybean', quantityTonnes: 1, targetPricePerTonne: 400000 }),
})
const document = await request('/api/documents', { method: 'PATCH', body: JSON.stringify({ id: 'lab', complete: true }) })
const logistics = await request('/api/logistics', { method: 'PATCH', body: JSON.stringify({ id: 'quote_001', status: 'booked' }) })
await login('admin')
const admin = await request('/api/admin')
const review = admin.data.reviews.find((item) => item.status === 'pending')
if (!review) throw new Error('Expected a pending review')
const approvedReview = await request('/api/admin', { method: 'PATCH', body: JSON.stringify({ id: review.id, status: 'approved' }) })

console.log(JSON.stringify({
  dashboardSignals: dashboard.data.marketSignals.length,
  createdLot: lot.data.id,
  requestStatus: buyerRequest.data.status,
  documentStatus: document.data.status,
  logisticsStatus: logistics.data.status,
  reviewStatus: approvedReview.data.status,
}, null, 2))
