

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSessionAccessToken, setSessionAccessCookie, hasSessionAccess } from '@/lib/session-access'
import { jsonError, serverError, jsonOk, readBody } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  try {
    const body = await readBody<{ clientId?: string }>(req)
    const clientId: string | undefined = body?.clientId

    if (clientId) {
      const existing = await prisma.session.findUnique({
        where: { id: clientId },
        include: { user: { include: { subscription: true } } },
      })
      if (existing) {
        if (!hasSessionAccess(req, existing.id, existing.accessTokenHash)) {
          return jsonError('Session access denied', 401)
        }
        const access = createSessionAccessToken()
        await prisma.session.update({
          where: { id: clientId },
          data: { accessTokenHash: access.hash },
        })
        const response = jsonOk(buildSessionResponse(existing), 200)
        setSessionAccessCookie(response, existing.id, access.token)
        return response
      }
    }

    const access = createSessionAccessToken()
    const session = await prisma.session.create({
      data: {
        id: clientId ?? undefined,
        quizData: {},
        accessTokenHash: access.hash,
      },
      include: { user: { include: { subscription: true } } },
    })

    const response = jsonOk(buildSessionResponse(session), 201)
    setSessionAccessCookie(response, session.id, access.token)
    return response
  } catch (err) {
    return serverError('[POST /api/sessions]', err, 'Failed to create session')
  }
}

type SessionResponseSource = {
  id: string
  currentStep: number
  version: number
  isCompleted: boolean
  quizData: unknown
  user?: {
    subscription?: {
      status: string
      trialEndsAt?: Date | null
    } | null
  } | null
}
function buildSessionResponse(session: SessionResponseSource) {
  const sub = session.user?.subscription ?? null
  const now = new Date()

  let trialDaysLeft: number | undefined
  if (sub?.status === 'TRIAL' && sub.trialEndsAt) {
    const ms = new Date(sub.trialEndsAt).getTime() - now.getTime()
    trialDaysLeft = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
  }

  return {
    id: session.id,
    currentStep: session.currentStep,
    version: session.version,
    isCompleted: session.isCompleted,
    quizData: session.quizData,
    subscription: sub
      ? {
          status: sub.status,
          trialEndsAt: sub.trialEndsAt?.toISOString(),
          trialDaysLeft,
        }
      : null,
  }
}
