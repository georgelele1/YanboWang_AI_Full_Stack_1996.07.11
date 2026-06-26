

import { NextRequest } from 'next/server'
import { jsonError, serverError, jsonOk } from '@/lib/api-response'
import { getAuthorizedSession } from '@/lib/api-session'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const sessionResult = await getAuthorizedSession(req, params.id)
    if (!sessionResult.success) return jsonError(sessionResult.error, sessionResult.status)
    const session = sessionResult.session

    const sub = session.user?.subscription ?? null

    return jsonOk({
      id: session.id,
      currentStep: session.currentStep,
      version: session.version,
      isCompleted: session.isCompleted,
      quizData: session.quizData,
      subscription: sub ? { status: sub.status } : null,
    })
  } catch (err) {
    return serverError('[GET /api/sessions/:id]', err, 'Failed to fetch session')
  }
}
