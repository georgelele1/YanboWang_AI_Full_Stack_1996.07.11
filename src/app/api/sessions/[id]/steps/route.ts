

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { validateStepData, normalizeStepData, mergeQuizData, getBmiWarning } from '@/lib/validation'
import { jsonError, serverError, jsonOk, readBody } from '@/lib/api-response'
import { getAuthorizedSession } from '@/lib/api-session'
import type { QuizData } from '@/types/quiz'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await readBody<{ step: unknown; data: unknown }>(req)
    const { step, data } = body as { step: unknown; data: unknown }

    const stepNum = Number(step)
    if (!Number.isInteger(stepNum) || stepNum < 1 || stepNum > 12) {
      return jsonError('Validation failed', 400, [{ field: 'step', message: 'Must be an integer between 1 and 12' }])
    }

    if (!data || typeof data !== 'object') {
      return jsonError('Validation failed', 400, [{ field: 'data', message: 'data must be an object' }])
    }

    const normalizedData = normalizeStepData(stepNum, data as Record<string, unknown>)
    const fieldErrors = validateStepData(stepNum, normalizedData)
    if (fieldErrors.length > 0) {
      return jsonError('Validation failed', 400, fieldErrors)
    }

    const sessionResult = await getAuthorizedSession(req, params.id)
    if (!sessionResult.success) return jsonError(sessionResult.error, sessionResult.status)
    const session = sessionResult.session

    const email = normalizedData.email as string | undefined
    const canAttachAccountAfterCompletion = stepNum === 12 && Boolean(email) && !session.userId
    if (session.isCompleted && !canAttachAccountAfterCompletion) {
      return jsonError('Session already completed', 409)
    }

    const existingData = (session.quizData ?? {}) as QuizData
    const mergedData = mergeQuizData(existingData, normalizedData as Partial<QuizData>)
    if (stepNum === 12 && email && !session.userId) {
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email },
      })

      const update = await prisma.session.updateMany({
        where: { id: params.id, version: session.version },
        data: {
          userId: user.id,
          quizData: mergedData as unknown as Prisma.InputJsonValue,
          currentStep: Math.max(session.currentStep, stepNum),
          version: { increment: 1 },
        },
      })

      if (update.count === 0) {
        return jsonError('Session changed. Refresh and retry.', 409)
      }

      return jsonOk({
        id: session.id,
        currentStep: Math.max(session.currentStep, stepNum),
        version: session.version + 1,
        accountLinked: true,
      })
    }
    const update = await prisma.session.updateMany({
      where: { id: params.id, version: session.version },
      data: {
        quizData: mergedData as unknown as Prisma.InputJsonValue,
        currentStep: Math.max(session.currentStep, stepNum),
        version: { increment: 1 },
      },
    })
    if (update.count === 0) {
      return jsonError('Session changed. Refresh and retry.', 409)
    }
    const medicalWarning =
      stepNum === 6 &&
      typeof mergedData.heightCm === 'number' &&
      typeof mergedData.weightKg === 'number'
        ? getBmiWarning(mergedData.heightCm, mergedData.weightKg)
        : null

    return jsonOk({
      id: session.id,
      currentStep: Math.max(session.currentStep, stepNum),
      version: session.version + 1,
      savedAt: new Date(),
      ...(medicalWarning ? { medicalWarning } : {}),
    })
  } catch (err) {
    return serverError('[PUT /api/sessions/:id/steps]', err, 'Failed to save step')
  }
}
