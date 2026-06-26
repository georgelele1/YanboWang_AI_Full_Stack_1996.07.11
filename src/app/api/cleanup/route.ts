

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonError, serverError, jsonOk } from '@/lib/api-response'

const CRON_SECRET = process.env.CRON_SECRET

export async function POST(req: NextRequest) {
  if (CRON_SECRET) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return jsonError('Unauthorized', 401)
    }
  }
  try {
    const now = new Date()

    const { count } = await prisma.session.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    })

    return jsonOk({
      purged: count,
      ranAt: now.toISOString(),
    })
  } catch (err) {
    return serverError('[POST /api/cleanup]', err, 'Cleanup failed')
  }
}
