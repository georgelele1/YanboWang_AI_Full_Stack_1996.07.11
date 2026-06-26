import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonError, serverError, jsonOk, readBody } from '@/lib/api-response'
import { getAuthorizedSession } from '@/lib/api-session'

export async function POST(req: NextRequest) {
  try {
    const { sessionId, reason } = await readBody<{ sessionId?: string; reason?: string }>(req)
    if (!sessionId) return jsonError('sessionId is required', 400)

    const sessionResult = await getAuthorizedSession(req, sessionId)
    if (!sessionResult.success) return jsonError(sessionResult.error, sessionResult.status)
    const session = sessionResult.session

    if (!session.user?.subscription) {
      return jsonError('No subscription to cancel', 404)
    }

    const subscription = session.user.subscription
    if (subscription.status === 'CANCELLED') {
      return jsonOk({ success: true, status: 'CANCELLED', alreadyCancelled: true })
    }

    await prisma.subscription.update({
      where: { userId: session.user.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason?.trim() || 'user_requested',
      },
    })
    return jsonOk({ success: true, status: 'CANCELLED' })
  } catch (error) {
    return serverError('[POST /api/subscription/cancel]', error, 'Unable to cancel subscription')
  }
}
