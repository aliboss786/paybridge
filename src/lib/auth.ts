import { prisma } from './db'

const sessions = new Map<string, { userId: string; email: string; name: string; role: string; expiresAt: number }>()

export function createSession(user: { id: string; email: string; name: string; role: string }) {
  const token = require('crypto').randomBytes(48).toString('hex')
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000
  sessions.set(token, { userId: user.id, email: user.email, name: user.name, role: user.role, expiresAt })
  return { token, expiresAt }
}

export function getSession(token: string) {
  if (!token) return null
  const session = sessions.get(token)
  if (!session) return null
  if (Date.now() > session.expiresAt) { sessions.delete(token); return null }
  return session
}

export async function authenticateRequest(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token') || req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return getSession(token)
}
