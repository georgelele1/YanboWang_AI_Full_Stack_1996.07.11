'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { WorkoutDay, WorkoutPlan } from '@/types/quiz'

const INTENSITY_COLOR: Record<string, string> = {
  low:      'bg-green-900/30 text-green-400',
  moderate: 'bg-amber-100 text-amber-400',
  high:     'bg-red-100 text-red-700',
}

function ExerciseItem({ ex }: { ex: { name: string; sets: number; reps: string; rest: string; notes?: string } }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-700 last:border-0">
      <div className="w-2 h-2 rounded-full bg-orange-500/100 mt-1.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-100 text-sm">{ex.name}</p>
        {ex.notes && <p className="text-xs text-slate-500 mt-0.5">{ex.notes}</p>}
      </div>
      <div className="text-right text-xs text-slate-400 shrink-0">
        <p>{ex.sets} × {ex.reps}</p>
        <p className="text-slate-500">Rest {ex.rest}</p>
      </div>
    </div>
  )
}

function WorkoutDayCard({ day, index }: { day: WorkoutDay; index: number }) {
  const [open, setOpen] = useState(index === 0)
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 p-4 text-left"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${day.isRest ? 'bg-slate-700 text-slate-400' : 'bg-orange-500/100 text-white'}`}>
          {day.isRest ? '💤' : `D${day.day}`}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-100 text-sm">{day.dayName}</p>
          <p className="text-xs text-slate-400 truncate">{day.type}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!day.isRest && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INTENSITY_COLOR[day.intensity]}`}>
              {day.intensity}
            </span>
          )}
          <span className="text-xs text-slate-500">{day.duration}</span>
          <svg className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4">
          {day.exercises.map((ex, i) => <ExerciseItem key={i} ex={ex} />)}
          {day.tips && (
            <div className="mt-3 bg-blue-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-blue-700">💡 {day.tips}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function UpgradeBanner({ sessionId, totalDays, shown }: { sessionId: string; totalDays: number; shown: number }) {
  const router = useRouter()
  return (
    <div className="relative mt-2">

      <div className="rounded-2xl overflow-hidden relative">
        <div className="blur-sm pointer-events-none select-none opacity-60 space-y-3">
          {Array.from({ length: totalDays - shown }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/100 flex items-center justify-center text-white font-bold text-sm">
                  D{shown + i + 1}
                </div>
                <div>
                  <div className="h-3 bg-slate-700 rounded w-24 mb-1.5" />
                  <div className="h-2 bg-slate-800 rounded w-40" />
                </div>
              </div>
            </div>
          ))}
        </div>


        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent px-6 pt-12">
          <div className="text-center">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-lg font-bold text-white mb-1">
              {totalDays - shown} more days locked
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Subscribe to unlock your complete {totalDays}-day workout programme, full exercise library, and personalised nutrition plan.
            </p>
            <button
              onClick={() => router.push(`/subscribe?session=${sessionId}`)}
              className="w-full bg-orange-500/100 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-2xl text-base transition-colors shadow-lg shadow-orange-500/20"
            >
              Unlock Full Plan — 3 Days Free →
            </button>
            <p className="text-xs text-slate-500 mt-3">No credit card required. Cancel anytime.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface PlanResponse {
  access: 'full' | 'limited'
  plan: WorkoutPlan
  totalDays?: number
  message?: string
}

export default function PlanPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const [data, setData] = useState<PlanResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/plan/${sessionId}`)
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.error)
        setData(json)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="text-center">
          <p className="text-slate-400 mb-4">{error || 'Plan not found'}</p>
          <button onClick={() => router.push('/quiz')} className="text-orange-400 underline text-sm">Retake quiz</button>
        </div>
      </div>
    )
  }

  const { plan, access, totalDays = 7 } = data
  const shownDays = plan.schedule.length

  return (
    <div className="min-h-screen bg-slate-900">

      <header className="px-4 py-4 max-w-lg mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 bg-orange-500/100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </span>
          <span className="font-bold text-slate-100">HealthPath</span>
        </div>
        <button onClick={() => router.push(`/results/${sessionId}`)} className="text-sm text-slate-500 hover:text-slate-300">
          ← Results
        </button>
        <button onClick={() => router.push(`/subscription/${sessionId}`)} className="text-sm text-orange-400 hover:text-orange-300">
          Manage subscription
        </button>
      </header>

      <main className="px-4 pb-12 max-w-lg mx-auto">

        <div className="text-center py-6">
          <div className="text-4xl mb-2">🏋️</div>
          <h1 className="text-2xl font-bold text-white">Your {plan.weeks}-Week Programme</h1>
          <p className="text-slate-400 text-sm mt-1">
            {plan.daysPerWeek} sessions/week · Tailored to your goals
          </p>
        </div>


        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {plan.activityTypes.map(t => (
            <span key={t} className="bg-orange-500/15 text-orange-400 text-xs font-medium px-3 py-1 rounded-full capitalize">
              {t.replace(/_/g, ' ')}
            </span>
          ))}
        </div>


        <div className="bg-amber-900/20 border border-amber-200 rounded-2xl p-4 mb-6">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-2">Programme Tips</p>
          {plan.generalTips.map((tip, i) => (
            <p key={i} className="text-xs text-amber-300 mb-1">• {tip}</p>
          ))}
        </div>

        <button
          onClick={() => router.push(`/videos/${sessionId}`)}
          className="w-full mb-6 rounded-2xl border border-orange-500/40 bg-orange-500/10 p-4 text-left flex items-center justify-between hover:bg-orange-500/15"
        >
          <span><span className="block text-sm font-bold text-orange-400">Guided video library</span><span className="block mt-1 text-xs text-slate-400">Watch free previews or unlock the complete collection.</span></span>
          <span className="text-orange-400">→</span>
        </button>


        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-100">Weekly Schedule</h2>
          {access === 'limited' && (
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
              {shownDays} of {totalDays} days
            </span>
          )}
        </div>


        <div className="space-y-3">
          {plan.schedule.map((day, i) => (
            <WorkoutDayCard key={day.day} day={day} index={i} />
          ))}
        </div>


        {access === 'limited' && (
          <UpgradeBanner sessionId={sessionId} totalDays={totalDays} shown={shownDays} />
        )}


        {access === 'full' && (
          <div className="mt-6 bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 text-center">
            <p className="text-orange-400 text-sm font-semibold">✅ Full programme unlocked</p>
            <p className="text-orange-400 text-xs mt-1">Keep this page bookmarked for your daily workouts.</p>
          </div>
        )}
      </main>
    </div>
  )
}
