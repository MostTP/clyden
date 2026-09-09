'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Leaf, UserPlus } from 'lucide-react'

type Role = 'seller' | 'buyer'

export default function RegisterPage() {
  const [role, setRole] = useState<Role>('buyer')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)

  async function register(event: React.FormEvent) {
    event.preventDefault()
    setWorking(true)
    setError('')
    try {
      const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role, displayName, email, password }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Unable to create account.')
      window.location.href = `/${role}`
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create account.')
    } finally {
      setWorking(false)
    }
  }

  return <main className="clyden-page-bg flex min-h-screen items-center justify-center px-4 py-10"><section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8"><Link href="/" className="flex items-center gap-2 font-semibold text-primary"><span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Leaf className="size-5" /></span>CLYDEN</Link><div className="mt-8"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserPlus className="size-5" /></span><h1 className="mt-5 text-2xl font-semibold">Create your account</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Create a buyer or seller account to keep your marketplace activity connected to you.</p></div><form onSubmit={register} className="mt-7 grid gap-4"><label className="text-sm font-medium">Account type<select value={role} onChange={(event) => setRole(event.target.value as Role)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"><option value="buyer">Buyer</option><option value="seller">Seller</option></select></label><label className="text-sm font-medium">Name<input required value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" /></label><label className="text-sm font-medium">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" /></label><label className="text-sm font-medium">Password<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" /></label>{error && <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">{error}</p>}<button disabled={working} className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">{working ? 'Creating account...' : 'Create account'}</button></form><p className="mt-5 text-center text-sm text-muted-foreground">Already have an account? <Link href="/login" className="font-semibold text-primary">Sign in</Link></p></section></main>
}