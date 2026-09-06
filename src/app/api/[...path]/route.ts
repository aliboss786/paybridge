import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createHash, createHmac } from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

// ==================== CONFIG ====================
const SESSION_EXPIRY_HOURS = 24
const BACKUP_DIR = path.join(process.cwd(), 'backups')
const MAX_BACKUPS = 30
const SESSIONS_FILE = path.join(process.cwd(), 'backups', 'sessions.json')

// ==================== HELPERS ====================
function ensureBackupDir() { if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true }) }
function hashCode(s: string) { return createHash('sha256').update(s).digest('hex') }
function hmacSha256(secret: string, data: string) { return createHmac('sha256', secret).update(data).digest('hex') }
function sha256(data: string) { return createHash('sha256').update(data).digest('hex') }
function generateApiKey() { return 'pb_' + require('crypto').randomBytes(32).toString('hex') }
function generateSecretKey() { return 'sk_' + require('crypto').randomBytes(32).toString('hex') }
function generateTxnId() { return 'TXN' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 8).toUpperCase() }

// ==================== SESSIONS ====================
const sessions = new Map<string, { userId: string; role: string; email: string; expiresAt: number }>()

function loadSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'))
      for (const [k, v] of Object.entries(data)) sessions.set(k, v as any)
    }
  } catch {}
}
function saveSessions() {
  try { ensureBackupDir(); const obj: Record<string, any> = {}; for (const [k, v] of sessions) obj[k] = v; fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2)) } catch {}
}
function createSessionToken(userId: string, role: string, email: string) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''; const bytes = new Uint8Array(48); require('crypto').getRandomValues(bytes)
  for (let i = 0; i < 48; i++) token += chars[bytes[i] % chars.length]
  sessions.set(token, { userId, role, email, expiresAt: Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000 })
  saveSessions(); return token
}
function validateSession(token: string) {
  if (!token) return null
  const s = sessions.get(token); if (!s) return null
  if (Date.now() > s.expiresAt) { sessions.delete(token); saveSessions(); return null }
  return s
}

// Init sessions on first import
loadSessions()

// ==================== AUTH HELPER ====================
function getToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7)
  const url = new URL(req.url)
  return url.searchParams.get('token')
}

function requireAuth(req: NextRequest) {
  const token = getToken(req)
  if (!token) return null
  return validateSession(token)
}

function requireAdmin(req: NextRequest) {
  const user = requireAuth(req)
  if (!user || user.role !== 'admin') return null
  return user
}

// ==================== GATEWAY URLs ====================
const JAZZCASH_URLS = { production: 'https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantpayment/MerchantHostedFormPOST.aspx' }
const EASYPAISA_URLS = { production: 'https://easypay.easypaisa.com.pk/easypay-merchant/faces/pg/site/TransactionDirectReq.jsf' }

// ==================== ROUTE HANDLER ====================
export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: urlPath } = await params
  const route = '/' + urlPath.join('/')
  return handleRoute('GET', request, route)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: urlPath } = await params
  const route = '/' + urlPath.join('/')
  return handleRoute('POST', request, route)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: urlPath } = await params
  const route = '/' + urlPath.join('/')
  return handleRoute('PATCH', request, route)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: urlPath } = await params
  const route = '/' + urlPath.join('/')
  return handleRoute('DELETE', request, route)
}

function json(data: any, status = 200) { return NextResponse.json(data, { status }) }

async function handleRoute(method: string, req: NextRequest, route: string) {
  const url = new URL(req.url)
  try {
    // ===== AUTH =====
    if (route === '/auth/login' && method === 'POST') {
      const body = await req.json()
      const { email, password } = body
      if (!email || !password) return json({ error: 'Email and password required' }, 400)
      
      const admin = await prisma.admin.findUnique({ where: { email } })
      if (admin) {
        if (admin.passwordHash !== hashCode(password)) return json({ error: 'Invalid credentials' }, 401)
        await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } })
        const token = createSessionToken(admin.id, 'admin', admin.email)
        return json({ token, user: { id: admin.id, email: admin.email, name: admin.name, role: 'admin' } })
      }
      
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) return json({ error: 'Invalid credentials' }, 401)
      if (user.passwordHash !== hashCode(password)) return json({ error: 'Invalid credentials' }, 401)
      if (user.status === 'pending') return json({ error: 'Account pending approval' }, 403)
      if (user.status === 'rejected') return json({ error: 'Account rejected' }, 403)
      
      const token = createSessionToken(user.id, user.role, user.email)
      return json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, feePercentage: user.feePercentage } })
    }

    if (route === '/auth/register' && method === 'POST') {
      const body = await req.json()
      const { email, password, name } = body
      if (!email || !password) return json({ error: 'Email and password required' }, 400)
      
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) return json({ error: 'Email already registered' }, 400)
      
      const user = await prisma.user.create({
        data: { email, passwordHash: hashCode(password), name: name || '', status: 'pending', role: 'user' }
      })
      return json({ message: 'Registration successful. Waiting for admin approval.', userId: user.id })
    }

    if (route === '/auth/logout' && method === 'POST') {
      const token = getToken(req)
      if (token) { sessions.delete(token); saveSessions() }
      return json({ success: true })
    }

    if (route === '/auth/change-password' && method === 'POST') {
      const user = requireAuth(req)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const body = await req.json()
      const { currentPassword, newPassword } = body
      
      const admin = await prisma.admin.findUnique({ where: { id: user.userId } })
      if (admin) {
        if (admin.passwordHash !== hashCode(currentPassword)) return json({ error: 'Current password incorrect' }, 400)
        await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash: hashCode(newPassword) } })
        return json({ success: true })
      }
      
      const userData = await prisma.user.findUnique({ where: { id: user.userId } })
      if (!userData) return json({ error: 'User not found' }, 404)
      if (userData.passwordHash !== hashCode(currentPassword)) return json({ error: 'Current password incorrect' }, 400)
      await prisma.user.update({ where: { id: userData.id }, data: { passwordHash: hashCode(newPassword) } })
      return json({ success: true })
    }

    // ===== SEED =====
    if (route === '/seed' && method === 'GET') {
      const adminExists = await prisma.admin.findFirst()
      if (!adminExists) {
        await prisma.admin.create({ data: { email: 'aliphotolab@gmail.com', name: 'Admin', passwordHash: hashCode('Ali78612@'), role: 'admin' } })
      }
      const jzExists = await prisma.paymentGateway.findUnique({ where: { name: 'jazzcash' } }).catch(() => null)
      if (!jzExists) {
        await prisma.paymentGateway.create({ data: { name: 'jazzcash', displayName: 'JazzCash', isEnabled: false, environment: 'production', credentials: JSON.stringify({ merchantId: '', password: '', integritySalt: '', returnUrl: '' }), callbackUrl: '/api/v1/payment/callback/jazzcash' } })
      }
      const epExists = await prisma.paymentGateway.findUnique({ where: { name: 'easypaisa' } }).catch(() => null)
      if (!epExists) {
        await prisma.paymentGateway.create({ data: { name: 'easypaisa', displayName: 'EasyPaisa', isEnabled: false, environment: 'production', credentials: JSON.stringify({ merchantId: '', storeId: '', apiKey: '', secretKey: '', username: '', password: '' }), callbackUrl: '/api/v1/payment/callback/easypaisa' } })
      }
      return json({ success: true, message: 'Database seeded' })
    }

    // ===== ADMIN DASHBOARD =====
    if (route === '/admin/dashboard' && method === 'GET') {
      const user = requireAdmin(req)
      if (!user) return json({ error: 'Admin access required' }, 401)
      const [totalUsers, totalTransactions, totalVolume, pendingUsers] = await Promise.all([
        prisma.user.count(),
        prisma.transaction.count(),
        prisma.transaction.aggregate({ _sum: { amount: true }, where: { status: 'completed' } }),
        prisma.user.count({ where: { status: 'pending' } }),
      ])
      return json({ totalUsers, totalTransactions, totalVolume: totalVolume._sum.amount || 0, pendingUsers })
    }

    if (route === '/admin/users-financials' && method === 'GET') {
      const user = requireAdmin(req)
      if (!user) return json({ error: 'Admin access required' }, 401)
      const users = await prisma.user.findMany({ include: { _count: { select: { transactions: true } } }, orderBy: { createdAt: 'desc' } })
      return json({ users })
    }

    if (route === '/admin/create-user' && method === 'POST') {
      const user = requireAdmin(req)
      if (!user) return json({ error: 'Admin access required' }, 401)
      const body = await req.json()
      const { email, password, name, role } = body
      if (!email || !password) return json({ error: 'Email and password required' }, 400)
      const existing = await prisma.user.findUnique({ where: { email } }).catch(() => null)
      if (existing) return json({ error: 'Email already exists' }, 400)
      const newUser = await prisma.user.create({ data: { email, passwordHash: hashCode(password), name: name || '', role: role || 'user', status: 'active' } })
      return json({ user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role } })
    }

    if (route === '/admin/approve-user' && method === 'POST') {
      const admin = requireAdmin(req)
      if (!admin) return json({ error: 'Admin access required' }, 401)
      const body = await req.json()
      const { userId } = body
      await prisma.user.update({ where: { id: userId }, data: { status: 'active' } })
      return json({ success: true })
    }

    if (route === '/admin/reject-user' && method === 'POST') {
      const admin = requireAdmin(req)
      if (!admin) return json({ error: 'Admin access required' }, 401)
      const body = await req.json()
      const { userId } = body
      await prisma.user.update({ where: { id: userId }, data: { status: 'rejected' } })
      return json({ success: true })
    }

    if (route === '/admin/reset-user-password' && method === 'POST') {
      const admin = requireAdmin(req)
      if (!admin) return json({ error: 'Admin access required' }, 401)
      const body = await req.json()
      const { userId, newPassword } = body
      await prisma.user.update({ where: { id: userId }, data: { passwordHash: hashCode(newPassword) } })
      return json({ success: true })
    }

    if (route === '/admin/live-test' && method === 'POST') {
      const user = requireAdmin(req)
      if (!user) return json({ error: 'Admin access required' }, 401)
      const body = await req.json()
      const { method: payMethod, amount, phone } = body
      const baseUrl = req.headers.get('origin') || url.origin
      const gateway = await prisma.paymentGateway.findUnique({ where: { name: payMethod } })
      if (!gateway) return json({ error: 'Gateway not found' }, 404)
      const credentials = JSON.parse(gateway.credentials)
      const transactionId = generateTxnId()

      if (payMethod === 'jazzcash') {
        const returnUrl = `${baseUrl}/api/v1/payment/callback/jazzcash`
        // JazzCash: pp_Password = SHA256(merchantId + integritySalt + password)
        const ppPassword = sha256(credentials.merchantId + credentials.integritySalt + credentials.password)
        // Build form fields for secure hash (all fields except pp_SecureHash, sorted alphabetically)
        const formFields: Record<string, string> = {
          pp_Amount: String(Math.round(amount * 100)),
          pp_Language: 'EN',
          pp_MerchantID: credentials.merchantId,
          pp_MobileNumber: phone || '',
          pp_Password: ppPassword,
          pp_ReturnURL: returnUrl,
          pp_TxnRefNo: transactionId,
          pp_TxnType: 'MWALLET',
        }
        // Add CNIC if available
        const sortedKeys = Object.keys(formFields).sort()
        const stringToSign = sortedKeys.map(k => `${k}=${formFields[k]}`).join('&')
        const secureHash = hmacSha256(credentials.integritySalt, stringToSign)
        formFields['pp_SecureHash'] = secureHash
        return json({
          success: true, environment: 'production',
          redirect_url: JAZZCASH_URLS.production,
          form_data: formFields,
          transaction_id: transactionId, amount, fee: 0,
          transactionRef: transactionId, message: `Live test ready. Amount: Rs ${amount}, Phone: ${phone}`
        })
      } else if (payMethod === 'easypaisa') {
        return json({
          success: true, environment: 'production',
          redirect_url: EASYPAISA_URLS.production,
          form_data: { merchantId: credentials.merchantId, storeId: credentials.storeId, transactionAmount: amount, mobileAccountNo: phone },
          transactionRef: transactionId, message: `Live test ready. Amount: Rs ${amount}, Phone: ${phone}`
        })
      }
      return json({ error: 'Invalid method' }, 400)
    }

    if (route === '/admin/backups' && method === 'GET') {
      const user = requireAdmin(req)
      if (!user) return json({ error: 'Admin access required' }, 401)
      try {
        ensureBackupDir()
        const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('paybridge-backup-')).map(f => {
          const stats = fs.statSync(path.join(BACKUP_DIR, f))
          return { filename: f, size: stats.size, created: stats.birthtime }
        }).sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
        return json({ backups: files })
      } catch (e: any) { return json({ error: e.message }, 500) }
    }

    if (route === '/admin/backups/create' && method === 'POST') {
      const user = requireAdmin(req)
      if (!user) return json({ error: 'Admin access required' }, 401)
      ensureBackupDir()
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `paybridge-backup-${timestamp}.db`
      const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
      if (!fs.existsSync(dbPath)) return json({ error: 'Database not found' }, 404)
      fs.copyFileSync(dbPath, path.join(BACKUP_DIR, filename))
      return json({ success: true, filename })
    }

    if (route === '/admin/backups/restore' && method === 'POST') {
      const user = requireAdmin(req)
      if (!user) return json({ error: 'Admin access required' }, 401)
      const body = await req.json()
      const { filename } = body
      const backupPath = path.join(BACKUP_DIR, filename)
      if (!fs.existsSync(backupPath)) return json({ error: 'Backup not found' }, 404)
      const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
      fs.copyFileSync(dbPath, path.join(BACKUP_DIR, `pre-restore-${Date.now()}.db`))
      fs.copyFileSync(backupPath, dbPath)
      return json({ success: true })
    }

    if (route === '/admin/transactions/live' && method === 'GET') {
      const user = requireAdmin(req)
      if (!user) return json({ error: 'Admin access required' }, 401)
      const transactions = await prisma.transaction.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { user: { select: { email: true, name: true } } } })
      return json({ transactions })
    }

    if (route === '/admin/payment/check-gateway-status' && method === 'POST') {
      const user = requireAdmin(req)
      if (!user) return json({ error: 'Admin access required' }, 401)
      const body = await req.json()
      const { transactionId } = body
      const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } })
      if (!transaction) return json({ error: 'Transaction not found' }, 404)
      return json({ transaction, gateway_status: transaction.status, gateway_response: transaction.gatewayResponse })
    }

    if (route === '/admin/payment/batch-status-check' && method === 'POST') {
      const user = requireAdmin(req)
      if (!user) return json({ error: 'Admin access required' }, 401)
      const body = await req.json()
      const { transactionIds } = body
      const transactions = await prisma.transaction.findMany({ where: { id: { in: transactionIds } } })
      return json({ results: transactions.map(t => ({ id: t.id, status: t.status, gatewayResponse: t.gatewayResponse })) })
    }

    // ===== USER DASHBOARD =====
    if (route === '/user/dashboard' && method === 'GET') {
      const user = requireAuth(req)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const userData = await prisma.user.findUnique({ where: { id: user.userId } })
      if (!userData) return json({ error: 'User not found' }, 404)
      const transactions = await prisma.transaction.findMany({ where: { userId: user.userId }, orderBy: { createdAt: 'desc' }, take: 50 })
      const totalTransactions = await prisma.transaction.count({ where: { userId: user.userId } })
      const totalAmount = await prisma.transaction.aggregate({ _sum: { amount: true }, where: { userId: user.userId, status: 'completed' } })
      const pendingAmount = await prisma.transaction.aggregate({ _sum: { amount: true }, where: { userId: user.userId, status: 'pending' } })
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
      const todayTransactions = await prisma.transaction.count({ where: { userId: user.userId, createdAt: { gte: todayStart } } })
      const todayAmount = await prisma.transaction.aggregate({ _sum: { amount: true }, where: { userId: user.userId, status: 'completed', createdAt: { gte: todayStart } } })
      const ledger = await prisma.ledger.findMany({ where: { userId: user.userId }, orderBy: { createdAt: 'desc' }, take: 20 })
      return json({
        user: { id: userData.id, email: userData.email, name: userData.name, role: userData.role, balance: userData.balance, feePercentage: userData.feePercentage },
        transactions, totalTransactions,
        totalAmount: totalAmount._sum.amount || 0,
        pendingAmount: pendingAmount._sum.amount || 0,
        todayTransactions, todayAmount: todayAmount._sum.amount || 0,
        ledger
      })
    }

    // ===== PAYMENTS =====
    if (route === '/v1/payment/create' && method === 'POST') {
      const body = await req.json()
      const { merchantApiKey, amount, currency, method: payMethod, customerName, customerEmail, customerPhone, orderId, callbackUrl } = body
      if (!merchantApiKey || !amount || !payMethod) return json({ error: 'Missing required fields' }, 400)
      
      const credential = await prisma.apiCredential.findUnique({ where: { apiKey: merchantApiKey } })
      if (!credential || !credential.isActive) return json({ error: 'Invalid API key' }, 401)
      
      const gateway = await prisma.paymentGateway.findUnique({ where: { name: payMethod } })
      if (!gateway || !gateway.isEnabled) return json({ error: 'Payment method not available' }, 400)
      
      const credentials = JSON.parse(gateway.credentials)
      const transactionId = generateTxnId()
      const platformFee = amount * (gateway.feePercentage / 100) + gateway.feeFixed
      const netAmount = amount - platformFee
      
      const transaction = await prisma.transaction.create({
        data: {
          userId: credential.userId, transactionId, orderId, type: 'payment', paymentMethod: payMethod,
          amount, currency: currency || 'PKR', fee: platformFee, platformFee, netAmount, status: 'pending',
          customerName, customerEmail, customerPhone, callbackUrl
        }
      })
      
      const baseUrl = req.headers.get('origin') || url.origin
      
      if (payMethod === 'jazzcash') {
        const returnUrl = `${baseUrl}/api/v1/payment/callback/jazzcash`
        // JazzCash: pp_Password = SHA256(merchantId + integritySalt + password)
        const ppPassword = sha256(credentials.merchantId + credentials.integritySalt + credentials.password)
        // Build form fields for secure hash (all fields except pp_SecureHash, sorted alphabetically)
        const formFields: Record<string, string> = {
          pp_Amount: String(Math.round(amount * 100)),
          pp_Language: 'EN',
          pp_MerchantID: credentials.merchantId,
          pp_MobileNumber: customerPhone || '',
          pp_Password: ppPassword,
          pp_ReturnURL: returnUrl,
          pp_TxnRefNo: transactionId,
          pp_TxnType: 'MWALLET',
        }
        const sortedKeys = Object.keys(formFields).sort()
        const stringToSign = sortedKeys.map(k => `${k}=${formFields[k]}`).join('&')
        const secureHash = hmacSha256(credentials.integritySalt, stringToSign)
        formFields['pp_SecureHash'] = secureHash
        return json({
          success: true, transactionId, redirectUrl: JAZZCASH_URLS.production,
          formData: formFields
        })
      } else if (payMethod === 'easypaisa') {
        return json({
          success: true, transactionId, redirectUrl: EASYPAISA_URLS.production,
          formData: { merchantId: credentials.merchantId, storeId: credentials.storeId, transactionAmount: amount, mobileAccountNo: customerPhone, orderRef: transactionId }
        })
      }
      return json({ error: 'Invalid payment method' }, 400)
    }

    if (route.startsWith('/v1/payment/status/') && method === 'GET') {
      const transactionId = route.split('/')[4]
      const transaction = await prisma.transaction.findUnique({ where: { transactionId } })
      if (!transaction) return json({ error: 'Transaction not found' }, 404)
      return json({ transactionId: transaction.transactionId, status: transaction.status, amount: transaction.amount, currency: transaction.currency, paymentMethod: transaction.paymentMethod, gatewayResponse: transaction.gatewayResponse, createdAt: transaction.createdAt })
    }

    if (route.startsWith('/v1/payment/process/') && method === 'POST') {
      const transactionId = route.split('/')[4]
      const body = await req.json().catch(() => ({}))
      const transaction = await prisma.transaction.findUnique({ where: { transactionId } })
      if (!transaction) return json({ error: 'Transaction not found' }, 404)
      
      if (body.status === 'completed' || body.success) {
        await prisma.transaction.update({ where: { id: transaction.id }, data: { status: 'completed', gatewayResponse: JSON.stringify(body) } })
        await prisma.user.update({ where: { id: transaction.userId }, data: { balance: { increment: transaction.netAmount } } })
        await prisma.ledger.create({ data: { userId: transaction.userId, transactionId: transaction.transactionId, type: 'credit', amount: transaction.netAmount, balanceAfter: 0, description: `Payment received via ${transaction.paymentMethod}` } })
        return json({ success: true, status: 'completed' })
      } else {
        await prisma.transaction.update({ where: { id: transaction.id }, data: { status: 'failed', gatewayResponse: JSON.stringify(body) } })
        return json({ success: false, status: 'failed' })
      }
    }

    if (route === '/v1/payment/collect/initiate' && method === 'POST') {
      const body = await req.json()
      const { merchantApiKey, amount, phone, method: payMethod } = body
      if (!merchantApiKey || !amount || !phone || !payMethod) return json({ error: 'Missing required fields' }, 400)
      const credential = await prisma.apiCredential.findUnique({ where: { apiKey: merchantApiKey } })
      if (!credential || !credential.isActive) return json({ error: 'Invalid API key' }, 401)
      const gateway = await prisma.paymentGateway.findUnique({ where: { name: payMethod } })
      if (!gateway || !gateway.isEnabled) return json({ error: 'Payment method not available' }, 400)
      const transactionId = generateTxnId()
      const transaction = await prisma.transaction.create({ data: { userId: credential.userId, transactionId, type: 'payment', paymentMethod: payMethod, amount, currency: 'PKR', customerPhone: phone, status: 'pending' } })
      return json({ success: true, otpSent: true, transactionId: `JZ-OTP-${Date.now()}`, message: `OTP sent to ${phone}` })
    }

    if (route === '/v1/payment/collect/verify' && method === 'POST') {
      const body = await req.json()
      const { transactionId, otp } = body
      const transaction = await prisma.transaction.findFirst({ where: { transactionId } })
      if (!transaction) return json({ error: 'Transaction not found' }, 404)
      await prisma.transaction.update({ where: { id: transaction.id }, data: { status: 'completed', gatewayResponse: JSON.stringify({ otp, verified: true }) } })
      await prisma.user.update({ where: { id: transaction.userId }, data: { balance: { increment: transaction.netAmount || transaction.amount } } })
      return json({ success: true, status: 'completed', transactionRef: transaction.transactionId, amount: transaction.amount, message: 'Payment successful' })
    }

    if (route === '/v1/balance' && method === 'GET') {
      const user = requireAuth(req)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const userData = await prisma.user.findUnique({ where: { id: user.userId } })
      return json({ balance: userData?.balance || 0, currency: 'PKR' })
    }

    if (route === '/v1/transactions' && method === 'GET') {
      const user = requireAuth(req)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const transactions = await prisma.transaction.findMany({ where: { userId: user.userId }, orderBy: { createdAt: 'desc' }, take: 100 })
      return json({ transactions })
    }

    if (route.startsWith('/v1/payment/get-redirect/') && method === 'POST') {
      const transactionId = route.split('/')[4]
      const transaction = await prisma.transaction.findUnique({ where: { transactionId } })
      if (!transaction) return json({ error: 'Transaction not found' }, 404)
      const gateway = await prisma.paymentGateway.findUnique({ where: { name: transaction.paymentMethod } })
      if (!gateway || !gateway.isEnabled) return json({ error: 'Payment method not available' }, 400)
      const credentials = JSON.parse(gateway.credentials)
      const baseUrl = req.headers.get('origin') || url.origin

      if (transaction.paymentMethod === 'jazzcash') {
        const returnUrl = `${baseUrl}/api/v1/payment/callback/jazzcash`
        const ppPassword = sha256(credentials.merchantId + credentials.integritySalt + credentials.password)
        const formFields: Record<string, string> = {
          pp_Amount: String(Math.round(transaction.amount * 100)),
          pp_Language: 'EN',
          pp_MerchantID: credentials.merchantId,
          pp_MobileNumber: transaction.customerPhone || '',
          pp_Password: ppPassword,
          pp_ReturnURL: returnUrl,
          pp_TxnRefNo: transaction.transactionId,
          pp_TxnType: 'MWALLET',
        }
        const sortedKeys = Object.keys(formFields).sort()
        const stringToSign = sortedKeys.map(k => `${k}=${formFields[k]}`).join('&')
        const secureHash = hmacSha256(credentials.integritySalt, stringToSign)
        formFields['pp_SecureHash'] = secureHash
        return json({ success: true, redirect_url: JAZZCASH_URLS.production, form_data: formFields })
      } else if (transaction.paymentMethod === 'easypaisa') {
        return json({
          success: true, redirect_url: EASYPAISA_URLS.production,
          form_data: { merchantId: credentials.merchantId, storeId: credentials.storeId, transactionAmount: transaction.amount, mobileAccountNo: transaction.customerPhone, orderRef: transaction.transactionId }
        })
      }
      return json({ error: 'Invalid payment method' }, 400)
    }

    if (route.startsWith('/v1/payment/live-status/') && method === 'GET') {
      const transactionId = route.split("/")[4]
      const transaction = await prisma.transaction.findUnique({ where: { transactionId } })
      if (!transaction) return json({ error: 'Transaction not found' }, 404)
      return json({ transactionId: transaction.transactionId, status: transaction.status, amount: transaction.amount, paymentMethod: transaction.paymentMethod, gatewayResponse: transaction.gatewayResponse, lastChecked: new Date().toISOString() })
    }

    // ===== USERS =====
    if (route === '/users' && method === 'GET') {
      const user = requireAdmin(req)
      if (!user) return json({ error: 'Admin access required' }, 401)
      const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, select: { id: true, email: true, name: true, role: true, status: true, balance: true, feePercentage: true, createdAt: true } })
      return json({ users })
    }

    if (route.startsWith('/users/') && method === 'PATCH') {
      const user = requireAdmin(req)
      if (!user) return json({ error: 'Admin access required' }, 401)
      const id = route.split("/")[2]
      const body = await req.json()
      const item = await prisma.user.update({ where: { id }, data: body })
      return json({ user: item })
    }

    if (route.startsWith('/users/') && method === 'DELETE') {
      const user = requireAdmin(req)
      if (!user) return json({ error: 'Admin access required' }, 401)
      const id = route.split("/")[2]
      await prisma.user.delete({ where: { id } })
      return json({ success: true })
    }

    // ===== PAYMENT GATEWAYS =====
    if (route === '/payment-gateways' && method === 'GET') {
      const gateways = await prisma.paymentGateway.findMany({ orderBy: { createdAt: 'desc' } })
      return json({ items: gateways })
    }

    if (route.startsWith('/payment-gateways/') && method === 'PATCH') {
      const user = requireAdmin(req)
      if (!user) return json({ error: 'Admin access required' }, 401)
      const id = route.split("/")[2]
      const body = await req.json()
      const item = await prisma.paymentGateway.update({ where: { id }, data: body })
      return json({ gateway: item })
    }

    // ===== SETTINGS =====
    if (route === '/settings' && method === 'GET') {
      const settings = await prisma.setting.findMany()
      return json({ settings })
    }

    if (route === '/settings' && method === 'POST') {
      const user = requireAdmin(req)
      if (!user) return json({ error: 'Admin access required' }, 401)
      const body = await req.json()
      const { key, value } = body
      await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
      return json({ success: true })
    }

    // ===== NOTIFICATIONS =====
    if (route === '/notifications' && method === 'GET') {
      const user = requireAuth(req)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const notifications = await prisma.notification.findMany({ where: { userId: user.userId }, orderBy: { createdAt: 'desc' }, take: 50 })
      return json({ notifications })
    }

    // ===== API LOGS =====
    if (route === '/api-logs' && method === 'GET') {
      const user = requireAdmin(req)
      if (!user) return json({ error: 'Admin access required' }, 401)
      const logs = await prisma.apiLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
      return json({ logs })
    }

    // ===== API CREDENTIALS =====
    if (route === '/api-credentials' && method === 'GET') {
      const user = requireAuth(req)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const items = await prisma.apiCredential.findMany({ where: { userId: user.userId }, orderBy: { createdAt: 'desc' } })
      return json({ items, total: items.length })
    }

    if (route === '/api-credentials' && method === 'POST') {
      const user = requireAuth(req)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const body = await req.json().catch(() => ({}))
      const apiKey = generateApiKey()
      const secretKey = generateSecretKey()
      const cred = await prisma.apiCredential.create({ data: { userId: user.userId, apiKey, secretKey, permissions: body.permissions || 'read,write' } })
      return json({ ...cred, secretKey })
    }

    if (route.startsWith('/api-credentials/') && method === 'PATCH') {
      const user = requireAuth(req)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const id = route.split("/")[2]
      const body = await req.json()
      const existing = await prisma.apiCredential.findUnique({ where: { id } })
      if (!existing) return json({ error: 'Not found' }, 404)
      if (existing.userId !== user.userId) return json({ error: 'Access denied' }, 403)
      const item = await prisma.apiCredential.update({ where: { id }, data: body })
      return json(item)
    }

    // ===== LEDGER =====
    if (route === '/ledgers' && method === 'GET') {
      const user = requireAdmin(req)
      if (!user) return json({ error: 'Admin access required' }, 401)
      const ledgers = await prisma.ledger.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
      return json({ ledgers })
    }

    if (route === '/ledger' && method === 'GET') {
      const user = requireAuth(req)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const ledger = await prisma.ledger.findMany({ where: { userId: user.userId }, orderBy: { createdAt: 'desc' }, take: 50 })
      return json({ ledger })
    }

    // ===== CALLBACKS =====
    if (route === '/v1/payment/callback/jazzcash' && method === 'POST') {
      return json({ message: 'JazzCash callback received' })
    }

    if (route === '/v1/payment/callback/easypaisa' && method === 'POST') {
      return json({ message: 'EasyPaisa callback received' })
    }

    // 404
    return json({ error: 'Not found', route }, 404)
  } catch (e: any) {
    console.error(`[API Error] ${route}:`, e.message)
    return json({ error: e.message }, 500)
  }
}
