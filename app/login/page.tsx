'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Leaf, LockKeyhole } from 'lucide-react'

type Role = 'seller' | 'buyer' | 'admin'

export default function LoginPage() {
  const [role, setRole] = useState<Role>('seller')
  const [nextPath, setNextPath] = useState('')
  const [password, setPassword] = useState('')
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requestedRole = params.get('role')
    if (requestedRole === 'buyer' || requestedRole === 'admin' || requestedRole === 'seller') setRole(requestedRole)
    setNextPath(params.get('next') ?? '')
  }, [])

  async function login(event: React.FormEvent) {
    event.preventDefault()
    setWorking(true)
    setError('')
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role, password }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Unable to log in.')
      window.location.href = nextPath.startsWith(`/${role}`) ? nextPath : `/${role}`
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to log in.')
    } finally {
      setWorking(false)
    }
  }

  return <main className="clyden-page-bg flex min-h-screen items-center justify-center px-4 py-10"><section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8"><Link href="/" className="flex items-center gap-2 font-semibold text-primary"><span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Leaf className="size-5" /></span>CLYDEN</Link><div className="mt-8"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><LockKeyhole className="size-5" /></span><h1 className="mt-5 text-2xl font-semibold">Open your workspace</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Choose the role assigned to you and enter its password.</p></div><form onSubmit={login} className="mt-7 grid gap-4"><label className="text-sm font-medium">Role<select value={role} onChange={(event) => setRole(event.target.value as Role)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"><option value="seller">Seller</option><option value="buyer">Buyer</option><option value="admin">Admin</option></select></label><label className="text-sm font-medium">Password<input autoFocus required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/20 focus:ring-2" /></label>{error && <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">{error}</p>}<button disabled={working} className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">{working ? 'Signing in...' : `Continue as ${role}`}</button></form>{process.env.NODE_ENV !== 'production' && <div className="mt-6 rounded-xl bg-secondary/70 p-4 text-xs leading-5 text-muted-foreground"><p className="font-medium text-foreground">Local development credentials</p><p>seller123 · buyer123 · admin123</p></div>}</section></main>
}
