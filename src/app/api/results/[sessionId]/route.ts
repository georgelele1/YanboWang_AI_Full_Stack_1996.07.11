

import { NextRequest } from 'next/server'
import { getBmiWarning } from '@/lib/validation'
import { jsonError, serverError, jsonOk } from '@/lib/api-response'
import { getAuthorizedSessionWithResult } from '@/lib/api-session'
import { resolveAccess } from '@/lib/access-policy'
import type { FullResultsResponse, FreeResultsResponse, QuizData } from '@/types/quiz'

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  try {
    const sessionResult = await getAuthorizedSessionWithResult(req, params.sessionId)
    if (!sessionResult.success) return jsonError(sessionResult.error, sessionResult.status)
    const session = sessionResult.session
    if (session.expiresAt && new Date() > session.expiresAt) {
      return jsonError('Data has been deleted. Please retake the quiz.', 410)
    }

    if (!session.result) {
      return jsonError('Results not yet calculated. Complete the quiz first.', 404)
    }
    const quizData = (session.quizData ?? {}) as QuizData
    const medicalWarning =
      typeof quizData.heightCm === 'number' && typeof quizData.weightKg === 'number'
        ? getBmiWarning(quizData.heightCm, quizData.weightKg) ?? undefined
        : undefined

    const decision = await resolveAccess(session)

    if (decision.level === 'full') {
      const full: FullResultsResponse = {
        access: 'full',
        accessReason: 'subscribed',
        sessionId: session.id,
        goal: quizData.goal ?? 'improve_health',
        bmi: session.result.bmi,
        bmiCategory: session.result.bmiCategory as FullResultsResponse['bmiCategory'],
        dailyCalories: session.result.dailyCalories,
        proteinGrams: session.result.proteinGrams,
        carbGrams: session.result.carbGrams,
        fatGrams: session.result.fatGrams,
        weeklyWeightLossForecast: session.result.weeklyWeightLossForecast,
        weeksToGoal: session.result.weeksToGoal,
        targetDate: session.result.targetDate.toISOString(),
        weeklyProjection: session.result.weeklyProjection as unknown as FullResultsResponse['weeklyProjection'],
        requestedTargetDate: quizData.targetDate,
        requestedTimelineWeeks: quizData.targetTimelineWeeks,
        motivation: quizData.motivation,
        motivationDetail: quizData.motivationDetail,
        medicalWarning,
      }
      return jsonOk(full)
    }
    const reason = decision.reason
    const dataExpiresAt = decision.dataExpiresAt

    if (reason === 'no_account' || reason === 'trial_active') {
      const limited: FreeResultsResponse = {
        access: 'limited',
        reason,
        sessionId: session.id,
        bmi: session.result.bmi,
        bmiCategory: session.result.bmiCategory as FreeResultsResponse['bmiCategory'],
        dailyCalories: session.result.dailyCalories,
        message: reason === 'trial_active'
          ? 'Your free trial includes a two-day workout preview. Choose a paid plan to unlock the full programme.'
          : 'Choose a plan to unlock your personalised programme.',
        medicalWarning,
      }
      return jsonOk(limited)
    }

    const sub = session.user?.subscription
    const limited: FreeResultsResponse = {
      access: 'limited',
      reason: 'trial_expired',
      sessionId: session.id,
      bmi: session.result.bmi,
      bmiCategory: session.result.bmiCategory as FreeResultsResponse['bmiCategory'],
      dailyCalories: session.result.dailyCalories,
      trialEndsAt: sub?.trialEndsAt?.toISOString(),
      dataExpiresAt: dataExpiresAt?.toISOString(),
      message: dataExpiresAt
        ? `Subscribe to keep your results -- your data will be deleted on ${dataExpiresAt.toLocaleDateString()}.`
        : 'Your access has ended. Subscribe to regain full access.',
      medicalWarning,
    }
    return jsonOk(limited)
  } catch (err) {
    return serverError('[GET /api/results/:sessionId]', err)
  }
}
