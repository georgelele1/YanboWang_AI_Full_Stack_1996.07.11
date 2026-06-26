

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


export async function resolveAccess(session: {
  id: string
  expiresAt?: Date | null
  userId?: string | null
  user?: { id: string; subscription?: SubShape | null } | null
}): Promise<AccessDecision> {
  const now = new Date()
  const sub = session.user?.subscription ?? null
  if (sub?.status === 'ACTIVE') {
    if (!sub.expiresAt || now < new Date(sub.expiresAt)) {
      return { level: 'full', reason: 'subscribed' }
    }
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
  if (sub?.status === 'TRIAL') {
    if (sub.trialEndsAt && now < new Date(sub.trialEndsAt)) {
      return { level: 'limited', reason: 'trial_active' }
    }
    const dataExpiresAt = new Date(sub.trialEndsAt ?? now)
    dataExpiresAt.setDate(dataExpiresAt.getDate() + DATA_RETENTION_DAYS)
    await prisma.subscription.update({ where: { userId: session.user!.id }, data: { status: 'TRIAL_EXPIRED' } })
    return { level: 'limited', reason: 'trial_expired', dataExpiresAt }
  }
  if (sub?.status === 'TRIAL_EXPIRED' || sub?.status === 'EXPIRED' || sub?.status === 'CANCELLED') {
    return { level: 'limited', reason: 'trial_expired', dataExpiresAt: session.expiresAt ?? undefined }
  }
  return { level: 'limited', reason: 'no_account' }
}
