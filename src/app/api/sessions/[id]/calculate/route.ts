

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { calculateHealthAssessment, validateInput } from '@/lib/health-calculator'
import { isQuizComplete } from '@/lib/validation'
import { jsonError, serverError, jsonOk } from '@/lib/api-response'
import { getAuthorizedSessionWithResult } from '@/lib/api-session'
import type { HealthAssessmentInput, QuizData } from '@/types/quiz'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const sessionResult = await getAuthorizedSessionWithResult(req, params.id)
    if (!sessionResult.success) return jsonError(sessionResult.error, sessionResult.status)
    const session = sessionResult.session
    if (session.result) {
      await prisma.session.update({
        where: { id: params.id },
        data: { isCompleted: true },
      })
      return jsonOk({
        sessionId: session.id,
        resultId: session.result.id,
        alreadyCalculated: true,
      })
    }
    const quizData = (session.quizData ?? {}) as QuizData

    if (!isQuizComplete(quizData)) {
      return jsonError(
        'Incomplete quiz data',
        422,
        'All steps must be completed before calculating results',
      )
    }
    const input: HealthAssessmentInput = {
      age: quizData.age!,
      gender: quizData.gender!,
      goal: quizData.goal!,
      heightCm: quizData.heightCm!,
      weightKg: quizData.weightKg!,
      targetWeightKg: quizData.targetWeightKg!,
      activityLevel: quizData.activityLevel!,
    }

    const validationErrors = validateInput(input)
    if (validationErrors.length > 0) {
      return jsonError('Invalid quiz data', 422, validationErrors)
    }
    const result = calculateHealthAssessment(input)
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

    return jsonOk({
      sessionId: session.id,
      resultId: healthResult.id,
    }, 201)
  } catch (err) {
    return serverError('[POST /api/sessions/:id/calculate]', err, 'Calculation failed')
  }
}
