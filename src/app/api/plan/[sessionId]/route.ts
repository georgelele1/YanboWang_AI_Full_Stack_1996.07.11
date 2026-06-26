

import { NextRequest } from 'next/server'
import { jsonError, serverError, jsonOk } from '@/lib/api-response'
import { getAuthorizedSession } from '@/lib/api-session'
import { resolveAccess } from '@/lib/access-policy'
import type { WorkoutPlan, QuizData, ActivityType, FocusArea, Goal, ActivityLevel } from '@/types/quiz'
import { generateWorkoutPlan } from '@/lib/plan-generator'

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  try {
    const sessionResult = await getAuthorizedSession(req, params.sessionId)
    if (!sessionResult.success) return jsonError(sessionResult.error, sessionResult.status)
    const session = sessionResult.session

    if (session.expiresAt && new Date() > session.expiresAt) {
      return jsonError('Data has been deleted. Please retake the quiz.', 410)
    }

    if (!session.isCompleted) {
      return jsonError('Quiz not yet completed', 404)
    }

    const quizData = (session.quizData ?? {}) as QuizData
    const { goal, focusAreas, activityTypes, activityLevel } = quizData

    if (!goal || !activityLevel) {
      return jsonError('Insufficient quiz data for plan generation', 422)
    }

    const plan: WorkoutPlan = generateWorkoutPlan(
      goal as Goal,
      (focusAreas ?? []) as FocusArea[],
      (activityTypes ?? []) as ActivityType[],
      activityLevel as ActivityLevel,
    )

    const decision = await resolveAccess(session)

    if (decision.level === 'full') {
      return jsonOk({ access: 'full', plan })
    }
    const preview = { ...plan, schedule: plan.schedule.slice(0, 2) }
    return jsonOk({
      access: 'limited',
      plan: preview,
      totalDays: plan.schedule.length,
      message: 'Subscribe to unlock your complete 7-day workout programme.',
    })
  } catch (err) {
    return serverError('[GET /api/plan/:sessionId]', err, 'Failed to fetch plan')
  }
}
