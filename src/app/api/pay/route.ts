

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonError, serverError, jsonOk, readBody } from '@/lib/api-response'
import { getAuthorizedSession } from '@/lib/api-session'
import { BILLING_PLANS, getPlanExpiresAt, isFreeTrialPlan, normalizeBillingPlan } from '@/lib/billing-plans'

export async function POST(req: NextRequest) {
  try {
    const { sessionId, plan } = await readBody<{
      sessionId?: string
      plan?: string
    }>(req)

    if (!sessionId || typeof sessionId !== 'string') {
      return jsonError('sessionId is required', 400)
    }

    const selectedPlan = normalizeBillingPlan(plan)
    const sessionResult = await getAuthorizedSession(req, sessionId)

    if (!sessionResult.success) return jsonError(sessionResult.error, sessionResult.status)
    const session = sessionResult.session

    if (!session.isCompleted) {
      return jsonError('Cannot purchase before completing the quiz', 422)
    }

    if (!session.user) {
      return jsonError('No account found. Please provide your email first.', 422)
    }

    const user = session.user
    const sub = session.user.subscription
    const now = new Date()
    const isCurrentlyActive =
      sub?.status === 'ACTIVE' && (!sub.expiresAt || now < new Date(sub.expiresAt))

    if (isCurrentlyActive) {
      return jsonOk({
        success: true,
        sessionId,
        status: 'ACTIVE',
        plan: sub!.plan,
        activatedAt: sub!.activatedAt,
        expiresAt: sub!.expiresAt,
        alreadyActive: true,
      })
    }
    const isFreeTrial = isFreeTrialPlan(selectedPlan)
    const isTrialActive = sub?.status === 'TRIAL' && sub.trialEndsAt && now < new Date(sub.trialEndsAt)
    if (isFreeTrial && isTrialActive) {
      return jsonOk({ success: true, sessionId, status: 'TRIAL', plan: sub!.plan, trialEndsAt: sub!.trialEndsAt, alreadyTrial: true })
    }

    const trialEndsAt = new Date(now)
    trialEndsAt.setDate(trialEndsAt.getDate() + BILLING_PLANS.free_trial.intervalDays)
    const expiresAt = getPlanExpiresAt(selectedPlan, now)

    const subscription = await prisma.$transaction(async (tx) => {
      const updatedSubscription = await tx.subscription.upsert({
        where: { userId: user.id },
        update: {
          status: isFreeTrial ? 'TRIAL' : 'ACTIVE',
          plan: selectedPlan,
          trialEndsAt,
          activatedAt: isFreeTrial ? null : now,
          expiresAt: isFreeTrial ? null : expiresAt,
          cancelledAt: null,
          cancelReason: null,
        },
        create: {
          userId: user.id,
          status: isFreeTrial ? 'TRIAL' : 'ACTIVE',
          plan: selectedPlan,
          trialEndsAt,
          ...(isFreeTrial ? {} : { activatedAt: now, expiresAt }),
        },
      })

      if (!isFreeTrial) {
        await tx.paymentTransaction.create({
          data: {
            userId: user.id,
            subscriptionId: updatedSubscription.id,
            sessionId,
            plan: selectedPlan,
            amountCents: BILLING_PLANS[selectedPlan].amountCents,
            currency: 'USD',
            provider: 'mock',
            status: 'SUCCEEDED',
            description: `Mock checkout for ${selectedPlan} subscription`,
          },
        })
      }
      await tx.session.updateMany({
        where: { userId: user.id },
        data: { expiresAt: null },
      })

      return updatedSubscription
    })

    return jsonOk({
      success: true,
      sessionId,
      userId: session.user.id,
      status: subscription.status,
      plan: subscription.plan,
      ...(isFreeTrial ? { trialEndsAt: subscription.trialEndsAt, trialStarted: true } : { activatedAt: subscription.activatedAt, expiresAt: subscription.expiresAt }),
    })
  } catch (err) {
    return serverError('[POST /api/pay]', err, 'Payment processing failed')
  }
}
