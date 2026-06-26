import { NextRequest } from 'next/server'
import { jsonOk } from '@/lib/api-response'


export async function POST(req: NextRequest) {
  const response = jsonOk({ success: true })
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
