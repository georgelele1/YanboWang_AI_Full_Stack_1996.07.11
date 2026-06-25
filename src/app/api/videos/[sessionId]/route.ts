import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hasSessionAccess } from '@/lib/session-access'

/**
 * Video-library access is intentionally stricter than plan/result access:
 * a free trial can use the product, but only ACTIVE paid subscriptions receive
 * every playback URL. Everyone else can watch the curated preview videos.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: params.sessionId },
      include: { user: { include: { subscription: true } } },
    })

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (!hasSessionAccess(req, session.id, session.accessTokenHash)) {
      return NextResponse.json({ error: 'Session access denied' }, { status: 401 })
    }

    const now = new Date()
    const subscription = session.user?.subscription
    const isSubscriber = subscription?.status === 'ACTIVE' &&
      (!subscription.expiresAt || now < subscription.expiresAt)

    const records = await prisma.video.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json({
      access: isSubscriber ? 'subscriber' : 'free',
      previewCount: records.filter((video) => video.isFreePreview).length,
      videos: records.map((video) => ({
        id: video.id,
        slug: video.slug,
        title: video.title,
        description: video.description,
        category: video.category,
        durationSeconds: video.durationSeconds,
        thumbnailUrl: video.thumbnailUrl,
        isLocked: !isSubscriber && !video.isFreePreview,
        ...(isSubscriber || video.isFreePreview ? { videoUrl: video.videoUrl } : {}),
      })),
    })
  } catch (error) {
    console.error('[GET /api/videos/:sessionId]', error)
    return NextResponse.json({ error: 'Failed to load video library' }, { status: 500 })
  }
}
