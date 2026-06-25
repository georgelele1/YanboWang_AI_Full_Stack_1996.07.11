"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

const SESSION_KEY = "healthpath_session_id"

type NavItem = {
  emoji: string
  label: string
  sub: string
  href: string | null
  gradient: string
  requiresSession?: boolean
}

function sessionFromPath(pathname: string): string | null {
  const m = pathname.match(/\/(results|plan)\/([^/?#]+)/)
  return m ? m[2] : null
}

export default function AppSidebar() {
  const [open, setOpen]           = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const pathname = usePathname()
  const router   = useRouter()

  useEffect(() => {
    const fromPath = sessionFromPath(pathname)
    if (fromPath) {
      setSessionId(fromPath)
      try { localStorage.setItem(SESSION_KEY, fromPath) } catch {}
    } else {
      try {
        const stored = localStorage.getItem(SESSION_KEY)
        if (stored) setSessionId(stored)
      } catch {}
    }
  }, [pathname])

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  const handleLogout = useCallback(async () => {
    setLoggingOut(true)
    try {
      await fetch("/api/logout", { method: "POST" })
    } catch {}
    try { localStorage.removeItem(SESSION_KEY) } catch {}
    setSessionId(null)
    setOpen(false)
    setLoggingOut(false)
    router.push("/")
  }, [router])

  const mainNav: NavItem[] = [
    {
      emoji: "🏠",
      label: "Home",
      sub: "Back to start",
      href: "/",
      gradient: "from-sky-400 to-blue-500",
    },
    {
      emoji: "📊",
      label: "My Results",
      sub: "BMI, calories & macros",
      href: sessionId ? `/results/${sessionId}` : null,
      gradient: "from-violet-400 to-purple-600",
      requiresSession: true,
    },
    {
      emoji: "💪",
      label: "My Workout Plan",
      sub: "7-day schedule",
      href: sessionId ? `/plan/${sessionId}` : null,
      gradient: "from-orange-400 to-rose-500",
      requiresSession: true,
    },
    {
      emoji: "🔄",
      label: "Retake Quiz",
      sub: "Start a fresh assessment",
      href: "/quiz",
      gradient: "from-emerald-400 to-orange-600",
    },
    {
      emoji: "⭐",
      label: "Upgrade",
      sub: "Unlock your full programme",
      href: sessionId ? `/subscribe?session=${sessionId}` : "/quiz",
      gradient: "from-amber-400 to-yellow-500",
    },
  ]

  const supportNav = [
    { emoji: "❓", label: "FAQ", href: "/#faq" },
    { emoji: "📋", label: "Subscription Policy", href: "/#subscription" },
    { emoji: "💰", label: "Money-Back Policy", href: "/#refund" },
    { emoji: "🔒", label: "Privacy Policy", href: "/#privacy" },
  ]

  const avatar = sessionId ? sessionId.slice(0, 2).toUpperCase() : "HP"
  const isActive = (href: string | null) =>
    href && (pathname === href || pathname.startsWith(href + "/"))
  const onQuizPage = pathname === "/quiz"

  return (
    <>
      {/* Floating trigger */}
      {!onQuizPage && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          className="fixed top-4 right-4 z-40 w-11 h-11 rounded-full bg-slate-800 shadow-lg
                     flex items-center justify-center
                     hover:shadow-xl hover:scale-105 active:scale-95
                     transition-all duration-200 border border-slate-700"
        >
          <svg className="w-5 h-5 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm
                    transition-opacity duration-300
                    ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-80 z-50
                    bg-gradient-to-b from-slate-800 via-slate-800 to-slate-900
                    shadow-2xl flex flex-col
                    transition-transform duration-300 ease-out
                    ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-slate-700 px-5 pt-12 pb-6 overflow-hidden">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-slate-800/10 rounded-full" />
          <div className="absolute top-8 -right-10 w-20 h-20 bg-slate-800/10 rounded-full" />

          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/20 hover:bg-slate-800/30
                       flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="w-14 h-14 rounded-2xl bg-slate-800/25 backdrop-blur flex items-center justify-center mb-3
                          text-white font-extrabold text-xl shadow-inner">
            {avatar}
          </div>

          <h2 className="text-white font-extrabold text-lg leading-tight">HealthPath</h2>
          <p className="text-white/80 text-xs mt-0.5">
            {sessionId ? "Your wellness journey" : "Start your journey today"}
          </p>

          {sessionId && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-slate-800/20 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
              <span className="text-white text-xs font-medium">Plan active</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-3">Navigate</p>
          {mainNav.map((item) => {
            const disabled = item.requiresSession && !sessionId
            const active = isActive(item.href)

            if (disabled) {
              return (
                <div key={item.label}
                  className="flex items-center gap-3 px-3 py-3 rounded-2xl opacity-40 cursor-not-allowed">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-lg shrink-0`}>
                    {item.emoji}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">{item.label}</p>
                    <p className="text-xs text-slate-500 truncate">Complete quiz first</p>
                  </div>
                </div>
              )
            }

            return (
              <Link key={item.label} href={item.href!}
                className={`flex items-center gap-3 px-3 py-3 rounded-2xl
                            transition-all duration-150 group
                            ${active
                              ? "bg-orange-500/10 border border-orange-500/30"
                              : "hover:bg-slate-700 active:bg-slate-600"}`}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient}
                                flex items-center justify-center text-lg shrink-0
                                shadow-sm group-hover:scale-110 group-hover:shadow-md
                                transition-transform duration-150`}>
                  {item.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold truncate ${active ? "text-orange-400" : "text-slate-100"}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{item.sub}</p>
                </div>
                {active && <span className="w-2 h-2 rounded-full bg-orange-500/100 shrink-0" />}
              </Link>
            )
          })}

          <div className="border-t border-slate-700 my-4" />

          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-3">Support & Legal</p>
          {supportNav.map((item) => (
            <Link key={item.label} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                         text-slate-400 hover:text-slate-100 hover:bg-slate-700
                         transition-all duration-150 group">
              <span className="text-base group-hover:scale-110 transition-transform duration-150">{item.emoji}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}

          {/* Logout */}
          {sessionId && (
            <>
              <div className="border-t border-slate-700 my-4" />
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl
                           text-red-500 hover:bg-red-50 hover:text-red-600
                           transition-all duration-150 group disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-red-50 group-hover:bg-red-100
                                flex items-center justify-center text-lg shrink-0
                                transition-colors duration-150">
                  {loggingOut ? "⏳" : "🚪"}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-semibold">{loggingOut ? "Logging out..." : "Log out"}</p>
                  <p className="text-xs text-red-300">Clear session & return home</p>
                </div>
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">HealthPath v1.0</p>
            <p className="text-xs text-slate-500">Made with 💚</p>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Simulated payment · For demo purposes</p>
        </div>
      </aside>
    </>
  )
}
