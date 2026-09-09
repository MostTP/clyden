'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, MapPin, Search, ShieldCheck, ShoppingCart, SlidersHorizontal, X } from 'lucide-react'
import { SimpleHeader } from '../landing'

type Lot = {
  id: string
  name: string
  crop: 'Sesame' | 'Soybean'
  quantityTonnes: number
  pricePerTonne: number
  location: string
  status: 'available' | 'reserved' | 'sold'
  verified: boolean
  qualityScore: number
  readinessPercent: number
}

type RequestForm = {
  buyerName: string
  crop: 'Sesame' | 'Soybean'
  quantityTonnes: string
  targetPricePerTonne: string
  buyerLocation: string
}

const initialRequest: RequestForm = { buyerName: '', crop: 'Sesame', quantityTonnes: '', targetPricePerTonne: '', buyerLocation: '' }

function formatNaira(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value)
}

export default function BuyerPage() {
  const router = useRouter()
  useEffect(() => {
    let active = true
    fetch('/api/auth/session', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({ data: null }))
        if (!active) return
        if (!payload.data || payload.data.role !== 'buyer') {
          if (payload.data?.role === 'seller') router.replace('/seller')
          else if (payload.data?.role === 'admin') router.replace('/admin')
          else router.replace('/login?role=buyer&next=/buyer')
        }
      })
      .catch(() => {
        if (active) router.replace('/login?role=buyer&next=/buyer')
      })

    return () => { active = false }
  }, [router])

  const [lots, setLots] = useState<Lot[]>([])
  const [buyerId, setBuyerId] = useState('')
  const [search, setSearch] = useState('')
  const [cropFilter, setCropFilter] = useState<'All' | 'Sesame' | 'Soybean'>('All')
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set())
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null)
  const [showRequest, setShowRequest] = useState(false)
  const [requestForm, setRequestForm] = useState<RequestForm>(initialRequest)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((response) => response.json())
      .then((payload) => setBuyerId(payload.data?.userId ?? ''))
      .catch(() => setBuyerId(''))
  }, [])

  useEffect(() => {
    if (!buyerId) return
    Promise.all([fetch('/api/lots?status=available'), fetch('/api/shortlists')])
      .then(async ([lotsResponse, shortlistResponse]) => {
        if (!lotsResponse.ok || !shortlistResponse.ok) throw new Error('Unable to load the procurement workspace.')
        const lotsPayload = await lotsResponse.json()
        const shortlistPayload = await shortlistResponse.json()
        setLots(lotsPayload.data)
        setShortlisted(new Set(shortlistPayload.data.map((item: { lotId: string }) => item.lotId)))
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Unable to load supply.'))
      .finally(() => setLoading(false))
  }, [buyerId])

  const visibleLots = useMemo(() => {
    const query = search.trim().toLowerCase()
    return lots.filter((lot) => (cropFilter === 'All' || lot.crop === cropFilter) && (!query || `${lot.name} ${lot.crop} ${lot.location}`.toLowerCase().includes(query)))
  }, [cropFilter, lots, search])

  const verifiedSupply = lots.filter((lot) => lot.verified).reduce((total, lot) => total + lot.quantityTonnes, 0)
  const averageMatch = lots.length ? Math.round(lots.reduce((total, lot) => total + lot.qualityScore, 0) / lots.length) : 0

  async function shortlistLot(lot: Lot) {
    setError('')
    const response = await fetch('/api/shortlists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lotId: lot.id }) })
    const payload = await response.json()
    if (!response.ok) { setError(payload.error ?? 'Unable to shortlist this lot.'); return }
    setShortlisted((current) => new Set(current).add(lot.id))
    setNotice(`${lot.name} was added to your shortlist.`)
  }

  async function createRequest(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...requestForm, quantityTonnes: Number(requestForm.quantityTonnes), targetPricePerTonne: Number(requestForm.targetPricePerTonne) }),
    })
    const payload = await response.json()
    if (!response.ok) { setError(payload.error ?? 'Unable to create request.'); return }
    setShowRequest(false)
    setRequestForm(initialRequest)
    setNotice(`Your ${payload.data.quantityTonnes}t ${payload.data.crop.toLowerCase()} request is now open.`)
  }

  return <main className="clyden-page-bg min-h-screen overflow-x-hidden">
    <SimpleHeader role="Buyer" />
    <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-8 lg:py-12">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Procurement workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Find supply you can trust.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Search verified lots, compare landed economics, and move qualified suppliers into your buying pipeline.</p></div><button onClick={() => setShowRequest((current) => !current)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><ShoppingCart className="size-4" />Create request</button></div>

      {notice && <div className="mt-5 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"><span className="flex items-center gap-2"><Check className="size-4" />{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss message"><X className="size-4" /></button></div>}
      {error && <div className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}

      {showRequest && <form onSubmit={createRequest} className="mt-5 grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-5"><label className="text-xs font-medium text-muted-foreground">Crop<select value={requestForm.crop} onChange={(event) => setRequestForm({ ...requestForm, crop: event.target.value as RequestForm['crop'] })} className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground"><option>Sesame</option><option>Soybean</option></select></label><label className="text-xs font-medium text-muted-foreground">Quantity (tonnes)<input required min="1" type="number" value={requestForm.quantityTonnes} onChange={(event) => setRequestForm({ ...requestForm, quantityTonnes: event.target.value })} className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground" /></label><label className="text-xs font-medium text-muted-foreground">Target price / tonne<input required min="1" type="number" value={requestForm.targetPricePerTonne} onChange={(event) => setRequestForm({ ...requestForm, targetPricePerTonne: event.target.value })} className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground" /></label><label className="text-xs font-medium text-muted-foreground">Delivery location<input required value={requestForm.buyerLocation} onChange={(event) => setRequestForm({ ...requestForm, buyerLocation: event.target.value })} className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground" /></label><div className="flex items-end gap-2"><button type="submit" className="flex-1 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground">Open request</button><button type="button" onClick={() => setShowRequest(false)} className="rounded-lg border border-border p-2.5" aria-label="Close request form"><X className="size-4" /></button></div></form>}

      <div className="mt-8 grid gap-4 sm:grid-cols-3"><Stat label="Shortlisted lots" value={String(shortlisted.size).padStart(2, '0')} /><Stat label="Verified supply" value={`${verifiedSupply}t`} /><Stat label="Avg. match quality" value={`${averageMatch}%`} /></div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]"><div className="relative min-h-40 overflow-hidden rounded-2xl border border-border bg-secondary"><img src="/agrobridge-supply.png" alt="Verified agricultural produce ready for procurement" className="absolute inset-0 size-full object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/20 to-transparent" /><div className="relative max-w-sm p-5 text-primary-foreground"><p className="text-xs font-medium text-primary-foreground/70">Supply desk</p><p className="mt-1 text-lg font-semibold">Physical quality, clearer buying decisions.</p></div></div><div className="flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary/[0.045] p-5"><div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="size-5" /></div><div><p className="text-sm font-semibold">{verifiedSupply} tonnes verified</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Quality, origin, and readiness signals are attached to each lot.</p></div></div></div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row"><div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5"><Search className="size-4 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sesame, soybean, location..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></div><div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1"><SlidersHorizontal className="ml-1 size-4 text-muted-foreground" />{(['All', 'Sesame', 'Soybean'] as const).map((filter) => <button key={filter} onClick={() => setCropFilter(filter)} className={`rounded-lg px-3 py-2 text-xs font-medium ${cropFilter === filter ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>{filter}</button>)}</div></div>

      <div className="mt-5 flex flex-col gap-3">{loading && <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Loading verified supply...</div>}{!loading && visibleLots.length === 0 && <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">No available lots match this search.</div>}{visibleLots.map((lot) => <article key={lot.id} className="rounded-2xl border border-border bg-card p-5 sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-center"><div className="flex size-12 items-center justify-center rounded-xl bg-accent/25 text-accent-foreground"><ShoppingCart className="size-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{lot.name}</h2><span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">{lot.qualityScore}% match</span></div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span>{lot.quantityTonnes} tonnes</span><span className="font-semibold text-foreground">{formatNaira(lot.pricePerTonne)}/t</span><span className="inline-flex items-center gap-1"><MapPin className="size-3" />{lot.location}</span></div></div><div className="flex gap-2"><button disabled={shortlisted.has(lot.id)} onClick={() => shortlistLot(lot)} className="rounded-lg border border-border px-3 py-2 text-xs font-medium disabled:text-primary">{shortlisted.has(lot.id) ? 'Shortlisted' : 'Shortlist'}</button><button onClick={() => setSelectedLot(lot)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">Review lot <ArrowRight className="size-3" /></button></div></div><div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" />{lot.verified ? 'Identity verified' : 'Identity pending'} · Quality score {lot.qualityScore}% · Readiness {lot.readinessPercent}%</div></article>)}</div>
    </div>

    {selectedLot && <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-4 sm:items-center" onClick={() => setSelectedLot(null)}><section className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Lot review</p><h2 className="mt-2 text-xl font-semibold">{selectedLot.name}</h2></div><button onClick={() => setSelectedLot(null)} className="rounded-lg border border-border p-2" aria-label="Close lot review"><X className="size-4" /></button></div><div className="mt-6 grid grid-cols-2 gap-3 text-sm"><Detail label="Crop" value={selectedLot.crop} /><Detail label="Available" value={`${selectedLot.quantityTonnes} tonnes`} /><Detail label="Asking price" value={`${formatNaira(selectedLot.pricePerTonne)}/t`} /><Detail label="Location" value={selectedLot.location} /><Detail label="Quality score" value={`${selectedLot.qualityScore}%`} /><Detail label="Trade readiness" value={`${selectedLot.readinessPercent}%`} /></div><button disabled={shortlisted.has(selectedLot.id)} onClick={() => shortlistLot(selectedLot)} className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-70">{shortlisted.has(selectedLot.id) ? 'Already shortlisted' : 'Add to shortlist'}</button></section></div>}
  </main>
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-border bg-card p-5"><p className="text-2xl font-semibold text-primary">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div> }
function Detail({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-secondary/60 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div> }
