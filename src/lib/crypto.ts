import crypto from 'crypto'

export function generateApiKey(): string {
  return 'pb_' + crypto.randomBytes(32).toString('hex')
}

export function generateSecretKey(): string {
  return 'sk_' + crypto.randomBytes(32).toString('hex')
}

export function generateTransactionId(): string {
  const now = new Date()
  const date = now.toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14)
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `TXN${date}${rand}`
}

export function hashCode(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex')
}

export function hmacSha256(secret: string, data: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex')
}

export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

export function xorStrings(a: string, b: string): string {
  const result = Buffer.alloc(Math.max(a.length, b.length))
  for (let i = 0; i < result.length; i++) {
    result[i] = a.charCodeAt(i % a.length) ^ b.charCodeAt(i % b.length)
  }
  return result.toString('hex')
}
