'use client'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import {
  BarChart3, Users, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, Activity, Settings, LogOut,
  CreditCard, FileText, Search,
  Plus, Trash2, Eye, RefreshCw, AlertTriangle, CheckCircle,
  XCircle, Clock, Server, Smartphone, Bell, Download,
  ToggleLeft, ToggleRight, Shield, Lock, Edit, Percent,
  Copy, Check, Globe, Link as LinkIcon, Wallet,
  Zap, Loader2
} from 'lucide-react'

interface AdminPanelProps {
  user: { email: string; name: string; role: string }
  onLogout: () => void
}

export default function AdminPanel({ user, onLogout }: AdminPanelProps) {
  const getToken = (): string => {
    const ls = localStorage.getItem('pb_token')
    if (ls) return ls
    const match = document.cookie.match(/(?:^|;\s*)pb_token=([^;]*)/)
    if (match) return decodeURIComponent(match[1])
    return ''
  }
  const authHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` })
  const authUrl = (url: string) => {
    const token = getToken()
    if (!token) return url
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}token=${encodeURIComponent(token)}`
  }
  const authFetch = (url: string, init?: RequestInit) => {
    const token = getToken()
    if (token) document.cookie = `pb_token=${token}; path=/; max-age=${7*24*60*60}; SameSite=Lax`
    return fetch(authUrl(url), { ...init, headers: { ...authHeaders(), ...init?.headers } })
  }

  const handleLogout = async () => {
    try { await authFetch('/api/auth/logout', { method: 'POST' }) } catch {}
    localStorage.removeItem('pb_token')
    document.cookie = 'pb_token=; path=/; max-age=0'
    onLogout()
  }

  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, totalTransactions: 0, successful: 0, failed: 0, pending: 0, totalCashIn: 0, totalCashOut: 0, totalFeeCut: 0, totalRemainingBalance: 0 })
  const [usersSummary, setUsersSummary] = useState<{ totalGross: number; totalFeeCut: number; totalRemainingBalance: number; totalMerchants: number } | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [gateways, setGateways] = useState<any[]>([])
  const [apiLogs, setApiLogs] = useState<any[]>([])
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', phone: '', feePercentage: '2.0' })
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [editUserName, setEditUserName] = useState('')
  const [editUserPhone, setEditUserPhone] = useState('')
  const [editUserStatus, setEditUserStatus] = useState('active')
  const [editUserFee, setEditUserFee] = useState('2.0')
  const [editUserBalance, setEditUserBalance] = useState('0')
  const [editUserLoading, setEditUserLoading] = useState(false)
  const [editUserMsg, setEditUserMsg] = useState<{ type: string; text: string } | null>(null)
  const [viewUserDialogOpen, setViewUserDialogOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null)
  const [savedGwId, setSavedGwId] = useState<string | null>(null)
  const [liveStatusCheck, setLiveStatusCheck] = useState<Record<string, any>>({})
  const [checkingTxId, setCheckingTxId] = useState<string | null>(null)
  const [liveTestDialogOpen, setLiveTestDialogOpen] = useState(false)
  const [liveTestMethod, setLiveTestMethod] = useState('easypaisa')
  const [liveTestAmount, setLiveTestAmount] = useState('100')
  const [liveTestPhone, setLiveTestPhone] = useState('')
  const [liveTestLoading, setLiveTestLoading] = useState(false)
  const [liveTestResult, setLiveTestResult] = useState<any>(null)
  const [backups, setBackups] = useState<any[]>([])
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupMsg, setBackupMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [restoringBackup, setRestoringBackup] = useState<string | null>(null)
  const [createUserMsg, setCreateUserMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password reset for merchants
  const [resetPwDialogOpen, setResetPwDialogOpen] = useState(false)
  const [resetPwUser, setResetPwUser] = useState<any>(null)
  const [resetPwNew, setResetPwNew] = useState('')
  const [resetPwConfirm, setResetPwConfirm] = useState('')
  const [resetPwLoading, setResetPwLoading] = useState(false)
  const [resetPwMsg, setResetPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Approve merchant dialog
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [approveUser, setApproveUser] = useState<any>(null)
  const [approveFee, setApproveFee] = useState('2.0')
  const [approveLoading, setApproveLoading] = useState(false)
  const [approveMsg, setApproveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleResetMerchantPassword = async () => {
    if (!resetPwUser) return
    setResetPwMsg(null)
    if (!resetPwNew || !resetPwConfirm) {
      setResetPwMsg({ type: 'error', text: 'Please fill in both fields' })
      return
    }
    if (resetPwNew.length < 8) {
      setResetPwMsg({ type: 'error', text: 'Password must be at least 8 characters' })
      return
    }
    if (resetPwNew !== resetPwConfirm) {
      setResetPwMsg({ type: 'error', text: 'Passwords do not match' })
      return
    }
    setResetPwLoading(true)
    try {
      const res = await authFetch('/api/admin/reset-user-password', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ userId: resetPwUser.id, newPassword: resetPwNew })
      })
      const data = await res.json()
      if (res.ok) {
        setResetPwMsg({ type: 'success', text: `Password reset successfully for ${resetPwUser.email}` })
        setResetPwNew('')
        setResetPwConfirm('')
        setTimeout(() => { setResetPwDialogOpen(false); setResetPwUser(null); setResetPwMsg(null) }, 1500)
      } else {
        setResetPwMsg({ type: 'error', text: data.error || 'Failed to reset password' })
      }
    } catch {
      setResetPwMsg({ type: 'error', text: 'Network error. Please try again.' })
    } finally { setResetPwLoading(false) }
  }

  const handleApproveUser = async () => {
    if (!approveUser) return
    setApproveMsg(null)
    setApproveLoading(true)
    try {
      const res = await authFetch('/api/admin/approve-user', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ userId: approveUser.id, feePercentage: parseFloat(approveFee || '2.0') })
      })
      const data = await res.json()
      if (res.ok) {
        setApproveMsg({ type: 'success', text: `${approveUser.email} approved with ${approveFee}% fee!` })
        fetchUsers()
        fetchStats()
        setTimeout(() => { setApproveDialogOpen(false); setApproveUser(null); setApproveMsg(null) }, 1500)
      } else {
        setApproveMsg({ type: 'error', text: data.error || 'Failed to approve' })
      }
    } catch {
      setApproveMsg({ type: 'error', text: 'Network error. Please try again.' })
    } finally { setApproveLoading(false) }
  }

  const handleRejectUser = async (u: any) => {
    if (!confirm(`Reject ${u.email}? They won't be able to login.`)) return
    try {
      await authFetch('/api/admin/reject-user', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ userId: u.id })
      })
      fetchUsers()
      fetchStats()
    } catch { /* ignore */ }
  }

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopiedUrlId(id)
      setTimeout(() => setCopiedUrlId(null), 2500)
    }
  }

  const fetchStats = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/dashboard')
      const data = await res.json()
      if (res.ok) setStats((prev: any) => ({ ...prev, ...(typeof data === 'object' && data !== null && !Array.isArray(data) ? data : {}) }))
    } catch { /* ignore */ }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/users-financials')
      if (res.ok) {
        const data = await res.json()
        if (data.users) {
          setUsers(data.users)
          setUsersSummary(data.summary || null)
          return
        }
      }
      const fallbackRes = await authFetch('/api/users')
      const fallbackData = await fallbackRes.json()
      if (fallbackRes.ok) setUsers(fallbackData.items || fallbackData || [])
    } catch { /* ignore */ }
  }, [])

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await authFetch('/api/transactions')
      const data = await res.json()
      if (res.ok) { const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []; setTransactions(items) }
    } catch { /* ignore */ }
  }, [])

  const fetchGateways = useCallback(async () => {
    try {
      const res = await authFetch('/api/payment-gateways')
      const data = await res.json()
      if (res.ok) { const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []; setGateways(items) }
    } catch { /* ignore */ }
  }, [])

  const fetchLogs = useCallback(async () => {
    try {
      const res = await authFetch('/api/api-logs')
      const data = await res.json()
      const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []
      setApiLogs(items.slice(0, 50))
    } catch { /* ignore */ }
  }, [])

  const fetchSettings = useCallback(async () => {
    try {
      const res = await authFetch('/api/settings')
      const data = await res.json()
      const map: any = {}
      for (const s of (Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [])) if (s && s.key) map[s.key] = s.value
      setSettings(map)
    } catch { /* ignore */ }
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await authFetch('/api/notifications')
      const data = await res.json()
      const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []
      setNotifications(items.slice(0, 20))
    } catch { /* ignore */ }
  }, [])

  const fetchBackups = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/backups')
      const data = await res.json()
      setBackups(Array.isArray(data?.backups) ? data.backups : [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchStats()
    fetchUsers()
    fetchTransactions()
    fetchGateways()
    fetchLogs()
    fetchSettings()
    fetchNotifications()
    fetchBackups()
  }, [fetchStats, fetchUsers, fetchTransactions, fetchGateways, fetchLogs, fetchSettings, fetchNotifications, fetchBackups])

  const handleCreateUser = async () => {
    setLoading(true)
    setCreateUserMsg(null)
    try {
      const res = await authFetch('/api/admin/create-user', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(newUser)
      })
      const data = await res.json()
      if (res.ok) {
        setCreateUserMsg({ type: 'success', text: `Merchant "${newUser.name}" created successfully! API Key: ${data.apiKey?.slice(0, 20)}...` })
        setNewUser({ name: '', email: '', password: '', phone: '', feePercentage: '2.0' })
        fetchUsers()
        fetchStats()
        setTimeout(() => { setShowUserDialog(false); setCreateUserMsg(null) }, 2500)
      } else {
        setCreateUserMsg({ type: 'error', text: data.error || `Failed to create merchant (HTTP ${res.status})` })
      }
    } catch {
      setCreateUserMsg({ type: 'error', text: 'Network error. Server se connect nahi ho paya.' })
    } finally { setLoading(false) }
  }

  const handleOpenEditUser = (u: any) => {
    setEditingUser(u)
    setEditUserName(u.name || '')
    setEditUserPhone(u.phone || '')
    setEditUserStatus(u.status || 'active')
    setEditUserFee(u.feePercentage !== undefined ? String(u.feePercentage) : '2.0')
    setEditUserBalance(String(u.remainingBalance ?? u.balance ?? 0))
    setEditUserMsg(null)
    setEditUserDialogOpen(true)
  }

  const handleSaveEditUser = async () => {
    if (!editingUser) return
    setEditUserLoading(true)
    setEditUserMsg(null)
    try {
      const res = await authFetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          name: editUserName,
          phone: editUserPhone,
          status: editUserStatus,
          feePercentage: parseFloat(editUserFee || '0'),
          balance: parseFloat(editUserBalance || '0'),
        })
      })
      if (res.ok) {
        setEditUserMsg({ type: 'success', text: 'Merchant fee and details updated successfully!' })
        fetchUsers()
        setTimeout(() => {
          setEditUserDialogOpen(false)
        }, 700)
      } else {
        const d = await res.json()
        setEditUserMsg({ type: 'error', text: d.error || 'Failed to update merchant' })
      }
    } catch {
      setEditUserMsg({ type: 'error', text: 'Network error updating merchant' })
    } finally {
      setEditUserLoading(false)
    }
  }

  const handleUpdateUser = async (userId: string, data: any) => {
    try {
      await authFetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data)
      })
      fetchUsers()
      fetchStats()
    } catch { /* ignore */ }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    try {
      await authFetch(`/api/users/${userToDelete.id}`, { method: 'DELETE', headers: authHeaders() })
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      fetchUsers()
      fetchStats()
    } catch { /* ignore */ }
  }

  const handleChangePassword = async () => {
    setPwMessage(null)
    if (!pwCurrent || !pwNew || !pwConfirm) {
      setPwMessage({ type: 'error', text: 'Please fill in all fields' })
      return
    }
    if (pwNew.length < 8) {
      setPwMessage({ type: 'error', text: 'New password must be at least 8 characters' })
      return
    }
    if (pwNew !== pwConfirm) {
      setPwMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }
    setPwLoading(true)
    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ email: user.email, currentPassword: pwCurrent, newPassword: pwNew, role: 'admin' })
      })
      const data = await res.json()
      if (res.ok) {
        setPwMessage({ type: 'success', text: 'Password changed successfully!' })
        setPwCurrent('')
        setPwNew('')
        setPwConfirm('')
      } else {
        setPwMessage({ type: 'error', text: data.error || 'Failed to change password' })
      }
    } catch {
      setPwMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally { setPwLoading(false) }
  }

  const handleLiveTest = async () => {
    if (!liveTestPhone || liveTestPhone.length < 10) {
      setLiveTestResult({ error: 'Please enter a valid phone number (e.g. 03XXXXXXXXX)' })
      return
    }
    setLiveTestLoading(true)
    setLiveTestResult(null)
    try {
      const res = await authFetch('/api/admin/live-test', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ method: liveTestMethod, amount: parseFloat(liveTestAmount) || 100, phone: liveTestPhone }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setLiveTestResult(data)
        fetchStats()
        fetchTransactions()
      } else {
        setLiveTestResult({ error: data.error || 'Test failed' })
      }
    } catch {
      setLiveTestResult({ error: 'Network error. Please try again.' })
    } finally {
      setLiveTestLoading(false)
    }
  }

  const handleLiveTestRedirect = () => {
    if (!liveTestResult?.redirect_url || !liveTestResult?.form_data) return
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = liveTestResult.redirect_url
    form.target = '_blank'
    Object.entries(liveTestResult.form_data).forEach(([key, value]) => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = key
      input.value = String(value)
      form.appendChild(input)
    })
    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
  }

  const handleUpdateGateway = async (id: string, data: any) => {
    try {
      const res = await authFetch(`/api/payment-gateways/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data)
      })
      if (res.ok) {
        setSavedGwId(id)
        setTimeout(() => setSavedGwId(null), 3500)
      }
      fetchGateways()
    } catch { /* ignore */ }
  }

  const checkGatewayStatus = async (transactionId: string) => {
    setCheckingTxId(transactionId)
    try {
      const res = await authFetch('/api/admin/payment/check-gateway-status', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ transactionId })
      })
      const data = await res.json()
      setLiveStatusCheck(prev => ({ ...prev, [transactionId]: data }))
      // Refresh transactions to pick up any status changes
      fetchTransactions()
      fetchStats()
    } catch { /* ignore */ }
    setCheckingTxId(null)
  }

  const statCards = [
    { label: 'Total Merchants', value: stats.totalUsers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Active Merchants', value: stats.activeUsers, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Total Volume (Gross)', value: `Rs ${(stats.totalCashIn || 0).toLocaleString()}`, icon: ArrowDownRight, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Platform Fee Cut (Revenue)', value: `Rs ${(stats.totalFeeCut || 0).toLocaleString()}`, icon: Percent, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Merchants Baqi Balance', value: `Rs ${(stats.totalRemainingBalance || 0).toLocaleString()}`, icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Successful Transactions', value: stats.successful, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Failed', value: stats.failed, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  ]

  const filteredUsers = users.filter(u => {
    if (searchQuery && !u.name?.toLowerCase().includes(searchQuery.toLowerCase()) && !u.email?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterStatus !== 'all' && u.status !== filterStatus) return false
    return true
  })

  const filteredTransactions = transactions.filter(t => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!t.transactionId?.toLowerCase().includes(q) && !t.orderId?.toLowerCase().includes(q)) return false
    }
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    return true
  })

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#111827] border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-400" />
              Delete User
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to permanently delete <strong className="text-white">{userToDelete?.name || userToDelete?.email}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" className="border-white/10" onClick={() => { setDeleteDialogOpen(false); setUserToDelete(null) }}>
              Cancel
            </Button>
            <Button className="bg-red-500 hover:bg-red-600" onClick={handleDeleteUser}>
              <Trash2 size={14} className="mr-2" /> Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Merchant & Fee Dialog */}
      <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent className="bg-[#111827] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit size={18} className="text-emerald-400" />
              Edit Merchant Settings
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Update {editingUser?.email}&apos;s profile and transaction percentage fee.
            </DialogDescription>
          </DialogHeader>

          {editUserMsg && (
            <div className={`p-3 rounded-lg text-sm ${editUserMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
              {editUserMsg.text}
            </div>
          )}

          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                className="bg-[#1a2332] border-white/10"
                value={editUserName}
                onChange={e => setEditUserName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                disabled
                className="bg-[#1a2332]/50 border-white/5 text-gray-400 cursor-not-allowed"
                value={editingUser?.email || ''}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                className="bg-[#1a2332] border-white/10"
                value={editUserPhone}
                onChange={e => setEditUserPhone(e.target.value)}
              />
            </div>

            <div className="p-4 rounded-xl bg-[#1a2332] border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Percent size={15} /> Percentage Fee (%)
                </Label>
                <span className="text-xs text-gray-400">Per transaction</span>
              </div>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                className="bg-[#111827] border-white/20 text-lg font-mono font-bold text-white"
                value={editUserFee}
                onChange={e => setEditUserFee(e.target.value)}
              />
              <p className="text-xs text-gray-400">
                This fee percentage will apply to all EasyPaisa and JazzCash payments for this merchant.
              </p>
            </div>

            {/* Balance Section */}
            <div className="p-4 rounded-xl bg-[#1a2332] border border-blue-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-blue-400 font-semibold flex items-center gap-1.5">
                  <Wallet size={15} /> Merchant Balance (Rs)
                </Label>
                <span className="text-xs text-gray-400">Remaining balance</span>
              </div>
              <Input
                type="number"
                step="1"
                min="0"
                className="bg-[#111827] border-white/20 text-lg font-mono font-bold text-white"
                value={editUserBalance}
                onChange={e => setEditUserBalance(e.target.value)}
              />
              <p className="text-xs text-gray-400">
                Merchant ka current balance. Fee cut ke baad jo amount baaki hai — usay yahan se adjust kar sakte hain.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Account Status</Label>
              <Select value={editUserStatus} onValueChange={setEditUserStatus}>
                <SelectTrigger className="bg-[#1a2332] border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a2332] border-white/10">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button variant="outline" className="border-white/10" onClick={() => setEditUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={handleSaveEditUser} disabled={editUserLoading}>
              {editUserLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Merchant Details Dialog */}
      <Dialog open={viewUserDialogOpen} onOpenChange={setViewUserDialogOpen}>
        <DialogContent className="bg-[#111827] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye size={18} className="text-blue-400" />
              Merchant Details
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-[#1a2332] rounded-lg">
                  <span className="text-xs text-gray-400 block">Full Name</span>
                  <span className="font-medium text-white">{selectedUser.name || 'Unnamed'}</span>
                </div>
                <div className="p-3 bg-[#1a2332] rounded-lg">
                  <span className="text-xs text-gray-400 block">Status</span>
                  <Badge className={selectedUser.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mt-1' : 'bg-red-500/20 text-red-400 border-red-500/30 mt-1'}>
                    {selectedUser.status}
                  </Badge>
                </div>
                <div className="p-3 bg-[#1a2332] rounded-lg col-span-2">
                  <span className="text-xs text-gray-400 block">Email</span>
                  <span className="font-mono text-white text-xs">{selectedUser.email}</span>
                </div>
                <div className="p-3 bg-[#1a2332] rounded-lg">
                  <span className="text-xs text-gray-400 block">Phone</span>
                  <span className="text-white">{selectedUser.phone || 'N/A'}</span>
                </div>
                <div className="p-3 bg-[#1a2332] rounded-lg">
                  <span className="text-xs text-gray-400 block">Joined</span>
                  <span className="text-gray-300 text-xs">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Financial Calculation & Breakdown */}
              <div className="p-4 bg-[#1a2332] rounded-xl border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Wallet size={14} /> Financial Breakdown (Hisaab)
                  </span>
                  <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[11px] font-mono">
                    Fee: {selectedUser.feePercentage !== undefined ? `${selectedUser.feePercentage}%` : '2.0%'}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm pt-1">
                  <div className="flex justify-between items-center text-gray-300">
                    <span className="text-xs">1. Total Received (Gross Volume):</span>
                    <span className="font-semibold font-mono text-white">
                      Rs {(selectedUser.totalGross || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-300">
                    <span className="text-xs">2. Merchant Fee Rate:</span>
                    <span className="font-mono text-emerald-400">
                      {selectedUser.feePercentage !== undefined ? `${selectedUser.feePercentage}%` : '2.0%'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-rose-400">
                    <span className="text-xs">3. Fee Cut (Kati Hui Fee):</span>
                    <span className="font-mono font-medium">
                      - Rs {(selectedUser.totalFeeCut || 0).toLocaleString()}
                    </span>
                  </div>
                  <Separator className="bg-white/10 my-1" />
                  <div className="flex justify-between items-center text-emerald-400 font-bold">
                    <span className="text-xs sm:text-sm">4. Remaining Balance (Baqi Balance):</span>
                    <span className="text-base font-mono text-emerald-300">
                      Rs {(selectedUser.remainingBalance ?? selectedUser.balance ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded bg-black/40 border border-white/5 text-[11px] text-gray-400 font-mono">
                  Gross (Rs {(selectedUser.totalGross || 0).toLocaleString()}) − Fee Cut (Rs {(selectedUser.totalFeeCut || 0).toLocaleString()}) = Baqi (Rs {(selectedUser.remainingBalance ?? selectedUser.balance ?? 0).toLocaleString()})
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={() => {
                  setViewUserDialogOpen(false)
                  handleOpenEditUser(selectedUser)
                }}>
                  <Edit size={14} className="mr-2" /> Edit Merchant &amp; Fee
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Merchant Password Dialog */}
      <Dialog open={resetPwDialogOpen} onOpenChange={setResetPwDialogOpen}>
        <DialogContent className="bg-[#111827] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock size={18} className="text-yellow-400" />
              Reset Merchant Password
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Set a new password for <strong className="text-white">{resetPwUser?.email}</strong> ({resetPwUser?.name || 'Unnamed'})
            </DialogDescription>
          </DialogHeader>

          {resetPwMsg && (
            <div className={`p-3 rounded-lg text-sm ${resetPwMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
              {resetPwMsg.text}
            </div>
          )}

          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input
                type="password"
                className="bg-[#1a2332] border-white/10"
                value={resetPwNew}
                onChange={e => setResetPwNew(e.target.value)}
                placeholder="Min 8 characters"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                className="bg-[#1a2332] border-white/10"
                value={resetPwConfirm}
                onChange={e => setResetPwConfirm(e.target.value)}
                placeholder="Re-enter password"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button variant="outline" className="border-white/10" onClick={() => { setResetPwDialogOpen(false); setResetPwUser(null); setResetPwMsg(null) }}>
              Cancel
            </Button>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black" onClick={handleResetMerchantPassword} disabled={resetPwLoading}>
              <Lock size={14} className="mr-2" />
              {resetPwLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Live Test Dialog */}
      <Dialog open={liveTestDialogOpen} onOpenChange={(open) => { setLiveTestDialogOpen(open); if (!open) setLiveTestResult(null) }}>
        <DialogContent className="bg-[#111827] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap size={18} className="text-yellow-400" />
              Live Test Transaction
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Send a REAL payment request to JazzCash / EasyPaisa gateway. Your phone will receive the payment prompt.
            </DialogDescription>
          </DialogHeader>

          {!liveTestResult ? (
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setLiveTestMethod('easypaisa')}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      liveTestMethod === 'easypaisa'
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Smartphone size={20} className="mx-auto mb-1 text-emerald-400" />
                    <div className="text-sm font-medium">EasyPaisa</div>
                  </button>
                  <button
                    onClick={() => setLiveTestMethod('jazzcash')}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      liveTestMethod === 'jazzcash'
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Smartphone size={20} className="mx-auto mb-1 text-red-400" />
                    <div className="text-sm font-medium">JazzCash</div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Test Amount (Rs)</Label>
                <Input
                  type="number"
                  min="100"
                  max="500000"
                  className="bg-[#1a2332] border-white/10 font-mono"
                  value={liveTestAmount}
                  onChange={e => setLiveTestAmount(e.target.value)}
                />
                <p className="text-[11px] text-gray-400">Min Rs 100, Max Rs 500,000</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Your Phone Number</Label>
                <Input
                  type="tel"
                  placeholder="03XXXXXXXXX"
                  className="bg-[#1a2332] border-white/10 font-mono"
                  value={liveTestPhone}
                  onChange={e => setLiveTestPhone(e.target.value)}
                />
                <p className="text-[11px] text-gray-400">Real payment request bheja jayega is number pe</p>
              </div>

              <Button
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                onClick={handleLiveTest}
                disabled={liveTestLoading || !liveTestAmount || parseFloat(liveTestAmount) < 100}
              >
                {liveTestLoading ? (
                  <><Loader2 size={16} className="mr-2 animate-spin" /> Processing...</>
                ) : (
                  <><Zap size={16} className="mr-2" /> Run Live Test</>
                )}
              </Button>
            </div>
          ) : liveTestResult.error ? (
            <div className="space-y-4 mt-2">
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
                <XCircle size={40} className="mx-auto mb-3 text-red-400" />
                <p className="text-red-400 font-medium">Test Failed</p>
                <p className="text-sm text-gray-400 mt-1">{liveTestResult.error}</p>
              </div>
              <Button variant="outline" className="w-full border-white/10" onClick={() => setLiveTestResult(null)}>
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <CheckCircle size={48} className="mx-auto mb-3 text-emerald-400" />
                <p className="text-emerald-400 font-bold text-lg">Transaction Ready!</p>
                <p className="text-sm text-gray-400 mt-1">{liveTestResult.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-[#1a2332] rounded-lg">
                  <span className="text-xs text-gray-400 block">Transaction ID</span>
                  <span className="font-mono text-white text-xs">{liveTestResult.transaction_id}</span>
                </div>
                <div className="p-3 bg-[#1a2332] rounded-lg">
                  <span className="text-xs text-gray-400 block">Amount</span>
                  <span className="font-mono text-emerald-400">Rs {liveTestResult.amount}</span>
                </div>
                <div className="p-3 bg-[#1a2332] rounded-lg">
                  <span className="text-xs text-gray-400 block">Platform Fee</span>
                  <span className="font-mono text-yellow-400">Rs {liveTestResult.fee}</span>
                </div>
                <div className="p-3 bg-[#1a2332] rounded-lg">
                  <span className="text-xs text-gray-400 block">Gateway</span>
                  <Badge className='bg-red-500/20 text-red-400 border-red-500/30'>
                    🔴 PRODUCTION (Real!)
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-white/10" onClick={() => setLiveTestResult(null)}>
                  New Test
                </Button>
                <Button
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                  onClick={handleLiveTestRedirect}
                >
                  <Zap size={14} className="mr-2" /> Pay to Gateway
                </Button>
              </div>
              <p className="text-[11px] text-gray-400 text-center">
                ⚠️ "Pay to Gateway" button real JazzCash/EasyPaisa page kholega — wahan se actual payment process hogi
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Merchant Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="bg-[#111827] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-400" />
              Approve Merchant
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Set transaction fee and activate <strong className="text-white">{approveUser?.email}</strong> ({approveUser?.name || 'Unnamed'})
            </DialogDescription>
          </DialogHeader>

          {approveMsg && (
            <div className={`p-3 rounded-lg text-sm ${approveMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
              {approveMsg.text}
            </div>
          )}

          <div className="space-y-4 mt-2">
            <div className="p-4 rounded-xl bg-[#1a2332] border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Percent size={15} /> Transaction Fee (%)
                </Label>
                <span className="text-xs text-gray-400">Commission per transaction</span>
              </div>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                className="bg-[#111827] border-white/20 text-lg font-mono font-bold text-white"
                value={approveFee}
                onChange={e => setApproveFee(e.target.value)}
                placeholder="e.g. 2.5"
              />
              <p className="text-xs text-gray-400">
                Yeh fee har EasyPaisa/JazzCash transaction pe lagegi. Admin approve karega to merchant active ho jayega.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button variant="outline" className="border-white/10" onClick={() => { setApproveDialogOpen(false); setApproveUser(null); setApproveMsg(null) }}>
              Cancel
            </Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={handleApproveUser} disabled={approveLoading}>
              {approveLoading ? 'Approving...' : '✓ Approve & Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Top Bar */}
      <div className="bg-[#111827] border-b border-white/10 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-bold text-sm">P</div>
          <span className="font-bold text-lg">PayBridge</span>
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 ml-2">Admin</Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Bell size={18} className="text-gray-400" />
            {(Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center">
                {Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-400">{user.name || user.email}</div>
          <Button variant="ghost" size="sm" onClick={onLogout} className="text-gray-400 hover:text-white">
            <LogOut size={16} />
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-56 bg-[#111827] border-r border-white/10 min-h-[calc(100vh-52px)] p-3 space-y-1">
          {[
            { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
            { id: 'users', icon: Users, label: 'User Management' },
            { id: 'transactions', icon: CreditCard, label: 'Transactions' },
            { id: 'gateways', icon: Server, label: 'Payment Gateways' },
            { id: 'logs', icon: FileText, label: 'API Logs' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                activeTab === item.id ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto" style={{ maxHeight: 'calc(100vh - 52px)' }}>
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Admin Dashboard</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((s, i) => (
                  <Card key={i} className="bg-[#111827] border-white/10">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">{s.label}</span>
                        <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                          <s.icon size={16} className={s.color} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold">{s.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Gateway Status */}
              <Card className="bg-[#111827] border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg">Gateway Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {(Array.isArray(gateways) ? gateways : []).map((gw: any) => (
                      <div key={gw.id} className="flex items-center justify-between p-4 rounded-xl bg-[#1a2332] border border-white/5">
                        <div className="flex items-center gap-3">
                          <Smartphone size={20} className="text-emerald-400" />
                          <div>
                            <div className="font-medium">{gw.displayName || gw.name}</div>
                            <div className="text-xs text-gray-400">Live Mode</div>
                          </div>
                        </div>
                        <Badge className={gw.isEnabled ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                          {gw.isEnabled ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                    ))}
                    {gateways.length === 0 && <p className="text-gray-500 text-sm">No gateways configured</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card className="bg-[#111827] border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-gray-400">ID</TableHead>
                        <TableHead className="text-gray-400">Amount</TableHead>
                        <TableHead className="text-gray-400">Method</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(transactions) ? transactions : []).slice(0, 5).map((t: any) => (
                        <TableRow key={t.id} className="border-white/10">
                          <TableCell className="font-mono text-xs">{t.transactionId}</TableCell>
                          <TableCell>Rs {t.amount?.toLocaleString()}</TableCell>
                          <TableCell className="capitalize">{t.paymentMethod}</TableCell>
                          <TableCell>
                            <Badge className={
                              t.status === 'successful' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                              t.status === 'failed' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                            }>
                              {t.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400 text-sm">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {transactions.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-8">No transactions yet</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">User &amp; Merchant Management</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Manage merchants, update transaction fee rates, and control account statuses</p>
                </div>
                <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
                  <DialogTrigger>
                    <Button className="bg-emerald-500 hover:bg-emerald-600"><Plus size={16} className="mr-2" /> Create Merchant</Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#111827] border-white/10">
                    <DialogHeader>
                      <DialogTitle>Create New Merchant</DialogTitle>
                      <DialogDescription className="text-gray-400 text-xs">
                        Register a merchant account. Enter their customized percentage fee rate below.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                    {createUserMsg && (
                      <div className={`p-3 rounded-lg text-sm ${createUserMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                        {createUserMsg.text}
                      </div>
                    )}
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input className="bg-[#1a2332] border-white/10" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" className="bg-[#1a2332] border-white/10" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <Input type="password" className="bg-[#1a2332] border-white/10" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input className="bg-[#1a2332] border-white/10" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} />
                      </div>
                      <div className="space-y-2 p-3 bg-[#1a2332] rounded-lg border border-emerald-500/20">
                        <div className="flex items-center justify-between">
                          <Label className="text-emerald-400 font-semibold flex items-center gap-1.5">
                            <Percent size={14} /> Percentage Fee (%)
                          </Label>
                          <span className="text-xs text-gray-400">Commission rate</span>
                        </div>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          placeholder="2.0"
                          className="bg-[#111827] border-white/10 font-mono text-emerald-300"
                          value={newUser.feePercentage}
                          onChange={e => setNewUser({ ...newUser, feePercentage: e.target.value })}
                        />
                        <p className="text-[11px] text-gray-400">
                          Percentage fee deducted per transaction. Fixed fee is removed (0 Rs).
                        </p>
                      </div>
                      <Button className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={handleCreateUser} disabled={loading}>
                        {loading ? 'Creating...' : 'Create Merchant'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <Input placeholder="Search users..." className="bg-[#111827] border-white/10 pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-36 bg-[#111827] border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1a2332] border-white/10">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card className="bg-[#111827] border-white/10">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-gray-400">Merchant</TableHead>
                        <TableHead className="text-gray-400">Fee %</TableHead>
                        <TableHead className="text-gray-400">Gross (Rs)</TableHead>
                        <TableHead className="text-gray-400">Fee Cut (Rs)</TableHead>
                        <TableHead className="text-gray-400">Balance (Rs)</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(filteredUsers) ? filteredUsers : []).map((u: any) => (
                        <TableRow key={u.id} className="border-white/10">
                          <TableCell>
                            <div>
                              <div className="font-medium">{u.name || 'Unnamed'}</div>
                              <div className="text-xs text-gray-400">{u.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-mono text-xs">
                              {u.feePercentage !== undefined ? `${u.feePercentage}%` : '2.0%'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs text-gray-300">
                              Rs {(u.totalGross || 0).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-red-500/15 text-red-300 border-red-500/30 font-mono text-xs">
                              Rs {(u.totalFeeCut || 0).toLocaleString()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm text-emerald-400 font-semibold">
                              Rs {(u.remainingBalance ?? u.balance ?? 0).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              u.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                              u.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                              'bg-red-500/20 text-red-400 border-red-500/30'
                            }>
                              {u.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {u.status === 'pending' ? (
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => { setApproveUser(u); setApproveFee(u.feePercentage !== undefined ? String(u.feePercentage) : '2.0'); setApproveMsg(null); setApproveDialogOpen(true) }}
                                  className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                  title="Approve merchant"
                                >
                                  <CheckCircle size={14} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRejectUser(u)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  title="Reject merchant"
                                >
                                  <XCircle size={14} />
                                </Button>
                              </div>
                            ) : (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditUser(u)}
                                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                title="Edit merchant & fee"
                              >
                                <Edit size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setSelectedUser(u); setViewUserDialogOpen(true) }}
                                title="View details"
                              >
                                <Eye size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setResetPwUser(u); setResetPwNew(''); setResetPwConfirm(''); setResetPwMsg(null); setResetPwDialogOpen(true) }}
                                title="Reset merchant password"
                                className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                              >
                                <Lock size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateUser(u.id, { status: u.status === 'active' ? 'blocked' : 'active' })}
                                title="Toggle active/blocked"
                              >
                                {u.status === 'active' ? <ToggleRight size={14} className="text-emerald-400" /> : <ToggleLeft size={14} className="text-red-400" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setUserToDelete(u); setDeleteDialogOpen(true) }}
                                className="text-red-400 hover:text-red-300"
                                title="Delete merchant"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredUsers.length === 0 && (
                        <TableRow><TableCell colSpan={7} className="text-center text-gray-500 py-8">No users found</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Transactions</h2>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <Input placeholder="Search by ID or Order ID..." className="bg-[#111827] border-white/10 pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-36 bg-[#111827] border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1a2332] border-white/10">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="successful">Successful</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="border-white/10" onClick={() => {
                  const csv = ['Transaction ID,Order ID,Amount,Method,Status,Date'].concat(
                    (Array.isArray(filteredTransactions) ? filteredTransactions : []).map((t: any) => `${t.transactionId},${t.orderId || ''},${t.amount},${t.paymentMethod},${t.status},${t.createdAt}`)
                  ).join('\n')
                  const blob = new Blob([csv], { type: 'text/csv' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a'); a.href = url; a.download = 'transactions.csv'; a.click()
                }}>
                  <Download size={16} className="mr-2" /> Export CSV
                </Button>
              </div>

              <Card className="bg-[#111827] border-white/10">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-gray-400">Transaction ID</TableHead>
                        <TableHead className="text-gray-400">Order ID</TableHead>
                        <TableHead className="text-gray-400">Amount</TableHead>
                        <TableHead className="text-gray-400">Fee</TableHead>
                        <TableHead className="text-gray-400">Method</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">Live Check</TableHead>
                        <TableHead className="text-gray-400">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(filteredTransactions) ? filteredTransactions : []).map((t: any) => {
                        const statusResult = liveStatusCheck[t.transactionId]
                        return (
                        <TableRow key={t.id} className="border-white/10">
                          <TableCell className="font-mono text-xs">{t.transactionId}</TableCell>
                          <TableCell className="text-sm">{t.orderId || '-'}</TableCell>
                          <TableCell>Rs {t.amount?.toLocaleString()}</TableCell>
                          <TableCell className="text-gray-400">Rs {t.fee?.toLocaleString() || 0}</TableCell>
                          <TableCell className="capitalize">{t.paymentMethod}</TableCell>
                          <TableCell>
                            <Badge className={
                              t.status === 'successful' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                              t.status === 'failed' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              t.status === 'cancelled' ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' :
                              'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                            }>
                              {t.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] px-2"
                                onClick={() => checkGatewayStatus(t.transactionId)}
                                disabled={checkingTxId === t.transactionId}
                              >
                                {checkingTxId === t.transactionId ? (
                                  <Loader2 size={10} className="animate-spin mr-1" />
                                ) : (
                                  <RefreshCw size={10} className="mr-1" />
                                )}
                                {checkingTxId === t.transactionId ? 'Checking...' : 'Check Gateway'}
                              </Button>
                              {statusResult && (
                                <div className="text-[10px]">
                                  <Badge className={
                                    statusResult.gatewayStatus === 'successful' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                    statusResult.gatewayStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                    statusResult.gatewayStatus === 'failed' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                    'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                  }>
                                    GW: {String(statusResult.gatewayStatus).slice(0, 15)}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-400 text-sm">{new Date(t.createdAt).toLocaleString()}</TableCell>
                        </TableRow>
                        )
                      })}
                      {filteredTransactions.length === 0 && (
                        <TableRow><TableCell colSpan={8} className="text-center text-gray-500 py-8">No transactions found</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Gateways Tab */}
          {activeTab === 'gateways' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">Payment Gateway Settings</h2>
                  <p className="text-sm text-gray-400">Manage JazzCash &amp; EasyPaisa live integrations with domain-aware callback URLs</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                    onClick={() => { setLiveTestResult(null); setLiveTestDialogOpen(true) }}
                  >
                    <Zap size={16} className="mr-2" /> Live Test Transaction
                  </Button>
                </div>
                <div className="flex items-center gap-2 bg-[#111827] border border-emerald-500/30 rounded-lg px-3 py-1.5 text-xs text-gray-300">
                  <Globe size={14} className="text-emerald-400 shrink-0" />
                  <span>Detected Domain:</span>
                  <strong className="text-emerald-400 font-mono">{typeof window !== 'undefined' ? window.location.origin : ''}</strong>
                </div>
              </div>

              {/* Auto-Detected Domain Overview Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#111827] to-[#111827] border border-emerald-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Globe size={18} className="text-emerald-400" />
                    <span className="font-semibold text-sm text-emerald-300">Active Domain &amp; Auto-Detected Callback URLs</span>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-mono text-xs px-2.5 py-0.5">
                    Live Webhook Ready
                  </Badge>
                </div>
                <p className="text-xs text-gray-300">
                  EasyPaisa aur JazzCash dono ke Callback / Return URLs aapke active domain (<span className="text-emerald-400 font-mono">{typeof window !== 'undefined' ? window.location.origin : ''}</span>) ko dekh kar khud-ba-khud generate ho chuke hain. Apne merchant portal mein yehi links paste karein:
                </p>
                <div className="grid md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-[#1a2332]/80 border border-emerald-500/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <Smartphone size={13} /> EasyPaisa Callback (IPN) URL
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                        onClick={() => copyToClipboard(`${window.location.origin}/api/v1/payment/callback/easypaisa`, 'ep-top')}
                      >
                        {copiedUrlId === 'ep-top' ? <><Check size={12} className="mr-1 text-emerald-400" /> Copied!</> : <><Copy size={12} className="mr-1" /> Copy URL</>}
                      </Button>
                    </div>
                    <code className="block text-[11px] font-mono text-emerald-300/90 break-all bg-black/40 p-2 rounded border border-white/5">
                      {typeof window !== 'undefined' ? `${window.location.origin}/api/v1/payment/callback/easypaisa` : ''}
                    </code>
                    <p className="text-[10px] text-gray-400">EasyPaisa Portal &gt; IPN / Callback URL settings mein paste karein.</p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#1a2332]/80 border border-red-500/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                        <Smartphone size={13} /> JazzCash Return &amp; Callback URL
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-red-500/30 text-red-300 hover:bg-red-500/20"
                        onClick={() => copyToClipboard(`${window.location.origin}/api/v1/payment/callback/jazzcash`, 'jc-top')}
                      >
                        {copiedUrlId === 'jc-top' ? <><Check size={12} className="mr-1 text-emerald-400" /> Copied!</> : <><Copy size={12} className="mr-1" /> Copy URL</>}
                      </Button>
                    </div>
                    <code className="block text-[11px] font-mono text-red-300/90 break-all bg-black/40 p-2 rounded border border-white/5">
                      {typeof window !== 'undefined' ? `${window.location.origin}/api/v1/payment/callback/jazzcash` : ''}
                    </code>
                    <p className="text-[10px] text-gray-400">JazzCash Portal &gt; Return URL &amp; HTTP POST IPN settings mein paste karein.</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6">
                {(Array.isArray(gateways) ? gateways : []).map((gw: any) => {
                  let creds: any = {}
                  try { creds = JSON.parse(gw.credentials || '{}') } catch { /* ignore */ }

                  const autoDomain = typeof window !== 'undefined' ? window.location.origin : ''
                  const autoCallbackUrl = `${autoDomain}/api/v1/payment/callback/${gw.name}`
                  const currentCallbackUrl = gw.callbackUrl && gw.callbackUrl.startsWith('http') && !gw.callbackUrl.includes('localhost')
                    ? gw.callbackUrl
                    : autoCallbackUrl

                  const currentReturnUrl = creds.returnUrl && creds.returnUrl.startsWith('http') && !creds.returnUrl.includes('localhost')
                    ? creds.returnUrl
                    : autoCallbackUrl

                  return (
                    <Card key={gw.id} className="bg-[#111827] border-white/10">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Smartphone size={24} className="text-emerald-400" />
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle>{gw.displayName || gw.name}</CardTitle>
                              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-mono">
                                Domain Auto-Linked
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-400">Live Production Mode</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Label className="text-sm text-gray-400">Enable</Label>
                          <Switch
                            checked={gw.isEnabled}
                            onCheckedChange={(checked) => handleUpdateGateway(gw.id, { isEnabled: checked })}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          {gw.name === 'easypaisa' && (
                            <>
                              <div className="space-y-2">
                                <Label>Merchant ID</Label>
                                <Input className="bg-[#1a2332] border-white/10" defaultValue={creds.merchantId || ''} id={`gw-merchant-${gw.id}`} placeholder="e.g. 12345" />
                              </div>
                              <div className="space-y-2">
                                <Label>Store ID</Label>
                                <Input className="bg-[#1a2332] border-white/10" defaultValue={creds.storeId || ''} id={`gw-store-${gw.id}`} placeholder="e.g. 67890" />
                              </div>
                              <div className="space-y-2">
                                <Label>API Key</Label>
                                <Input className="bg-[#1a2332] border-white/10" type="password" defaultValue={creds.apiKey || ''} id={`gw-apikey-${gw.id}`} />
                              </div>
                              <div className="space-y-2">
                                <Label>Secret Key</Label>
                                <Input className="bg-[#1a2332] border-white/10" type="password" defaultValue={creds.secretKey || ''} id={`gw-secret-${gw.id}`} />
                              </div>
                              <div className="space-y-2">
                                <Label>Username</Label>
                                <Input className="bg-[#1a2332] border-white/10" defaultValue={creds.username || ''} id={`gw-user-${gw.id}`} />
                              </div>
                              <div className="space-y-2">
                                <Label>Password</Label>
                                <Input className="bg-[#1a2332] border-white/10" type="password" defaultValue={creds.password || ''} id={`gw-pass-${gw.id}`} />
                              </div>
                            </>
                          )}
                          {gw.name === 'jazzcash' && (
                            <>
                              <div className="space-y-2">
                                <Label>Merchant ID</Label>
                                <Input className="bg-[#1a2332] border-white/10" defaultValue={creds.merchantId || ''} id={`gw-merchant-${gw.id}`} placeholder="e.g. MC12345" />
                              </div>
                              <div className="space-y-2">
                                <Label>Password</Label>
                                <Input className="bg-[#1a2332] border-white/10" type="password" defaultValue={creds.password || ''} id={`gw-pass-${gw.id}`} />
                              </div>
                              <div className="space-y-2">
                                <Label>Integrity Salt</Label>
                                <Input className="bg-[#1a2332] border-white/10" type="password" defaultValue={creds.integritySalt || ''} id={`gw-salt-${gw.id}`} />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Return URL</Label>
                                  <span className="text-[10px] text-emerald-400 font-mono">Auto Domain</span>
                                </div>
                                <div className="flex gap-2">
                                  <Input
                                    className="bg-[#1a2332] border-white/10 text-xs font-mono text-emerald-300"
                                    defaultValue={currentReturnUrl}
                                    id={`gw-return-${gw.id}`}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="border-white/10 shrink-0 text-xs"
                                    onClick={() => {
                                      const el = document.getElementById(`gw-return-${gw.id}`) as HTMLInputElement
                                      if (el) copyToClipboard(el.value, `ret-${gw.id}`)
                                    }}
                                  >
                                    {copiedUrlId === `ret-${gw.id}` ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                                  </Button>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Auto-Detected Callback URL Field */}
                          <div className="space-y-2 col-span-full">
                            <div className="flex items-center justify-between">
                              <Label className="flex items-center gap-1.5 font-semibold text-gray-200">
                                <Globe size={14} className="text-emerald-400" />
                                Callback URL (IPN / Webhook Notification URL)
                              </Label>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] py-0.5">
                                  Domain: {typeof window !== 'undefined' ? window.location.host : ''}
                                </Badge>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-[11px] text-gray-400 hover:text-emerald-300 px-1.5"
                                  onClick={() => {
                                    const el = document.getElementById(`gw-callback-${gw.id}`) as HTMLInputElement
                                    if (el) el.value = autoCallbackUrl
                                    if (gw.name === 'jazzcash') {
                                      const retEl = document.getElementById(`gw-return-${gw.id}`) as HTMLInputElement
                                      if (retEl) retEl.value = autoCallbackUrl
                                    }
                                  }}
                                >
                                  <RefreshCw size={11} className="mr-1" /> Reset to Domain
                                </Button>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                className="bg-[#1a2332] border-emerald-500/30 font-mono text-xs text-emerald-300"
                                defaultValue={currentCallbackUrl}
                                id={`gw-callback-${gw.id}`}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 shrink-0 text-xs px-3"
                                onClick={() => {
                                  const el = document.getElementById(`gw-callback-${gw.id}`) as HTMLInputElement
                                  if (el) copyToClipboard(el.value, `cb-${gw.id}`)
                                }}
                              >
                                {copiedUrlId === `cb-${gw.id}` ? (
                                  <><Check size={13} className="mr-1.5 text-emerald-400" /> Copied</>
                                ) : (
                                  <><Copy size={13} className="mr-1.5" /> Copy URL</>
                                )}
                              </Button>
                            </div>
                            <p className="text-[11px] text-gray-400">
                              Yeh Callback URL active domain ({typeof window !== 'undefined' ? window.location.host : ''}) se automatically utha liya gaya hai. {gw.displayName || gw.name} merchant portal mein isi URL par payment notifications receive hongi.
                            </p>
                          </div>
                        </div>

                        {savedGwId === gw.id && (
                          <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                            <CheckCircle size={15} /> Configuration and auto-detected domain Callback URL saved successfully!
                          </div>
                        )}

                        <div className="flex gap-3 pt-2">
                          <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={() => {
                            const newCreds: any = {}
                            document.querySelectorAll(`[id^="gw-"][id*="-${gw.id}"]`).forEach((el: any) => {
                              const key = el.id.replace('gw-', '').replace(`-${gw.id}`, '')
                              newCreds[key] = el.value
                            })

                            // Map short field names to full backend field names
                            if (gw.name === 'jazzcash') {
                              newCreds.merchantId = newCreds.merchant || ''
                              newCreds.password = newCreds.pass || ''
                              newCreds.integritySalt = newCreds.salt || ''
                              delete newCreds.merchant
                              delete newCreds.pass
                              delete newCreds.salt
                            }

                            let cbVal = (document.getElementById(`gw-callback-${gw.id}`) as HTMLInputElement)?.value?.trim() || ''
                            if (!cbVal || cbVal.startsWith('/') || cbVal.includes('localhost') || !cbVal.startsWith('http')) {
                              cbVal = autoCallbackUrl
                            }

                            if (gw.name === 'jazzcash') {
                              if (!newCreds.returnUrl || newCreds.returnUrl.startsWith('/') || newCreds.returnUrl.includes('localhost') || !newCreds.returnUrl.startsWith('http')) {
                                newCreds.returnUrl = autoCallbackUrl
                              }
                            }

                            handleUpdateGateway(gw.id, {
                              credentials: JSON.stringify(newCreds),
                              feeFixed: 0,
                              feePercentage: 0,
                              callbackUrl: cbVal,
                              environment: 'production',
                            })
                          }}>
                            <Settings size={16} className="mr-2" /> Save Configuration
                          </Button>
                          <Button
                            variant="outline"
                            className="border-white/10"
                            onClick={() => {
                              const cbVal = (document.getElementById(`gw-callback-${gw.id}`) as HTMLInputElement)?.value || autoCallbackUrl
                              copyToClipboard(cbVal, `test-${gw.id}`)
                              alert(`Gateway Callback URL copied:\n${cbVal}\n\nMake sure this URL is registered in your ${gw.displayName} merchant account.`)
                            }}
                          >
                            <Copy size={16} className="mr-2" /> Copy Active Callback URL
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                {gateways.length === 0 && (
                  <Card className="bg-[#111827] border-white/10">
                    <CardContent className="py-12 text-center text-gray-500">
                      <Server size={40} className="mx-auto mb-3 opacity-50" />
                      <p>No payment gateways configured yet.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* API Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">API Logs</h2>
              <Card className="bg-[#111827] border-white/10">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-gray-400">Time</TableHead>
                        <TableHead className="text-gray-400">Method</TableHead>
                        <TableHead className="text-gray-400">Endpoint</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">IP</TableHead>
                        <TableHead className="text-gray-400">Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(apiLogs) ? apiLogs : []).map((log: any) => (
                        <TableRow key={log.id} className="border-white/10">
                          <TableCell className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</TableCell>
                          <TableCell><Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{log.method}</Badge></TableCell>
                          <TableCell className="font-mono text-xs">{log.endpoint}</TableCell>
                          <TableCell>
                            <Badge className={
                              log.statusCode && log.statusCode < 400 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
                            }>
                              {log.statusCode || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-gray-400">{log.ipAddress || '-'}</TableCell>
                          <TableCell className="text-xs text-red-400 max-w-[200px] truncate">{log.errorMessage || '-'}</TableCell>
                        </TableRow>
                      ))}
                      {apiLogs.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">No API logs yet</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Settings</h2>
              <Card className="bg-[#111827] border-white/10">
                <CardHeader><CardTitle className="text-lg">General Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Website Name</Label>
                      <Input className="bg-[#1a2332] border-white/10" defaultValue={settings.site_name || 'PayBridge Gateway'} id="set-site-name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Input className="bg-[#1a2332] border-white/10" defaultValue={settings.currency || 'PKR'} id="set-currency" />
                    </div>
                    <div className="space-y-2">
                      <Label>Support Email</Label>
                      <Input type="email" className="bg-[#1a2332] border-white/10" defaultValue={settings.support_email || 'support@paybridge.pk'} id="set-support-email" />
                    </div>
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Input className="bg-[#1a2332] border-white/10" defaultValue={settings.timezone || 'Asia/Karachi'} id="set-timezone" />
                    </div>
                    <div className="space-y-2">
                      <Label>Min Payment (Rs)</Label>
                      <Input type="number" className="bg-[#1a2332] border-white/10" defaultValue={settings.min_payment || '100'} id="set-min-pay" />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Payment (Rs)</Label>
                      <Input type="number" className="bg-[#1a2332] border-white/10" defaultValue={settings.max_payment || '500000'} id="set-max-pay" />
                    </div>
                    <div className="space-y-2">
                      <Label>API Rate Limit (req/min)</Label>
                      <Input type="number" className="bg-[#1a2332] border-white/10" defaultValue={settings.api_rate_limit || '100'} id="set-rate-limit" />
                    </div>
                    <div className="space-y-2">
                      <Label>Maintenance Mode</Label>
                      <div className="flex items-center gap-3 pt-2">
                        <Switch defaultChecked={settings.maintenance_mode === 'true'} id="set-maintenance" />
                        <span className="text-sm text-gray-400">Enable maintenance mode</span>
                      </div>
                    </div>
                  </div>
                  <Separator className="bg-white/10" />
                  <h3 className="font-semibold">SMTP Settings</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>SMTP Host</Label>
                      <Input className="bg-[#1a2332] border-white/10" defaultValue={settings.smtp_host || ''} placeholder="smtp.gmail.com" id="set-smtp-host" />
                    </div>
                    <div className="space-y-2">
                      <Label>SMTP Port</Label>
                      <Input className="bg-[#1a2332] border-white/10" defaultValue={settings.smtp_port || '587'} id="set-smtp-port" />
                    </div>
                    <div className="space-y-2">
                      <Label>SMTP Username</Label>
                      <Input className="bg-[#1a2332] border-white/10" defaultValue={settings.smtp_user || ''} id="set-smtp-user" />
                    </div>
                    <div className="space-y-2">
                      <Label>SMTP Password</Label>
                      <Input type="password" className="bg-[#1a2332] border-white/10" defaultValue={settings.smtp_pass || ''} id="set-smtp-pass" />
                    </div>
                  </div>
                  <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={async () => {
                    const keys = ['site-name', 'currency', 'support-email', 'timezone', 'min-payment', 'max-payment', 'api-rate-limit', 'smtp-host', 'smtp-port', 'smtp-user', 'smtp-pass']
                    const updates: Record<string, string> = {}
                    for (const k of keys) {
                      const el = document.getElementById(`set-${k}`) as HTMLInputElement
                      if (el) updates[k.replace(/-/g, '_')] = el.value
                    }
                    const maint = document.getElementById('set-maintenance') as HTMLInputElement
                    updates.maintenance_mode = String(maint?.checked || false)
                    for (const [key, value] of Object.entries(updates)) {
                      await authFetch('/api/settings', {
                        method: 'POST',
                        headers: authHeaders(),
                        body: JSON.stringify({ key, value, group: 'general' })
                      })
                    }
                    fetchSettings()
                    alert('Settings saved!')
                  }}>
                    Save Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Change Password */}
              <Card className="bg-[#111827] border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lock size={18} className="text-emerald-400" />
                    Change Admin Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pwMessage && (
                    <div className={`p-3 rounded-lg text-sm ${pwMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                      {pwMessage.text}
                    </div>
                  )}
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Current Password</Label>
                      <Input type="password" className="bg-[#1a2332] border-white/10" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} placeholder="Enter current password" />
                    </div>
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input type="password" className="bg-[#1a2332] border-white/10" value={pwNew} onChange={e => setPwNew(e.target.value)} placeholder="Min 8 characters" />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm New Password</Label>
                      <Input type="password" className="bg-[#1a2332] border-white/10" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} placeholder="Re-enter new password" />
                    </div>
                  </div>
                  <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={handleChangePassword} disabled={pwLoading}>
                    <Shield size={16} className="mr-2" />
                    {pwLoading ? 'Changing...' : 'Update Password'}
                  </Button>
                </CardContent>
              </Card>

              {/* Database Backup */}
              <Card className="bg-[#111827] border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Download size={18} className="text-emerald-400" />
                    Database Backup &amp; Restore
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <Button
                      className="bg-emerald-500 hover:bg-emerald-600"
                      disabled={backupLoading}
                      onClick={async () => {
                        setBackupLoading(true)
                        setBackupMsg(null)
                        try {
                          const res = await authFetch('/api/admin/backups/create', { method: 'POST', headers: authHeaders() })
                          const data = await res.json()
                          if (data.success) {
                            setBackupMsg({ type: 'success', text: `Backup created: ${data.filename}` })
                          } else {
                            setBackupMsg({ type: 'error', text: data.error || 'Failed to create backup' })
                          }
                          fetchBackups()
                        } catch {
                          setBackupMsg({ type: 'error', text: 'Network error. Please try again.' })
                        } finally { setBackupLoading(false) }
                      }}
                    >
                      <Download size={16} className="mr-2" />
                      {backupLoading ? 'Creating...' : 'Create Backup Now'}
                    </Button>
                  </div>

                  {backupMsg && (
                    <div className={`p-3 rounded-lg text-sm ${backupMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                      {backupMsg.text}
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-[#1a2332] border border-white/5">
                    <p className="text-xs text-gray-400">System automatically creates backups every 6 hours. Max 30 backups retained. You can also create manual backups or restore from any previous backup below.</p>
                  </div>

                  <Card className="bg-[#1a2332] border-white/5">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/10">
                            <TableHead className="text-gray-400">Backup File</TableHead>
                            <TableHead className="text-gray-400">Size</TableHead>
                            <TableHead className="text-gray-400">Created</TableHead>
                            <TableHead className="text-gray-400 text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(Array.isArray(backups) ? backups : []).map((b: any) => (
                            <TableRow key={b.filename} className="border-white/10">
                              <TableCell className="font-mono text-xs text-gray-300">{b.filename}</TableCell>
                              <TableCell className="text-sm text-gray-400">{(b.size / 1024).toFixed(1)} KB</TableCell>
                              <TableCell className="text-sm text-gray-400">{new Date(b.createdAt).toLocaleString()}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-emerald-400 hover:text-emerald-300"
                                  disabled={restoringBackup === b.filename}
                                  onClick={async () => {
                                    setRestoringBackup(b.filename)
                                    setBackupMsg(null)
                                    try {
                                      const res = await authFetch('/api/admin/backups/restore', {
                                        method: 'POST',
                                        headers: authHeaders(),
                                        body: JSON.stringify({ filename: b.filename })
                                      })
                                      const data = await res.json()
                                      if (data.success) {
                                        setBackupMsg({ type: 'success', text: `Restored: ${b.filename}. Please refresh the page.` })
                                      } else {
                                        setBackupMsg({ type: 'error', text: data.error || 'Failed to restore' })
                                      }
                                    } catch {
                                      setBackupMsg({ type: 'error', text: 'Network error during restore' })
                                    } finally { setRestoringBackup(null) }
                                  }}
                                >
                                  {restoringBackup === b.filename ? 'Restoring...' : 'Restore'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {backups.length === 0 && (
                            <TableRow><TableCell colSpan={4} className="text-center text-gray-500 py-8">No backups found</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
