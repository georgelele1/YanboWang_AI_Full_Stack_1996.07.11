/**
 * Centralised subscription access policy.
 *
 * Every protected endpoint (results, plan) should call resolveAccess() and
 * act on the returned decision rather than re-implementing the same logic.
 *
 * Access tiers
 * ─────────────────────────────────────────────────────────────────────────
 * full         ACTIVE (within expiresAt)
 * limited      Free trial, cancelled, and expired subscriptions
 */

import { prisma } from '@/lib/prisma'

const DATA_RETENTION_DAYS = 2

export type AccessDecision =
  | { level: 'full'; reason: 'subscribed' }
  | { level: 'limited'; reason: 'no_account' | 'trial_active' | 'trial_expired' | 'sub_expired'; dataExpiresAt?: Date }

type SubShape = {
  status: string
  plan?: string | null
  trialEndsAt?: Date | null
  expiresAt?: Date | null
  userId?: string
}

/**
 * Resolve the access level for a session.
 * Also performs side-effects when a trial or paid subscription just expired
 * (updates DB status and schedules data deletion).
 */
export async function resolveAccess(session: {
  id: string
  expiresAt?: Date | null
  userId?: string | null
  user?: { id: string; subscription?: SubShape | null } | null
}): Promise<AccessDecision> {
  const now = new Date()
  const sub = session.user?.subscription ?? null

  // ── Paid subscription ─────────────────────────────────────────
  if (sub?.status === 'ACTIVE') {
    if (!sub.expiresAt || now < new Date(sub.expiresAt)) {
      // Still within paid window
      return { level: 'full', reason: 'subscribed' }
    }

    // Paid subscription has lapsed — downgrade it
    await prisma.subscription.update({
      where: { userId: session.user!.id },
      data: { status: 'EXPIRED' },
    })
    const dataExpiresAt = new Date(now)
    dataExpiresAt.setDate(dataExpiresAt.getDate() + DATA_RETENTION_DAYS)
    if (!session.expiresAt) {
      await prisma.session.update({
        where: { id: session.id },
        data: { expiresAt: dataExpiresAt },
      })
    }
    return { level: 'limited', reason: 'sub_expired', dataExpiresAt }
  }

  // ── Trial ──────────────────────────────────────────────────────
  if (sub?.status === 'TRIAL') {
    if (sub.trialEndsAt && now < new Date(sub.trialEndsAt)) {
      return { level: 'limited', reason: 'trial_active' }
    }

    // Trial just expired — update DB + schedule deletion
    const dataExpiresAt = new Date(sub.trialEndsAt ?? now)
    dataExpiresAt.setDate(dataExpiresAt.getDate() + DATA_RETENTION_DAYS)
    await prisma.subscription.update({ where: { userId: session.user!.id }, data: { status: 'TRIAL_EXPIRED' } })
    return { level: 'limited', reason: 'trial_expired', dataExpiresAt }
  }

  // ── Already-expired statuses ───────────────────────────────────
  if (sub?.status === 'TRIAL_EXPIRED' || sub?.status === 'EXPIRED' || sub?.status === 'CANCELLED') {
    return { level: 'limited', reason: 'trial_expired', dataExpiresAt: session.expiresAt ?? undefined }
  }

  // ── No account linked ──────────────────────────────────────────
  return { level: 'limited', reason: 'no_account' }
}
