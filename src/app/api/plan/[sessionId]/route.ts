/**
 * GET /api/plan/:sessionId
 *
 * Returns the generated workout plan for a session.
 * Access control is centralised in src/lib/access-policy.ts and mirrors the
 * results endpoint exactly:
 *   - ACTIVE (within expiresAt) -> full 7-day plan
 *   - Free and trial access -> preview (first 2 days) + upgrade prompt
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hasSessionAccess } from '@/lib/session-access'
import { resolveAccess } from '@/lib/access-policy'
import type { WorkoutPlan, QuizData, ActivityType, FocusArea, Goal, ActivityLevel } from '@/types/quiz'
import { generateWorkoutPlan } from '@/lib/plan-generator'

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: params.sessionId },
      include: {
        user: { include: { subscription: true } },
      },
    })

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (!hasSessionAccess(req, session.id, session.accessTokenHash)) {
      return NextResponse.json({ error: 'Session access denied' }, { status: 401 })
    }

    if (session.expiresAt && new Date() > session.expiresAt) {
      return NextResponse.json(
        { error: 'Data has been deleted. Please retake the quiz.' },
        { status: 410 },
      )
    }

    if (!session.isCompleted) {
      return NextResponse.json({ error: 'Quiz not yet completed' }, { status: 404 })
    }

    const quizData = (session.quizData ?? {}) as QuizData
    const { goal, focusAreas, activityTypes, activityLevel } = quizData

    if (!goal || !activityLevel) {
      return NextResponse.json({ error: 'Insufficient quiz data for plan generation' }, { status: 422 })
    }

    const plan: WorkoutPlan = generateWorkoutPlan(
      goal as Goal,
      (focusAreas ?? []) as FocusArea[],
      (activityTypes ?? []) as ActivityType[],
      activityLevel as ActivityLevel,
    )

    const decision = await resolveAccess(session)

    if (decision.level === 'full') {
      return NextResponse.json({ access: 'full', plan })
    }

    // Limited: first 2 workout days only
    const preview = { ...plan, schedule: plan.schedule.slice(0, 2) }
    return NextResponse.json({
      access: 'limited',
      plan: preview,
      totalDays: plan.schedule.length,
      message: 'Subscribe to unlock your complete 7-day workout programme.',
    })
  } catch (err) {
    console.error('[GET /api/plan/:sessionId]', err)
    return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 })
  }
}
