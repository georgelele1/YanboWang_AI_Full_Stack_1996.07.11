import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/logout
 * Clears all healthpath_session_* cookies so the browser forgets the session.
 * The session itself is NOT deleted from the database -- data is preserved
 * in case the user returns via the same localStorage clientId.
 */
export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true })

  // Clear every cookie that matches the healthpath session pattern
  const allCookies = req.cookies.getAll()
  for (const cookie of allCookies) {
    if (cookie.name.startsWith('healthpath_session_')) {
      response.cookies.set(cookie.name, '', {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      })
    }
  }

  return response
}
