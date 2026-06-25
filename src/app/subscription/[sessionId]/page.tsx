'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function SubscriptionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cancel() {
    if (!window.confirm('Cancel your trial or subscription? Full content will be locked immediately.')) return
    setLoading(true); setError(null)
    try {
      const response = await fetch('/api/subscription/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Unable to cancel')
      setCancelled(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to cancel')
    } finally { setLoading(false) }
  }

  return <main className="min-h-screen bg-slate-900 text-white p-5">
    <section className="mx-auto max-w-md pt-16">
      <button onClick={() => router.push(`/plan/${sessionId}`)} className="text-sm text-slate-400">← Back to plan</button>
      <h1 className="mt-8 text-3xl font-extrabold">Manage subscription</h1>
      {cancelled ? <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-800 p-5"><p className="font-bold text-green-400">Subscription cancelled</p><p className="mt-2 text-sm text-slate-400">You will not be charged. Your premium content is now locked.</p><button onClick={() => router.push(`/results/${sessionId}`)} className="mt-5 text-orange-400 font-bold">Back to results →</button></div> : <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-800 p-5"><p className="font-bold">3-day free trial</p><p className="mt-2 text-sm leading-relaxed text-slate-400">Cancel before the trial ends to avoid a mock renewal charge. Cancellation takes effect immediately in this demo.</p>{error && <p className="mt-3 text-sm text-red-400">{error}</p>}<button disabled={loading} onClick={cancel} className="mt-6 w-full rounded-xl border border-red-500/60 py-3 text-sm font-bold text-red-400 disabled:opacity-50">{loading ? 'Cancelling…' : 'Cancel trial / subscription'}</button></div>}
    </section>
  </main>
}
