/**
 * POST /api/sessions/:id/calculate
 *
 * Triggered after the user completes all 10 quiz steps.
 * Validates all required fields exist, runs the health assessment
 * algorithm server-side, persists the result, and marks the session complete.
 *
 * Idempotent: if results already exist, returns them without recalculating.
 */

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { calculateHealthAssessment, validateInput } from '@/lib/health-calculator'
import { isQuizComplete } from '@/lib/validation'
import { hasSessionAccess } from '@/lib/session-access'
import type { HealthAssessmentInput, QuizData } from '@/types/quiz'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: params.id },
      include: { result: true },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    if (!hasSessionAccess(req, session.id, session.accessTokenHash)) {
      return NextResponse.json({ error: 'Session access denied' }, { status: 401 })
    }

    // ── Idempotency: return existing result if already calculated ──
    if (session.result) {
      await prisma.session.update({
        where: { id: params.id },
        data: { isCompleted: true },
      })
      return NextResponse.json({
        sessionId: session.id,
        resultId: session.result.id,
        alreadyCalculated: true,
      })
    }

    // ── Validate data completeness ─────────────────────────────────
    const quizData = (session.quizData ?? {}) as QuizData

    if (!isQuizComplete(quizData)) {
      return NextResponse.json(
        {
          error: 'Incomplete quiz data',
          details: 'All steps must be completed before calculating results',
        },
        { status: 422 },
      )
    }

    // ── Deep validation via health-calculator ──────────────────────
    const input: HealthAssessmentInput = {
      age: quizData.age!,           // exact age — used in BMR calculation
      gender: quizData.gender!,
      goal: quizData.goal!,
      heightCm: quizData.heightCm!,
      weightKg: quizData.weightKg!,
      targetWeightKg: quizData.targetWeightKg!,
      activityLevel: quizData.activityLevel!,
    }

    const validationErrors = validateInput(input)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid quiz data', details: validationErrors },
        { status: 422 },
      )
    }

    // ── Run health assessment ──────────────────────────────────────
    const result = calculateHealthAssessment(input)

    // ── Persist result + mark session complete (atomic) ────────────
    const [healthResult] = await prisma.$transaction([
      prisma.healthResult.create({
        data: {
          sessionId: session.id,
          bmi: result.bmi,
          bmiCategory: result.bmiCategory,
          dailyCalories: result.dailyCalories,
          proteinGrams: result.proteinGrams,
          carbGrams: result.carbGrams,
          fatGrams: result.fatGrams,
          weeklyWeightLossForecast: result.weeklyWeightLossForecast,
          weeksToGoal: result.weeksToGoal,
          targetDate: result.targetDate,
          weeklyProjection: result.weeklyProjection as unknown as Prisma.InputJsonValue,
        },
      }),
      prisma.session.update({
        where: { id: session.id },
        data: { isCompleted: true },
      }),
    ])

    return NextResponse.json({
      sessionId: session.id,
      resultId: healthResult.id,
    }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/sessions/:id/calculate]', err)
    return NextResponse.json({ error: 'Calculation failed' }, { status: 500 })
  }
}
