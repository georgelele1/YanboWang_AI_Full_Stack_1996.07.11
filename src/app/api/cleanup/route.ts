/**
 * POST /api/cleanup
 *
 * Purges expired sessions — sessions where expiresAt has passed.
 * In production this would be called by a cron job (e.g. Vercel Cron,
 * GitHub Actions schedule, or pg_cron). Safe to call repeatedly (idempotent).
 *
 * Deleting the Session cascades to HealthResult via onDelete: Cascade.
 * The User record is kept — they may return and retake the quiz.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest) {
  try {
    const now = new Date()

    const { count } = await prisma.session.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    })

    return NextResponse.json({
      purged: count,
      ranAt: now.toISOString(),
    })
  } catch (err) {
    console.error('[POST /api/cleanup]', err)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
