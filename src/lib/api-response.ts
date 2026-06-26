import { NextResponse } from 'next/server'

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json(
    details === undefined ? { error: message } : { error: message, details },
    { status },
  )
}

export async function readBody<T extends object = Record<string, unknown>>(
  req: Request,
): Promise<Partial<T>> {
  try {
    const body = await req.json()
    return body && typeof body === 'object' ? body as Partial<T> : {}
  } catch {
    return {}
  }
}

export function serverError(scope: string, error: unknown, message = 'Internal server error') {
  console.error(scope, error)
  return jsonError(message, 500)
}
