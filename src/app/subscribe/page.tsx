'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Plan = 'weekly' | 'monthly' | 'yearly' | 'free_trial'

const PLANS: { id: Plan; name: string; price: string; total: string; note?: string }[] = [
  { id: 'free_trial', name: 'Free trial', price: '$0 today', total: '2-day plan preview', note: 'No card needed' },
  { id: 'weekly', name: 'Weekly', price: '$4.99 / week', total: 'Billed weekly' },
  { id: 'yearly', name: 'Yearly', price: '$4.99 / month', total: '$59.88 billed yearly', note: 'Save 50%' },
  { id: 'monthly', name: 'Monthly', price: '$9.99 / month', total: 'Billed monthly' },
]

function digits(value: string) {
  return value.replace(/\D/g, '')
}

function Checkout() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session') ?? ''

  const [plan, setPlan] = useState<Plan>('free_trial')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [processing, setProcessing] = useState(false)
  const [complete, setComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedPlan = PLANS.find((item) => item.id === plan)!
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const cardDigits = digits(cardNumber)
  const validCard = cardDigits.length >= 12 && cardDigits.length <= 19
  const validExpiry = /^(0[1-9]|1[0-2])\/(\d{2})$/.test(expiry)
  const validCvc = /^\d{3,4}$/.test(cvc)
  const isFreeTrial = plan === 'free_trial'
  const canPay = Boolean(sessionId && (isFreeTrial || (validEmail && name.trim() && validCard && validExpiry && validCvc)))

  function formatCard(value: string) {
    return digits(value).slice(0, 19).replace(/(.{4})/g, '$1 ').trim()
  }

  function formatExpiry(value: string) {
    const valueDigits = digits(value).slice(0, 4)
    return valueDigits.length > 2 ? `${valueDigits.slice(0, 2)}/${valueDigits.slice(2)}` : valueDigits
  }

  async function pay() {
    if (!canPay) return
    setError(null)
    setProcessing(true)
    try {
      if (isFreeTrial) {
        router.replace(`/plan/${sessionId}`)
        return
      }

      // Email is the account identifier in this product. Card data stays in the browser;
      // this demo only calls the mock payment endpoint after local validation.
      const accountResponse = await fetch(`/api/sessions/${sessionId}/steps`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 10, data: { email } }),
      })
      if (!accountResponse.ok && accountResponse.status !== 409) {
        const body = await accountResponse.json().catch(() => ({}))
        throw new Error(body.error || 'Unable to create your account')
      }

      const paymentResponse = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, plan, idempotencyKey: crypto.randomUUID() }),
      })
      if (!paymentResponse.ok) {
        const body = await paymentResponse.json().catch(() => ({}))
        throw new Error(body.error || 'Payment could not be completed')
      }
      setComplete(true)
      window.setTimeout(() => router.replace(`/plan/${sessionId}`), 1200)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Payment could not be completed')
      setProcessing(false)
    }
  }

  if (complete) {
    return <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-green-500/15 text-green-400 flex items-center justify-center mx-auto text-3xl">✓</div>
        <h1 className="mt-5 text-2xl font-extrabold text-white">Payment confirmed</h1>
        <p className="mt-2 text-sm text-slate-400">Your full programme is now unlocked. Opening it now…</p>
      </div>
    </main>
  }

  return <main className="min-h-screen bg-slate-900 text-white">
    <header className="max-w-lg mx-auto px-4 py-5 flex items-center justify-between">
      <span className="font-bold">HealthPath</span>
      <button onClick={() => router.back()} className="text-sm text-slate-400 hover:text-white">Cancel</button>
    </header>
    <section className="max-w-lg mx-auto px-4 pb-12">
      <p className="text-orange-400 text-sm font-semibold">MOCK CHECKOUT</p>
      <h1 className="mt-1 text-3xl font-extrabold">Unlock your full programme</h1>
      <p className="mt-2 text-slate-400 text-sm">Your payment unlocks every remaining result, macro target, projection, and workout day immediately.</p>

      {!sessionId && <div className="mt-5 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">No assessment session was provided. Return to your results and try again.</div>}
      {error && <div className="mt-5 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

      <div className="mt-6 space-y-3">
        {PLANS.map((item) => <button key={item.id} type="button" onClick={() => setPlan(item.id)} className={`w-full rounded-2xl border-2 p-4 text-left transition ${plan === item.id ? 'border-orange-500 bg-orange-500/10' : 'border-slate-700 bg-slate-800'}`}>
          <div className="flex justify-between gap-3"><div><p className="font-bold">{item.name} {item.note && <span className="ml-2 rounded-full bg-orange-500 px-2 py-0.5 text-xs">{item.note}</span>}</p><p className="mt-1 text-xs text-slate-400">{item.total}</p></div><p className="font-bold text-orange-400">{item.price}</p></div>
        </button>)}
      </div>

      {!isFreeTrial && <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-800 p-5">
        <h2 className="font-bold">Payment details</h2>
        <p className="mt-1 text-xs text-slate-400">Demo only — no card details are transmitted or stored. Use any valid-looking test values.</p>
        <div className="mt-4 space-y-3">
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email address" className="checkout-input" autoComplete="email" />
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name on card" className="checkout-input" autoComplete="cc-name" />
          <input value={cardNumber} onChange={(event) => setCardNumber(formatCard(event.target.value))} inputMode="numeric" placeholder="Card number (e.g. 4242 4242 4242 4242)" className="checkout-input" autoComplete="cc-number" />
          <div className="grid grid-cols-2 gap-3"><input value={expiry} onChange={(event) => setExpiry(formatExpiry(event.target.value))} inputMode="numeric" placeholder="MM/YY" className="checkout-input" autoComplete="cc-exp" /><input value={cvc} onChange={(event) => setCvc(digits(event.target.value).slice(0, 4))} inputMode="numeric" placeholder="CVC" className="checkout-input" autoComplete="cc-csc" /></div>
        </div>
      </div>}

      <button disabled={!canPay || processing} onClick={pay} className="mt-5 w-full rounded-2xl bg-orange-500 py-4 font-bold shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500">
        {processing ? 'Confirming your selection…' : isFreeTrial ? 'Start free 2-day plan preview' : `Continue with ${selectedPlan.name}`}
      </button>
      <p className="mt-3 text-center text-xs text-slate-500">Free trial shows two workout days. Paid plans unlock the full programme.</p>
    </section>
  </main>
}

export default function SubscribePage() {
  return <Suspense fallback={<div className="min-h-screen bg-slate-900" />}><Checkout /></Suspense>
}
