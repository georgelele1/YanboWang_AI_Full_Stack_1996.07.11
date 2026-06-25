/**
 * PUT /api/sessions/:id/steps
 *
 * Saves quiz progress one step at a time (10 steps total).
 *
 * Step 10 is special: when an email is provided, we:
 *  1. Find or create a User record keyed on that email
 *  2. Link the session to that user
 *  3. Create a Subscription with TRIAL status (3-day trial)
 *
 * Step 6 returns a medicalWarning if BMI is outside the safe range (15-60).
 */

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { validateStepData, normalizeStepData, mergeQuizData, getBmiWarning } from '@/lib/validation'
import { hasSessionAccess } from '@/lib/session-access'
import type { QuizData } from '@/types/quiz'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json()
    const { step, data } = body as { step: unknown; data: unknown }

    const stepNum = Number(step)
    if (!Number.isInteger(stepNum) || stepNum < 1 || stepNum > 10) {
      return NextResponse.json(
        { error: 'Validation failed', details: [{ field: 'step', message: 'Must be an integer between 1 and 10' }] },
        { status: 400 },
      )
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Validation failed', details: [{ field: 'data', message: 'data must be an object' }] },
        { status: 400 },
      )
    }

    const normalizedData = normalizeStepData(stepNum, data as Record<string, unknown>)
    const fieldErrors = validateStepData(stepNum, normalizedData)
    if (fieldErrors.length > 0) {
      return NextResponse.json({ error: 'Validation failed', details: fieldErrors }, { status: 400 })
    }

    const session = await prisma.session.findUnique({
      where: { id: params.id },
      include: { user: { include: { subscription: true } } },
    })

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (!hasSessionAccess(req, session.id, session.accessTokenHash)) {
      return NextResponse.json({ error: 'Session access denied' }, { status: 401 })
    }

    const email = normalizedData.email as string | undefined
    const canAttachAccountAfterCompletion = stepNum === 10 && Boolean(email) && !session.userId
    if (session.isCompleted && !canAttachAccountAfterCompletion) {
      return NextResponse.json({ error: 'Session already completed' }, { status: 409 })
    }

    const existingData = (session.quizData ?? {}) as QuizData
    const mergedData = mergeQuizData(existingData, normalizedData as Partial<QuizData>)

    // Step 10: email capture -- create/link user + start trial
    if (stepNum === 10 && email && !session.userId) {
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
        return NextResponse.json({ error: 'Session changed. Refresh and retry.' }, { status: 409 })
      }

      return NextResponse.json({
        id: session.id,
        currentStep: Math.max(session.currentStep, stepNum),
        version: session.version + 1,
        accountLinked: true,
      })
    }

    // All other steps: simple merge
    const update = await prisma.session.updateMany({
      where: { id: params.id, version: session.version },
      data: {
        quizData: mergedData as unknown as Prisma.InputJsonValue,
        currentStep: Math.max(session.currentStep, stepNum),
        version: { increment: 1 },
      },
    })
    if (update.count === 0) {
      return NextResponse.json({ error: 'Session changed. Refresh and retry.' }, { status: 409 })
    }

    // Step 6 carries height + weight -- check for BMI advisory
    const medicalWarning =
      stepNum === 6 &&
      typeof mergedData.heightCm === 'number' &&
      typeof mergedData.weightKg === 'number'
        ? getBmiWarning(mergedData.heightCm, mergedData.weightKg)
        : null

    return NextResponse.json({
      id: session.id,
      currentStep: Math.max(session.currentStep, stepNum),
      version: session.version + 1,
      savedAt: new Date(),
      ...(medicalWarning ? { medicalWarning } : {}),
    })
  } catch (err) {
    console.error('[PUT /api/sessions/:id/steps]', err)
    return NextResponse.json({ error: 'Failed to save step' }, { status: 500 })
  }
}
