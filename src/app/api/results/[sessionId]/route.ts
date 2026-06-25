/**
 * GET /api/results/:sessionId
 *
 * Access control matrix:
 * +---------------------+--------------+-------------------------------------+
 * | Condition           | Access       | Notes                               |
 * +---------------------+--------------+-------------------------------------+
 * | No email provided   | limited      | reason: no_account                  |
 * | TRIAL (active)      | limited      | BMI preview + plan selection         |
 * | TRIAL (expired)     | limited      | reason: trial_expired + promo shown |
 * |                     |              | sets session.expiresAt = +2 days    |
 * | ACTIVE (within sub) | full         |                                     |
 * | ACTIVE (expired)    | limited      | reason: sub_expired; sets EXPIRED   |
 * | EXPIRED/CANCELLED   | limited      | reason: trial_expired               |
 * | Data purged         | 410 Gone     | session.expiresAt has passed        |
 * +---------------------+--------------+-------------------------------------+
 *
 * Access decisions are centralised in src/lib/access-policy.ts.
 * medicalWarning is included in ALL access levels when BMI is outside 15-60.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBmiWarning } from '@/lib/validation'
import { hasSessionAccess } from '@/lib/session-access'
import { resolveAccess } from '@/lib/access-policy'
import type { FullResultsResponse, FreeResultsResponse, QuizData } from '@/types/quiz'

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: params.sessionId },
      include: {
        result: true,
        user: { include: { subscription: true } },
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    if (!hasSessionAccess(req, session.id, session.accessTokenHash)) {
      return NextResponse.json({ error: 'Session access denied' }, { status: 401 })
    }

    // Check if data has been purged
    if (session.expiresAt && new Date() > session.expiresAt) {
      return NextResponse.json(
        { error: 'Data has been deleted. Please retake the quiz.' },
        { status: 410 },
      )
    }

    if (!session.result) {
      return NextResponse.json(
        { error: 'Results not yet calculated. Complete the quiz first.' },
        { status: 404 },
      )
    }

    // Medical warning (computed from stored height/weight)
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
        medicalWarning,
      }
      return NextResponse.json(full)
    }

    // Limited access
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
      return NextResponse.json(limited)
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
    return NextResponse.json(limited)
  } catch (err) {
    console.error('[GET /api/results/:sessionId]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
