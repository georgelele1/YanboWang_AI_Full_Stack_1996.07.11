'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Video = {
  id: string; title: string; description: string; category: string; durationSeconds: number
  thumbnailUrl: string; videoUrl?: string; isLocked: boolean
}

type Library = { access: 'free' | 'subscriber'; previewCount: number; videos: Video[] }

function minutes(seconds: number) {
  return `${Math.ceil(seconds / 60)} min`
}

export default function VideosPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()
  const [library, setLibrary] = useState<Library | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/videos/${sessionId}`)
      .then(async (response) => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || 'Unable to load videos')
        setLibrary(body)
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load videos'))
  }, [sessionId])

  if (error) return <main className="min-h-screen bg-slate-900 text-white grid place-items-center p-5"><div className="text-center"><p>{error}</p><button onClick={() => router.push(`/plan/${sessionId}`)} className="mt-4 text-orange-400">Back to plan</button></div></main>
  if (!library) return <main className="min-h-screen bg-slate-900 grid place-items-center"><div className="spinner w-10 h-10" /></main>

  return <main className="min-h-screen bg-slate-900 text-white pb-12">
    <header className="max-w-5xl mx-auto px-5 py-5 flex items-center justify-between">
      <button onClick={() => router.push(`/plan/${sessionId}`)} className="text-sm text-slate-400 hover:text-white">← Back to plan</button>
      <span className={`text-xs font-bold px-3 py-1 rounded-full ${library.access === 'subscriber' ? 'bg-orange-500/15 text-orange-400' : 'bg-slate-800 text-slate-400'}`}>{library.access === 'subscriber' ? 'Premium library' : `${library.previewCount} free videos`}</span>
    </header>
    <section className="max-w-5xl mx-auto px-5">
      <p className="text-orange-400 font-bold text-xs tracking-[.18em]">VIDEO LIBRARY</p>
      <h1 className="mt-2 text-4xl font-extrabold">Train with your guide</h1>
      <p className="mt-3 max-w-xl text-slate-400">Start with the free previews or unlock every guided workout with a subscription.</p>

      {selectedVideo?.videoUrl && <section className="mt-8 rounded-3xl overflow-hidden border border-slate-700 bg-black"><video className="w-full max-h-[520px]" controls autoPlay src={selectedVideo.videoUrl} /><div className="p-4"><p className="font-bold">{selectedVideo.title}</p><p className="mt-1 text-sm text-slate-400">{selectedVideo.description}</p></div></section>}

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {library.videos.map((video) => <article key={video.id} className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-800">
          <div className="relative h-48"><img src={video.thumbnailUrl} alt="" className={`h-full w-full object-cover object-top ${video.isLocked ? 'opacity-40' : ''}`} />{video.isLocked && <div className="absolute inset-0 grid place-items-center"><span className="rounded-full bg-slate-900/90 px-4 py-2 text-sm font-bold">🔒 Premium</span></div>}</div>
          <div className="p-5"><div className="flex justify-between text-xs text-orange-400"><span>{video.category}</span><span>{minutes(video.durationSeconds)}</span></div><h2 className="mt-2 font-bold text-lg">{video.title}</h2><p className="mt-2 h-10 text-sm text-slate-400">{video.description}</p>{video.isLocked ? <button onClick={() => router.push(`/subscribe?session=${sessionId}`)} className="mt-4 w-full rounded-xl border border-orange-500/60 py-3 text-sm font-bold text-orange-400">Unlock all videos</button> : <button onClick={() => setSelectedVideo(video)} className="mt-4 w-full rounded-xl bg-orange-500 py-3 text-sm font-bold">Play video</button>}</div>
        </article>)}
      </div>
    </section>
  </main>
}
