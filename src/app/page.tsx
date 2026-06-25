import Link from 'next/link'

const benefits = [
  ['Personalised guide', 'Your targets, workouts and milestones in one simple plan.'],
  ['Built for real life', 'Preferences shape the routine, so it is easier to keep going.'],
  ['Clear next steps', 'Understand what to do today, this week and on the way to your goal.'],
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fcfbf8] text-[#2d241e] overflow-hidden">
      <nav className="mx-auto max-w-6xl px-5 py-5 flex items-center justify-between">
        <span className="font-extrabold tracking-[-0.06em] text-2xl">HealthPath</span>
        <Link href="/quiz?fresh=1" className="rounded-full border border-[#d9d0c5] px-5 py-2.5 text-sm font-bold hover:bg-[#f2eee8]">Start your guide</Link>
      </nav>

      <section className="mx-auto max-w-6xl px-5 pt-12 pb-20 grid lg:grid-cols-[1.05fr_.95fr] gap-14 items-center">
        <div className="max-w-xl">
          <p className="text-xs font-bold tracking-[0.2em] text-[#9a7556]">YOUR WELLNESS, MADE PERSONAL</p>
          <h1 className="mt-4 text-5xl md:text-7xl font-extrabold tracking-[-0.07em] leading-[0.9]">A health plan that fits your life.</h1>
          <p className="mt-7 text-lg leading-relaxed text-[#6d6259] max-w-lg">HealthPath turns a few thoughtful questions into a practical fitness and nutrition guide — built around your body, your goals and the movement you enjoy.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/quiz?fresh=1" className="rounded-full bg-[#34271f] px-7 py-4 text-sm font-bold text-white hover:bg-[#4b382c]">Create my guide →</Link>
            <a href="#how-it-works" className="rounded-full px-7 py-4 text-sm font-bold hover:bg-[#f2eee8]">How it works</a>
          </div>
          <p className="mt-5 text-xs text-[#8a7e72]">No account needed to begin · Takes about two minutes</p>
        </div>

        <div className="relative mx-auto w-full max-w-md h-[440px] rounded-[2.5rem] bg-[#eee9e1]">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 z-10 w-60 overflow-hidden rounded-[2rem] border-[8px] border-[#34271f] bg-white shadow-[0_25px_50px_rgba(52,39,31,.24)]">
            <div className="px-5 pt-5 pb-3"><p className="text-[10px] font-bold tracking-wider text-[#9a7556]">HEALTHPATH GUIDE</p><p className="mt-1 text-lg font-extrabold">Your weekly plan</p></div>
            <img src="/female30-39.png" alt="HealthPath fitness guide preview" className="h-56 w-full object-cover object-top" />
            <div className="p-4"><div className="h-2.5 rounded-full bg-[#e8e1d8]" /><div className="mt-2 h-2.5 w-3/5 rounded-full bg-[#f2eee8]" /></div>
          </div>
          <div className="absolute -left-3 bottom-12 w-32 overflow-hidden rounded-[1.7rem] border-[5px] border-[#fffdf9] bg-white shadow-xl rotate-[-9deg]"><img src="/female18-29.png" alt="Fitness preview" className="h-44 w-full object-cover object-top" /></div>
          <div className="absolute -right-3 bottom-4 w-32 overflow-hidden rounded-[1.7rem] border-[5px] border-[#fffdf9] bg-white shadow-xl rotate-[8deg]"><img src="/male40-49.png" alt="Fitness preview" className="h-44 w-full object-cover object-top" /></div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-[#ebe5dd] bg-white/60">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="text-xs font-bold tracking-[0.2em] text-[#9a7556]">WHY HEALTHPATH</p>
          <h2 className="mt-3 max-w-lg text-4xl font-extrabold tracking-[-0.055em]">Less confusion. More momentum.</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {benefits.map(([title, copy], index) => <article key={title} className="rounded-3xl border border-[#e8e1d8] bg-[#fffdf9] p-6"><p className="text-sm font-bold text-[#9a7556]">0{index + 1}</p><h3 className="mt-7 text-xl font-extrabold tracking-[-0.03em]">{title}</h3><p className="mt-3 text-sm leading-relaxed text-[#73675c]">{copy}</p></article>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-20 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-[-0.06em]">Ready for a clearer path forward?</h2>
        <Link href="/quiz?fresh=1" className="inline-block mt-7 rounded-full bg-[#34271f] px-8 py-4 text-sm font-bold text-white hover:bg-[#4b382c]">Start your personalised guide →</Link>
      </section>
    </main>
  )
}
