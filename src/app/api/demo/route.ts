/**
 * GET /api/demo
 *
 * Sets the demo-paid session cookie and redirects to the full results page.
 * Share this URL with reviewers — one click gives them the complete paid experience.
 *
 * Demo session must exist in the DB (run: npm run db:seed).
 * Token is intentionally public; this is a demo-only convenience route.
 */

import { NextRequest, NextResponse } from 'next/server'

const DEMO_SESSION_ID = 'demo-paid'
const DEMO_TOKEN = 'reviewer-demo-token'
const COOKIE_NAME = `healthpath_session_${DEMO_SESSION_ID}`

export async function GET(_req: NextRequest) {
  const response = NextResponse.redirect(
    new URL(`/results/${DEMO_SESSION_ID}`, process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  )

  response.cookies.set(COOKIE_NAME, DEMO_TOKEN, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return response
}
