import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonError, serverError, jsonOk } from '@/lib/api-response'
import { getAuthorizedSession } from '@/lib/api-session'


export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  try {
    const sessionResult = await getAuthorizedSession(req, params.sessionId)
    if (!sessionResult.success) return jsonError(sessionResult.error, sessionResult.status)
    const session = sessionResult.session

    const now = new Date()
    const subscription = session.user?.subscription
    const isSubscriber = subscription?.status === 'ACTIVE' &&
      (!subscription.expiresAt || now < subscription.expiresAt)

    const records = await prisma.video.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    return jsonOk({
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
    return serverError('[GET /api/videos/:sessionId]', error, 'Failed to load video library')
  }
}
