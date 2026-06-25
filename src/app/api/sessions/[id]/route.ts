/**
 * GET /api/sessions/:id
 *
 * Returns the session with current progress -- used for page-refresh / back-navigation recovery.
 * The client reads currentStep and quizData to restore the UI state.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hasSessionAccess } from '@/lib/session-access'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: params.id },
      include: { user: { include: { subscription: true } } },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    if (!hasSessionAccess(req, session.id, session.accessTokenHash)) {
      return NextResponse.json({ error: 'Session access denied' }, { status: 401 })
    }

    const sub = session.user?.subscription ?? null

    return NextResponse.json({
      id: session.id,
      currentStep: session.currentStep,
      version: session.version,
      isCompleted: session.isCompleted,
      quizData: session.quizData,
      subscription: sub ? { status: sub.status } : null,
    })
  } catch (err) {
    console.error('[GET /api/sessions/:id]', err)
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }
}
