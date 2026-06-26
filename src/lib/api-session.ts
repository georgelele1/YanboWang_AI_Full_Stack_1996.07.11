import type { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { hasSessionAccess } from '@/lib/session-access'

export const sessionWithSubscription = Prisma.validator<Prisma.SessionInclude>()({
  user: { include: { subscription: true } },
})

export const sessionWithResultAndSubscription = Prisma.validator<Prisma.SessionInclude>()({
  result: true,
  user: { include: { subscription: true } },
})

export type SessionWithSubscription = Prisma.SessionGetPayload<{
  include: typeof sessionWithSubscription
}>

export type SessionWithResultAndSubscription = Prisma.SessionGetPayload<{
  include: typeof sessionWithResultAndSubscription
}>

type AuthorizedSessionResult<T> =
  | { success: true; session: T }
  | { success: false; error: string; status: 401 | 404 }

export async function getAuthorizedSession(
  req: NextRequest,
  sessionId: string,
): Promise<AuthorizedSessionResult<SessionWithSubscription>> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: sessionWithSubscription,
  })

  if (!session) return { success: false, error: 'Session not found', status: 404 }
  if (!hasSessionAccess(req, session.id, session.accessTokenHash)) {
    return { success: false, error: 'Session access denied', status: 401 }
  }

  return { success: true, session }
}

export async function getAuthorizedSessionWithResult(
  req: NextRequest,
  sessionId: string,
): Promise<AuthorizedSessionResult<SessionWithResultAndSubscription>> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: sessionWithResultAndSubscription,
  })

  if (!session) return { success: false, error: 'Session not found', status: 404 }
  if (!hasSessionAccess(req, session.id, session.accessTokenHash)) {
    return { success: false, error: 'Session access denied', status: 401 }
  }

  return { success: true, session }
}
