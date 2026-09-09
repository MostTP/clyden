'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertCircle,
  Bot,
  Check,
  ChevronRight,
  FileCheck2,
  Gauge,
  Leaf,
  LineChart,
  MapPin,
  Menu,
  MessageSquareText,
  PackagePlus,
  Route,
  Send,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
  X,
} from 'lucide-react'
import type { Crop, DashboardSnapshot } from '@/lib/agrobridge'

type View = 'Overview' | 'Sell smarter' | 'Buyer demand' | 'Logistics' | 'Traceability' | 'Ask the copilot' | 'Farm settings'

type DocumentRecord = {
  id: string
  lotId: string
  label: string
  complete: boolean
  status: 'needed' | 'uploaded' | 'approved'
}

const navigation: { label: View; icon: typeof Gauge }[] = [
  { label: 'Overview', icon: Gauge },
  { label: 'Sell smarter', icon: TrendingUp },
  { label: 'Buyer demand', icon: Users },
  { label: 'Logistics', icon: Truck },
  { label: 'Traceability', icon: ShieldCheck },
  { label: 'Ask the copilot', icon: MessageSquareText },
  { label: 'Farm settings', icon: Settings2 },
]

function formatNaira(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value)
}

function quantityFromInput(value: string) {
  const quantity = Number(value)
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 0
}

export default function SellerPage() {
  const router = useRouter()
  useEffect(() => {
    let active = true
    fetch('/api/auth/session', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({ data: null }))
        if (!active) return
        if (!payload.data || payload.data.role !== 'seller') {
          if (payload.data?.role === 'buyer') router.replace('/buyer')
          else if (payload.data?.role === 'admin') router.replace('/admin')
          else router.replace('/login?role=seller&next=/seller')
        }
      })
      .catch(() => {
        if (active) router.replace('/login?role=seller&next=/seller')
      })

    return () => { active = false }
  }, [router])

  const [active, setActive] = useState<View>('Overview')
  const [crop, setCrop] = useState<Crop>('Sesame')
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null)
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [prompt, setPrompt] = useState('')
  const [copilotReply, setCopilotReply] = useState('')
  const [lotForm, setLotForm] = useState({ name: '', quantityTonnes: '', pricePerTonne: '', location: '' })
  const [profile, setProfile] = useState({ name: '', farmName: '', location: '' })

  const loadWorkspace = useCallback(async () => {
    setLoading(true)
    try {
      const [dashboardResponse, documentsResponse, lotsResponse] = await Promise.all([
        fetch(`/api/dashboard?crop=${crop}`, { cache: 'no-store' }),
        fetch('/api/documents', { cache: 'no-store' }),
        fetch('/api/lots?status=available', { cache: 'no-store' }),
      ])
      const dashboardPayload = await dashboardResponse.json()
      const documentsPayload = await documentsResponse.json()
      const lotsPayload = await lotsResponse.json()
      if (!dashboardResponse.ok || !documentsResponse.ok || !lotsResponse.ok) throw new Error(dashboardPayload.error ?? documentsPayload.error ?? lotsPayload.error ?? 'Unable to load the seller workspace.')
      setSnapshot(dashboardPayload.data)
      const sellerLot = lotsPayload.data.find((lot: { sellerId: string }) => lot.sellerId === dashboardPayload.data.farmer.id) ?? lotsPayload.data[0]
      setDocuments(documentsPayload.data.filter((document: DocumentRecord) => document.lotId === sellerLot?.id))
      setProfile({ name: dashboardPayload.data.farmer.name, farmName: dashboardPayload.data.farmer.farmName, location: dashboardPayload.data.farmer.location })
      const benchmark = dashboardPayload.data.marketSignals[0]?.currentPrice
      setLotForm((current) => ({ ...current, name: sellerLot?.name ?? `${dashboardPayload.data.farmer.farmName} ${crop} Lot`, quantityTonnes: sellerLot ? String(sellerLot.quantityTonnes) : current.quantityTonnes, pricePerTonne: sellerLot ? String(sellerLot.pricePerTonne) : benchmark ? String(benchmark) : current.pricePerTonne, location: sellerLot?.location ?? dashboardPayload.data.farmer.location }))
      setError('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load the seller workspace.')
    } finally {
      setLoading(false)
    }
  }, [crop])

  useEffect(() => { void loadWorkspace() }, [loadWorkspace])

  const signal = snapshot?.marketSignals[0]
  const readinessPercent = documents.length ? Math.round((documents.filter((document) => document.complete).length / documents.length) * 100) : 0
  const quantity = quantityFromInput(lotForm.quantityTonnes)
  const askingPrice = quantityFromInput(lotForm.pricePerTonne)
  const grossRevenue = quantity * askingPrice
  const estimatedCosts = quantity * 42000
  const estimatedNet = Math.max(0, grossRevenue - estimatedCosts)

  const scenarios = useMemo(() => {
    const benchmark = signal?.currentPrice ?? askingPrice
    return [
      { name: 'Sell now', price: benchmark, costs: estimatedCosts, note: 'Immediate liquidity' },
      { name: 'Hold 3 weeks', price: Math.round(benchmark * 1.08), costs: estimatedCosts + quantity * 8000, note: 'Projected market upside' },
      { name: 'Export lot', price: Math.round(benchmark * 1.14), costs: estimatedCosts + quantity * 18000, note: 'Readiness checks required' },
    ]
  }, [askingPrice, estimatedCosts, quantity, signal?.currentPrice])

  async function createLot(event: React.FormEvent) {
    event.preventDefault()
    setWorking('lot')
    setError('')
    try {
      const response = await fetch('/api/lots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...lotForm, crop, quantityTonnes: quantity, pricePerTonne: askingPrice }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Unable to list this lot.')
      setNotice(`${payload.data.name} is now listed for buyer review.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to list this lot.')
    } finally {
      setWorking('')
    }
  }

  async function bookQuote(id: string) {
    setWorking(id)
    try {
      const response = await fetch('/api/logistics', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'booked' }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Unable to book this quote.')
      setNotice(`${payload.data.provider} has been booked.`)
      await loadWorkspace()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to book this quote.')
    } finally {
      setWorking('')
    }
  }

  async function completeDocument(id: string) {
    setWorking(id)
    try {
      const response = await fetch('/api/documents', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, complete: true }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Unable to update this document.')
      setNotice(`${payload.data.label} is ready for review.`)
      await loadWorkspace()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update this document.')
    } finally {
      setWorking('')
    }
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault()
    setWorking('profile')
    try {
      const response = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Unable to save the farm profile.')
      setNotice('Farm profile saved.')
      await loadWorkspace()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save the farm profile.')
    } finally {
      setWorking('')
    }
  }

  async function submitPrompt() {
    const question = prompt.trim()
    if (!question) return
    setWorking('copilot')
    setPrompt('')
    try {
      const response = await fetch('/api/dashboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: question }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'The copilot is unavailable.')
      setCopilotReply(payload.data.answer)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The copilot is unavailable.')
    } finally {
      setWorking('')
    }
  }

  function changeView(view: View) {
    setActive(view)
    setSidebarOpen(false)
  }

  return <div className="clyden-page-bg min-h-screen text-foreground">
    <header className="flex min-h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-8"><Link href="/" className="flex items-center gap-2 font-semibold text-primary"><span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Leaf className="size-4" /></span>CLYDEN</Link><div className="flex items-center gap-3"><span className="hidden text-xs text-muted-foreground sm:inline">Seller workspace</span><Link href="/api/auth/logout" className="text-sm font-medium text-primary">Log out</Link></div></header>
    <div className="lg:flex">
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 flex w-[min(82vw,18rem)] flex-col bg-sidebar p-4 text-sidebar-foreground shadow-xl transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:translate-x-0 lg:shadow-none`}><div className="mb-6 flex items-center justify-between lg:hidden"><span className="font-semibold">Workspace</span><button onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X className="size-5" /></button></div><nav className="flex flex-col gap-1">{navigation.map((item) => { const Icon = item.icon; return <button key={item.label} onClick={() => changeView(item.label)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${active === item.label ? 'bg-sidebar-accent font-medium text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70'}`}><Icon className="size-[17px]" />{item.label}</button> })}</nav><div className="mt-auto rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3"><p className="text-xs font-medium">{snapshot?.farmer.farmName ?? 'Kwara Farm'}</p><p className="mt-1 text-[10px] text-sidebar-foreground/55">{snapshot?.farmer.verified ? 'Verified farmer' : 'Verification pending'}</p></div></aside>
      {sidebarOpen && <button className="fixed inset-0 z-40 bg-foreground/25 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation overlay" />}

      <main className="min-w-0 flex-1"><header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-border/80 bg-background/95 px-4 backdrop-blur sm:px-8"><div className="flex min-w-0 items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="rounded-lg border border-border bg-card p-2 lg:hidden" aria-label="Open navigation"><Menu className="size-5" /></button><div><p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Seller / {active}</p><h1 className="truncate text-lg font-semibold">{active === 'Overview' ? `Good day, ${snapshot?.farmer.name?.split(' ')[0] ?? 'Amina'}` : active}</h1></div></div><div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs text-muted-foreground sm:flex"><MapPin className="size-3.5 text-primary" />{snapshot?.farmer.location ?? 'Ilorin, Kwara'}</div></header>

        <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {notice && <div className="mb-5 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"><span className="flex items-center gap-2"><Check className="size-4" />{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss message"><X className="size-4" /></button></div>}
          {error && <div className="mb-5 flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"><span className="flex items-center gap-2"><AlertCircle className="size-4" />{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><X className="size-4" /></button></div>}
          {loading && !snapshot ? <Panel><p className="text-sm text-muted-foreground">Loading farm and market data...</p></Panel> : <>
            {active === 'Overview' && <Overview snapshot={snapshot} signal={signal} crop={crop} setCrop={setCrop} readinessPercent={readinessPercent} changeView={changeView} />}
            {active === 'Sell smarter' && <SellSmarter crop={crop} setCrop={setCrop} form={lotForm} setForm={setLotForm} scenarios={scenarios} grossRevenue={grossRevenue} estimatedNet={estimatedNet} working={working} createLot={createLot} />}
            {active === 'Buyer demand' && <BuyerDemand snapshot={snapshot} crop={crop} />}
            {active === 'Logistics' && <Logistics snapshot={snapshot} working={working} bookQuote={bookQuote} />}
            {active === 'Traceability' && <Traceability documents={documents} readinessPercent={readinessPercent} working={working} completeDocument={completeDocument} />}
            {active === 'Ask the copilot' && <Copilot prompt={prompt} setPrompt={setPrompt} reply={copilotReply} working={working} submit={submitPrompt} />}
            {active === 'Farm settings' && <FarmSettings profile={profile} setProfile={setProfile} working={working} save={saveProfile} />}
          </>}
        </div>
      </main>
    </div>
  </div>
}

function Overview({ snapshot, signal, crop, setCrop, readinessPercent, changeView }: { snapshot: DashboardSnapshot | null; signal: DashboardSnapshot['marketSignals'][number] | undefined; crop: Crop; setCrop: (crop: Crop) => void; readinessPercent: number; changeView: (view: View) => void }) {
  return <><SectionTitle eyebrow="Live market intelligence" title="Your selling edge today" description="Market, buyer, logistics, and readiness data from the backend in one working view." action={<div className="flex rounded-lg border border-border bg-card p-1">{(['Sesame', 'Soybean'] as Crop[]).map((item) => <button key={item} onClick={() => setCrop(item)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${crop === item ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>{item}</button>)}</div>} />
    <section className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]"><div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8"><Activity className="size-5 text-accent" /><p className="mt-5 text-sm text-primary-foreground/70">{crop} · {signal?.region ?? 'North Central'}</p><h2 className="mt-2 max-w-xl text-2xl font-semibold sm:text-3xl">Demand is active across {snapshot?.buyers.length ?? 0} verified buyer routes.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/75">The current benchmark is {formatNaira(signal?.currentPrice ?? 0)} per tonne, moving {signal?.changePercent ?? 0}% in the latest market window.</p><button onClick={() => changeView('Sell smarter')} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground">Plan this sale <ChevronRight className="size-4" /></button></div><Panel><p className="text-xs text-muted-foreground">Current benchmark</p><p className="mt-2 text-3xl font-semibold text-primary">{formatNaira(signal?.currentPrice ?? 0)}</p><div className="mt-6 flex h-24 items-end gap-1.5">{(signal?.trend ?? []).map((height, index) => <div key={index} className="flex-1 rounded-t bg-primary/70" style={{ height: `${Math.max(16, height)}%` }} />)}</div><p className="mt-3 text-xs text-muted-foreground">Updated from the persisted dashboard signal.</p></Panel></section>
    <div className="mt-4 grid gap-4 md:grid-cols-3"><Metric icon={Users} value={String(snapshot?.buyers.length ?? 0)} label="active buyer matches" /><Metric icon={Truck} value={String(snapshot?.logistics.length ?? 0)} label="logistics quotes" /><Metric icon={FileCheck2} value={`${readinessPercent}%`} label="trade readiness" /></div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]"><Panel><div className="flex items-center justify-between"><div><h3 className="font-semibold">Best buyer matches</h3><p className="mt-1 text-xs text-muted-foreground">Ranked by fit for the selected crop</p></div><button onClick={() => changeView('Buyer demand')} className="text-xs font-medium text-primary">View all</button></div><div className="mt-5 flex flex-col gap-3">{snapshot?.buyers.slice(0, 3).map((buyer) => <BuyerRow key={buyer.id} buyer={buyer} />)}{!snapshot?.buyers.length && <p className="text-sm text-muted-foreground">No current buyer matches for {crop.toLowerCase()}.</p>}</div></Panel><Panel><div className="flex items-center gap-3"><Route className="size-5 text-primary" /><div><h3 className="font-semibold">Next movement</h3><p className="text-xs text-muted-foreground">Best available transport quote</p></div></div>{snapshot?.logistics[0] ? <div className="mt-6"><p className="text-2xl font-semibold">{formatNaira(snapshot.logistics[0].price)}</p><p className="mt-1 text-sm text-muted-foreground">{snapshot.logistics[0].provider} · {snapshot.logistics[0].durationDays}</p><button onClick={() => changeView('Logistics')} className="mt-5 w-full rounded-lg border border-border py-2.5 text-sm font-medium">Review logistics</button></div> : <p className="mt-5 text-sm text-muted-foreground">No quotes available.</p>}</Panel></div>
  </>
}

function SellSmarter({ crop, setCrop, form, setForm, scenarios, grossRevenue, estimatedNet, working, createLot }: { crop: Crop; setCrop: (crop: Crop) => void; form: { name: string; quantityTonnes: string; pricePerTonne: string; location: string }; setForm: React.Dispatch<React.SetStateAction<typeof form>>; scenarios: { name: string; price: number; costs: number; note: string }[]; grossRevenue: number; estimatedNet: number; working: string; createLot: (event: React.FormEvent) => Promise<void> }) {
  return <><SectionTitle eyebrow="Decision workspace" title="Create a market-ready lot" description="Set the quantity and asking price, compare routes, then publish the lot to buyer supply." /><div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]"><Panel><form onSubmit={createLot} className="grid gap-4"><Field label="Lot name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} /><label className="text-sm font-medium">Crop<select value={crop} onChange={(event) => setCrop(event.target.value as Crop)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"><option>Sesame</option><option>Soybean</option></select></label><div className="grid grid-cols-2 gap-3"><Field label="Quantity (tonnes)" value={form.quantityTonnes} type="number" onChange={(value) => setForm({ ...form, quantityTonnes: value })} /><Field label="Price / tonne" value={form.pricePerTonne} type="number" onChange={(value) => setForm({ ...form, pricePerTonne: value })} /></div><Field label="Pickup location" value={form.location} onChange={(value) => setForm({ ...form, location: value })} /><button disabled={working === 'lot'} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"><PackagePlus className="size-4" />{working === 'lot' ? 'Publishing...' : 'Publish lot'}</button></form></Panel><div className="grid gap-4"><Panel><h3 className="font-semibold">Route comparison</h3><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="border-b border-border text-xs text-muted-foreground"><tr><th className="pb-3 font-medium">Route</th><th className="pb-3 font-medium">Price / tonne</th><th className="pb-3 font-medium">Route costs</th><th className="pb-3 font-medium">Projected net</th></tr></thead><tbody>{scenarios.map((scenario) => <tr key={scenario.name} className="border-b border-border/70 last:border-0"><td className="py-4 font-medium">{scenario.name}<p className="mt-1 text-xs font-normal text-muted-foreground">{scenario.note}</p></td><td>{formatNaira(scenario.price)}</td><td>{formatNaira(scenario.costs)}</td><td className="font-semibold text-primary">{formatNaira(Math.max(0, Number(form.quantityTonnes) * scenario.price - scenario.costs))}</td></tr>)}</tbody></table></div></Panel><div className="grid gap-4 sm:grid-cols-2"><Metric icon={LineChart} value={formatNaira(grossRevenue)} label="gross asking value" /><Metric icon={TrendingUp} value={formatNaira(estimatedNet)} label="net after base transport" /></div></div></div></>
}

function BuyerDemand({ snapshot, crop }: { snapshot: DashboardSnapshot | null; crop: Crop }) {
  return <><SectionTitle eyebrow="Verified marketplace" title="Buyer demand" description={`Current verified demand for ${crop.toLowerCase()} from the persisted market snapshot.`} /><Panel><div className="flex flex-col gap-3">{snapshot?.buyers.map((buyer) => <BuyerRow key={buyer.id} buyer={buyer} />)}{!snapshot?.buyers.length && <p className="text-sm text-muted-foreground">No buyer demand currently matches this crop.</p>}</div></Panel></>
}

function Logistics({ snapshot, working, bookQuote }: { snapshot: DashboardSnapshot | null; working: string; bookQuote: (id: string) => Promise<void> }) {
  return <><SectionTitle eyebrow="Movement control" title="Logistics" description="Book an available route and keep the movement state attached to the persisted dashboard." /><div className="grid gap-4 md:grid-cols-2">{snapshot?.logistics.map((quote) => <Panel key={quote.id}><div className="flex items-start justify-between"><div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Truck className="size-5" /></div><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${quote.status === 'booked' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>{quote.status}</span></div><h3 className="mt-5 font-semibold">{quote.provider}</h3><p className="mt-1 text-sm text-muted-foreground">{quote.origin} → {quote.destination}</p><div className="mt-5 flex items-end justify-between"><div><p className="text-2xl font-semibold">{formatNaira(quote.price)}</p><p className="text-xs text-muted-foreground">{quote.durationDays}</p></div><button disabled={quote.status === 'booked' || working === quote.id} onClick={() => void bookQuote(quote.id)} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">{quote.status === 'booked' ? 'Booked' : 'Book quote'}</button></div></Panel>)}</div></>
}

function Traceability({ documents, readinessPercent, working, completeDocument }: { documents: DocumentRecord[]; readinessPercent: number; working: string; completeDocument: (id: string) => Promise<void> }) {
  return <><SectionTitle eyebrow="Trust layer" title="Traceability" description="Update lot documents and readiness checks before the next buyer or export handoff." /><div className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]"><Panel><ShieldCheck className="size-8 text-primary" /><p className="mt-5 text-sm text-muted-foreground">Current readiness</p><p className="mt-1 text-4xl font-semibold text-primary">{readinessPercent}%</p><div className="mt-5 h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-accent" style={{ width: `${readinessPercent}%` }} /></div></Panel><Panel><div className="grid gap-3 sm:grid-cols-2">{documents.map((document) => <div key={document.id} className="rounded-xl border border-border p-4"><div className="flex items-center justify-between"><FileCheck2 className={`size-5 ${document.complete ? 'text-primary' : 'text-muted-foreground'}`} /><span className="text-xs font-medium">{document.complete ? 'Ready' : 'Needed'}</span></div><p className="mt-4 text-sm font-medium">{document.label}</p><button disabled={document.complete || working === document.id} onClick={() => void completeDocument(document.id)} className="mt-3 text-xs font-medium text-primary disabled:text-muted-foreground">{document.complete ? 'Recorded' : 'Mark complete'}</button></div>)}</div></Panel></div></>
}

function Copilot({ prompt, setPrompt, reply, working, submit }: { prompt: string; setPrompt: (value: string) => void; reply: string; working: string; submit: () => Promise<void> }) {
  return <><SectionTitle eyebrow="Decision assistant" title="Ask the copilot" description="Use the current market and route context to get a concise next action." /><div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]"><Panel><div className="min-h-56 rounded-xl bg-secondary/60 p-4"><div className="flex gap-3"><span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground"><Bot className="size-4" /></span><div><p className="text-sm font-medium">What should we optimize today?</p><p className="mt-1 text-sm text-muted-foreground">Selling timing, buyer fit, route economics, or export readiness.</p></div></div>{reply && <div className="mt-5 rounded-xl border border-border bg-card p-4 text-sm leading-6">{reply}</div>}</div><div className="mt-4 flex gap-2"><input value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void submit() }} placeholder="Ask about your current lot..." className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none" /><button disabled={working === 'copilot'} onClick={() => void submit()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"><Send className="size-4" />Ask</button></div></Panel><Panel><h3 className="font-semibold">Suggested questions</h3><div className="mt-4 flex flex-col gap-2">{['Should I hold or sell this week?', 'Which buyer offers the best route?', 'What is missing for export readiness?'].map((question) => <button key={question} onClick={() => setPrompt(question)} className="rounded-xl border border-border p-3 text-left text-sm hover:bg-secondary">{question}</button>)}</div></Panel></div></>
}

function FarmSettings({ profile, setProfile, working, save }: { profile: { name: string; farmName: string; location: string }; setProfile: React.Dispatch<React.SetStateAction<typeof profile>>; working: string; save: (event: React.FormEvent) => Promise<void> }) {
  return <><SectionTitle eyebrow="Farm profile" title="Farm settings" description="Keep the identity and location used across listings, routes, and dashboard context current." /><Panel><form onSubmit={save} className="grid gap-4 sm:grid-cols-2"><Field label="Farmer name" value={profile.name} onChange={(value) => setProfile({ ...profile, name: value })} /><Field label="Farm name" value={profile.farmName} onChange={(value) => setProfile({ ...profile, farmName: value })} /><Field label="Primary location" value={profile.location} onChange={(value) => setProfile({ ...profile, location: value })} /><div className="flex items-end"><button disabled={working === 'profile'} className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">{working === 'profile' ? 'Saving...' : 'Save profile'}</button></div></form></Panel></>
}

function BuyerRow({ buyer }: { buyer: DashboardSnapshot['buyers'][number] }) {
  return <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center"><span className="flex size-10 items-center justify-center rounded-xl bg-accent/25 text-accent-foreground"><ShoppingCart className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{buyer.name}</p><span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">{buyer.matchPercent}% match</span></div><p className="mt-1 text-xs text-muted-foreground">{buyer.quantityTonnes}t {buyer.crop.toLowerCase()} · {buyer.distanceKm} km · {formatNaira(buyer.pricePerTonne)}/t</p></div><span className="inline-flex items-center gap-1 text-xs font-medium text-primary"><ShieldCheck className="size-3.5" />{buyer.verified ? 'Verified' : 'Pending'}</span></div>
}

function SectionTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p></div>{action}</div>
}

function Panel({ children }: { children: React.ReactNode }) { return <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_oklch(0.22_0.035_158/0.03)] sm:p-6">{children}</section> }

function Metric({ icon: Icon, value, label }: { icon: typeof Users; value: string; label: string }) { return <div className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><p className="text-2xl font-semibold text-primary">{value}</p><Icon className="size-5 text-primary" /></div><p className="mt-2 text-xs text-muted-foreground">{label}</p></div> }

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="text-sm font-medium">{label}<input required type={type} min={type === 'number' ? '1' : undefined} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/20 focus:ring-2" /></label> }
