'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { FreeResultsResponse, FullResultsResponse, ResultsResponse } from '@/types/quiz'

// ─────────────────────────────────────────────────────────────────────────────
// BMI Gauge
// ─────────────────────────────────────────────────────────────────────────────

function BmiGauge({ bmi, category }: { bmi: number; category: string }) {
  // Map BMI 15–40 to 0–100%
  const pct = Math.min(100, Math.max(0, ((bmi - 15) / 25) * 100))
  const colors: Record<string, string> = {
    Underweight: 'text-blue-600',
    Normal: 'text-green-400',
    Overweight: 'text-yellow-600',
    Obese: 'text-red-600',
  }

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm p-5">
      <div className="flex justify-between items-baseline mb-2">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">Your BMI</h3>
        <span className={`text-2xl font-extrabold ${colors[category] ?? 'text-slate-100'}`}>{bmi}</span>
      </div>
      <div className="h-3 rounded-full bmi-track mb-1.5" />
      <div className="relative h-0">
        <div
          className="absolute -top-5 -translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full border-2 border-slate-900 shadow"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-3">
        <span>Underweight</span><span>Normal</span><span>Overweight</span><span>Obese</span>
      </div>
      <p className="mt-3 text-center font-semibold text-slate-200">
        Category: <span className={colors[category] ?? ''}>{category}</span>
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Macro donut (simple CSS trick)
// ─────────────────────────────────────────────────────────────────────────────

function MacroCard({
  proteinGrams, carbGrams, fatGrams, dailyCalories,
}: {
  proteinGrams: number
  carbGrams: number
  fatGrams: number
  dailyCalories: number
}) {
  const total = proteinGrams * 4 + carbGrams * 4 + fatGrams * 9
  const pPct = Math.round((proteinGrams * 4 / total) * 100)
  const cPct = Math.round((carbGrams * 4 / total) * 100)
  const fPct = 100 - pPct - cPct

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm p-5">
      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Daily Macros</h3>
      <div className="text-center mb-4">
        <p className="text-4xl font-extrabold text-white">{dailyCalories}</p>
        <p className="text-sm text-slate-400">calories / day</p>
      </div>
      <div className="flex gap-3">
        {[
          { label: 'Protein', grams: proteinGrams, pct: pPct, color: 'bg-blue-500' },
          { label: 'Carbs',   grams: carbGrams,   pct: cPct, color: 'bg-orange-400' },
          { label: 'Fat',     grams: fatGrams,    pct: fPct, color: 'bg-yellow-400' },
        ].map((m) => (
          <div key={m.label} className="flex-1 bg-slate-800/80 rounded-xl p-3 text-center">
            <div className={`w-3 h-3 ${m.color} rounded-full mx-auto mb-1`} />
            <p className="text-lg font-bold text-slate-100">{m.grams}g</p>
            <p className="text-xs text-slate-400">{m.label}</p>
            <p className="text-xs text-slate-500">{m.pct}%</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Timeline chart (SVG line chart)
// ─────────────────────────────────────────────────────────────────────────────

function TimelineChart({
  projection, targetDate,
}: {
  projection: { week: number; weightKg: number }[]
  targetDate: string
}) {
  if (!projection.length) return null

  const W = 320
  const H = 160
  const PAD = { top: 10, right: 10, bottom: 30, left: 40 }

  const weights = projection.map((p) => p.weightKg)
  const minW = Math.min(...weights) - 1
  const maxW = Math.max(...weights) + 1
  const maxWeek = projection[projection.length - 1].week

  const xScale = (week: number) =>
    PAD.left + ((week / maxWeek) * (W - PAD.left - PAD.right))
  const yScale = (w: number) =>
    PAD.top + ((maxW - w) / (maxW - minW)) * (H - PAD.top - PAD.bottom)

  const pathD = projection
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.week)} ${yScale(p.weightKg)}`)
    .join(' ')

  const areaD = pathD + ` L ${xScale(maxWeek)} ${H - PAD.bottom} L ${PAD.left} ${H - PAD.bottom} Z`

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm p-5">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">Weight Timeline</h3>
        <div className="text-right">
          <p className="text-xs text-slate-500">Goal date</p>
          <p className="text-sm font-semibold text-orange-400">
            {new Date(targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        {/* Area fill */}
        <path d={areaD} fill="url(#chartGradient)" opacity="0.3" />
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Line */}
        <path d={pathD} stroke="#22c55e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* X axis */}
        <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom}
          stroke="#e5e7eb" strokeWidth="1" />
        {/* Y labels */}
        {[minW + 1, maxW - 1].map((w) => (
          <text key={w} x={PAD.left - 4} y={yScale(w) + 4} textAnchor="end"
            fontSize="10" fill="#9ca3af">{Math.round(w)}</text>
        ))}
        {/* X labels */}
        {[0, Math.round(maxWeek / 2), maxWeek].map((wk) => (
          <text key={wk} x={xScale(wk)} y={H - PAD.bottom + 16} textAnchor="middle"
            fontSize="10" fill="#9ca3af">w{wk}</text>
        ))}
        {/* End dot */}
        <circle
          cx={xScale(projection[projection.length - 1].week)}
          cy={yScale(projection[projection.length - 1].weightKg)}
          r="4" fill="#22c55e"
        />
      </svg>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Paywall overlay
// ─────────────────────────────────────────────────────────────────────────────

function PaywallBanner({
  sessionId,
}: {
  sessionId: string
}) {
  const router = useRouter()
  const loading = false
  // Kept only for the visual plan preview; checkout itself lives at /subscribe.
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly')
  const [email, setEmail] = useState('')
  const [needsEmail] = useState(false)
  const [bannerError] = useState<string | null>(null)
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  return (
    <div className="bg-gradient-to-b from-slate-900/0 via-slate-900/90 to-slate-900 absolute inset-x-0 bottom-0 flex flex-col items-center pb-4 pt-24">
      <div className="bg-slate-800 border border-slate-700 shadow-2xl rounded-3xl p-6 w-full max-w-sm mx-4">
        <div className="text-center mb-5">
          <span className="text-3xl">🔓</span>
          <h3 className="text-xl font-extrabold text-white mt-2">Unlock Your Full Plan</h3>
          <p className="text-slate-400 text-sm mt-1">
            Get your complete macro breakdown, personalised meal guidance, and week-by-week weight projection.
          </p>
        </div>

        {bannerError && (
          <div className="mb-3 bg-red-900/20 border border-red-800 text-red-400 text-xs px-3 py-2 rounded-xl">
            {bannerError}
          </div>
        )}

        {/* Email capture (shown only when needed) */}
        {needsEmail && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-200 mb-1.5">
              Enter your email to create your account
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              className="w-full px-3 py-2.5 border-2 border-slate-700 bg-slate-900 rounded-xl text-sm text-white
                focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        )}

        {/* Plan selector */}
        <div className="flex gap-2 mb-4">
          {(['monthly', 'yearly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlan(p)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all
                ${plan === p ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-slate-700 text-slate-400'}`}
            >
              <div>{p === 'monthly' ? '📅 Monthly' : '⭐ Yearly'}</div>
              <div className="font-bold mt-0.5">{p === 'monthly' ? '$9.99/mo' : '$4.99/mo'}</div>
            </button>
          ))}
        </div>
        {plan === 'yearly' && (
          <p className="text-center text-xs text-orange-400 font-medium mb-3">🎉 Save 50% with yearly</p>
        )}

        <button
          onClick={() => router.push(`/subscribe?session=${sessionId}`)}
          disabled={loading || (needsEmail && !isValidEmail)}
          className="w-full bg-orange-500/100 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-4 rounded-2xl
            shadow-lg shadow-orange-500/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><div className="spinner w-5 h-5 border-white/30 border-t-white" /> Processing…</>
          ) : (
            `Start ${plan === 'yearly' ? 'Yearly' : 'Monthly'} Plan →`
          )}
        </button>

        <div className="mt-4 flex items-center justify-center gap-3 text-xs text-slate-500">
          <span>✅ Cancel anytime</span>
          <span>·</span>
          <span>🔒 Secure</span>
          <span>·</span>
          <span>💯 Money-back</span>
        </div>
        <p className="mt-3 text-center text-xs text-slate-500">(Demo — no real payment processed)</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Results Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()
  const [results, setResults] = useState<ResultsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchResults() {
    try {
      const res = await fetch(`/api/results/${sessionId}`)
      if (res.status === 404) {
        router.replace('/quiz')
        return
      }
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error || 'Failed to fetch results')
      }
      setResults(await res.json())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (sessionId) fetchResults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="spinner w-10 h-10" />
          <p className="text-slate-400 text-sm">Loading your results…</p>
        </div>
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="text-center">
          <p className="text-slate-300 mb-4">{error ?? 'Something went wrong.'}</p>
          <button onClick={() => router.push('/quiz')}
            className="bg-orange-500/100 text-white px-6 py-3 rounded-xl font-semibold">
            Retake Quiz
          </button>
        </div>
      </div>
    )
  }

  const isFull = results.access === 'full'
  const fullData = isFull ? (results as FullResultsResponse) : null
  const hasPaidSubscription = fullData?.accessReason === 'subscribed'

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-orange-500/100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </span>
            <span className="font-bold text-slate-100">HealthPath</span>
          </div>
          {isFull && (
            <span className={`subscription-status ${hasPaidSubscription ? 'is-paid' : 'is-trial'} bg-orange-500/15 text-orange-400 text-xs font-semibold px-3 py-1 rounded-full`}>
              ✓ Premium Active
            </span>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">
        {/* Headline */}
        <div>
          <h1 className="text-2xl font-extrabold text-white">Your Health Assessment</h1>
          <p className="text-slate-400 text-sm mt-1">
            Based on the Mifflin-St Jeor formula and ACSM activity guidelines.
          </p>
        </div>

        {/* BMI */}
        <BmiGauge bmi={results.bmi} category={results.bmiCategory} />

        {/* Daily calories teaser (always visible) */}
        <div className="bg-orange-500/100 text-white rounded-2xl p-5 shadow-lg shadow-orange-500/30">
          <p className="text-orange-200 text-sm font-medium mb-1">Your daily calorie target</p>
          <p className="text-5xl font-extrabold">{results.dailyCalories}</p>
          <p className="text-orange-200 text-sm mt-1">calories / day</p>
        </div>

        {/* Full content or blurred paywall */}
        {isFull && fullData ? (
          <>
            <MacroCard
              proteinGrams={fullData.proteinGrams}
              carbGrams={fullData.carbGrams}
              fatGrams={fullData.fatGrams}
              dailyCalories={fullData.dailyCalories}
            />

            <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm p-5">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">Timeline</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/80 rounded-xl p-3 text-center">
                  <p className="text-2xl font-extrabold text-white">{fullData.weeksToGoal}</p>
                  <p className="text-xs text-slate-400">
                    {fullData.goal === 'improve_health' || (fullData.goal === 'tone_up' && fullData.weeklyWeightLossForecast === 0)
                      ? 'week program'
                      : fullData.goal === 'build_strength' && fullData.weeklyWeightLossForecast <= 0
                      ? 'weeks to target'
                      : 'weeks to goal'}
                  </p>
                </div>
                <div className="bg-slate-800/80 rounded-xl p-3 text-center">
                  {fullData.weeklyWeightLossForecast === 0 ? (
                    <>
                      <p className="text-2xl font-extrabold text-white">--</p>
                      <p className="text-xs text-slate-400">maintenance plan</p>
                    </>
                  ) : fullData.weeklyWeightLossForecast < 0 ? (
                    <>
                      <p className="text-2xl font-extrabold text-white">
                        +{Math.abs(fullData.weeklyWeightLossForecast).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-400">kg / week gained</p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-extrabold text-white">
                        {fullData.weeklyWeightLossForecast.toFixed(1)}
                      </p>
                      <p className="text-xs text-slate-400">kg / week lost</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <TimelineChart
              projection={fullData.weeklyProjection}
              targetDate={fullData.targetDate}
            />

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-2xl p-5">
              <h3 className="font-bold text-white mb-1">🎯 Next steps</h3>
              <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                <li>Log meals daily using MyFitnessPal or Cronometer</li>
                <li>Aim for {fullData.proteinGrams}g protein spread across 3–4 meals</li>
                <li>Weigh yourself weekly, same time of day</li>
                <li>Adjust calories by ±100 kcal after 2 weeks if no change</li>
              </ul>
            </div>

            <button
              onClick={() => router.push(`/plan/${sessionId}`)}
              className="w-full rounded-2xl bg-orange-500 py-4 font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600"
            >
              View your 7-day workout programme →
            </button>
          </>
        ) : (
          // Blurred preview when limited
          <div>
            <div className="relative rounded-2xl overflow-hidden">
              <div className="blur-sm pointer-events-none opacity-50 space-y-4">
                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
                  <div className="h-4 bg-slate-700 rounded w-1/2 mb-3" />
                  <div className="h-3 bg-slate-800 rounded w-full mb-2" />
                  <div className="h-3 bg-slate-800 rounded w-3/4" />
                </div>
                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
                  <div className="h-32 bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white" />
            </div>
            <PaywallBanner sessionId={sessionId} />
          </div>
        )}
    </main>
    </div>
  )
}
