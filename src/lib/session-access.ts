import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import type { NextRequest, NextResponse } from 'next/server'

const COOKIE_PREFIX = 'healthpath_session_'

export function createSessionAccessToken() {
  const token = randomBytes(32).toString('base64url')
  return { token, hash: hashSessionAccessToken(token) }
}

export function hashSessionAccessToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function setSessionAccessCookie(response: NextResponse, sessionId: string, token: string) {
  response.cookies.set(`${COOKIE_PREFIX}${sessionId}`, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export function hasSessionAccess(req: NextRequest, sessionId: string, storedHash: string | null) {
  const token = req.cookies.get(`${COOKIE_PREFIX}${sessionId}`)?.value
  if (!token || !storedHash) return false
  const expected = Buffer.from(storedHash, 'hex')
  const actual = Buffer.from(hashSessionAccessToken(token), 'hex')
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
