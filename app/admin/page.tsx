'use client'

import { useCallback, useEffect, useState } from 'react'
import { Activity, Check, CheckCircle2, Leaf, ShieldAlert, Truck, Users, X } from 'lucide-react'
import { SimpleHeader } from '../landing'

type ReviewItem = {
  id: string
  type: 'buyer_verification' | 'quality_record' | 'delivery_exception'
  label: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

type AdminData = {
  stats: { activeFarmers: number; lotsInNetwork: number; shipmentsMoving: number; needsReview: number }
  reviews: ReviewItem[]
  activity: { id: string; message: string; createdAt: string }[]
}

const emptyData: AdminData = { stats: { activeFarmers: 0, lotsInNetwork: 0, shipmentsMoving: 0, needsReview: 0 }, reviews: [], activity: [] }

const reviewLabels: Record<ReviewItem['type'], string> = {
  buyer_verification: 'Buyer verification',
  quality_record: 'Lot quality record',
  delivery_exception: 'Delivery exception',
}

export default function AdminPage() {
  const [data, setData] = useState<AdminData>(emptyData)
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState('')
  const [error, setError] = useState('')

  const loadAdmin = useCallback(async () => {
    try {
      const response = await fetch('/api/admin', { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Unable to load operations data.')
      setData(payload.data)
      setError('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load operations data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadAdmin() }, [loadAdmin])

  async function decideReview(id: string, status: 'approved' | 'rejected') {
    setWorkingId(id)
    try {
      const response = await fetch('/api/admin', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Unable to update this review.')
      await loadAdmin()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update this review.')
    } finally {
      setWorkingId('')
    }
  }

  const pendingReviews = data.reviews.filter((review) => review.status === 'pending')

  return <main className="clyden-page-bg min-h-screen overflow-x-hidden">
    <SimpleHeader role="Admin" />
    <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-8 lg:py-12">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Operations control</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Keep the network moving.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Monitor marketplace health, verification queues, active shipments, and platform trust signals.</p></div><button onClick={() => void loadAdmin()} className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium">Refresh data</button></div>

      {error && <div className="mt-5 flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><X className="size-4" /></button></div>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat icon={Users} label="Active farmers" value={data.stats.activeFarmers.toLocaleString()} /><Stat icon={Leaf} label="Lots in network" value={String(data.stats.lotsInNetwork)} /><Stat icon={Truck} label="Shipments moving" value={String(data.stats.shipmentsMoving)} /><Stat icon={ShieldAlert} label="Needs review" value={String(data.stats.needsReview)} /></div>

      <div className="mb-5 mt-8 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]"><div className="relative min-h-40 overflow-hidden rounded-2xl border border-border bg-secondary"><img src="/agrobridge-supply.png" alt="Agricultural warehouse supply network" className="absolute inset-0 size-full object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-foreground/75 to-foreground/10" /><div className="relative max-w-sm p-5 text-primary-foreground"><p className="text-xs text-primary-foreground/70">Network operations</p><p className="mt-1 text-lg font-semibold">Every handoff is a signal.</p><p className="mt-2 text-xs leading-5 text-primary-foreground/70">Keep verification, movement, and marketplace trust visible.</p></div></div><div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5"><div className="flex size-10 items-center justify-center rounded-xl bg-accent/25 text-accent-foreground"><Leaf className="size-5" /></div><div><p className="text-sm font-semibold">Healthy network coverage</p><p className="mt-1 text-xs leading-5 text-muted-foreground">18 markets are reporting active signals today.</p></div></div></div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]"><section className="rounded-2xl border border-border bg-card p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Platform activity</h2><p className="mt-1 text-xs text-muted-foreground">Last 30 days across the marketplace</p></div><Activity className="size-5 text-primary" /></div><div className="mt-8 flex h-48 items-end gap-2 sm:gap-3">{[34, 48, 42, 65, 58, 75, 61, 82, 72, 90, 78, 96].map((height, index) => <div key={index} className="flex flex-1 flex-col justify-end gap-2"><div className="rounded-t-md bg-primary/80" style={{ height: `${height}%` }} /><span className="text-center text-[10px] text-muted-foreground">{index + 1}</span></div>)}</div></section>
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6"><h2 className="font-semibold">Review queue</h2><p className="mt-1 text-xs text-muted-foreground">Items needing an admin decision</p><div className="mt-5 flex flex-col gap-3">{loading && <p className="text-sm text-muted-foreground">Loading review queue...</p>}{!loading && pendingReviews.length === 0 && <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-4 text-sm text-primary"><CheckCircle2 className="size-4" />All review items are cleared.</div>}{pendingReviews.map((review) => <div key={review.id} className="rounded-xl border border-border p-3"><p className="text-xs text-muted-foreground">{reviewLabels[review.type]}</p><p className="mt-1 text-sm font-medium">{review.label}</p><div className="mt-3 flex gap-2"><button disabled={workingId === review.id} onClick={() => void decideReview(review.id, 'approved')} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60"><Check className="size-3.5" />Approve</button><button disabled={workingId === review.id} onClick={() => void decideReview(review.id, 'rejected')} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium disabled:opacity-60"><X className="size-3.5" />Reject</button></div></div>)}</div></section></div>

      <section className="mt-4 rounded-2xl border border-border bg-card p-5 sm:p-6"><div><h2 className="font-semibold">Recent operations</h2><p className="mt-1 text-xs text-muted-foreground">A concise audit view of network activity</p></div><div className="mt-5 flex flex-col gap-3">{data.activity.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl bg-secondary/60 p-3 text-sm"><CheckCircle2 className="size-4 shrink-0 text-primary" /><span>{item.message}</span><time className="ml-auto hidden whitespace-nowrap text-xs text-muted-foreground sm:inline" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</time></div>)}</div></section>
    </div>
  </main>
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) { return <div className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><p className="text-2xl font-semibold">{value}</p><Icon className="size-5 text-primary" /></div><p className="mt-2 text-xs text-muted-foreground">{label}</p></div> }
