'use client'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import {
  BarChart3, Wallet, ArrowDownRight, ArrowUpRight, Activity, CreditCard,
  LogOut, Search, Download, Copy, Check, Key, Bell, Eye, EyeOff,
  CheckCircle, XCircle, Clock, Smartphone, Plus, RefreshCw, Settings, Lock
} from 'lucide-react'

interface UserDashboardProps {
  user: { id?: string; email: string; name: string; role: string; feePercentage?: number }
  onLogout: () => void
}

export default function UserDashboard({ user, onLogout }: UserDashboardProps) {
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
  const [stats, setStats] = useState({ balance: 0, feePercentage: 2.0, totalCashIn: 0, totalCashOut: 0, todayCashIn: 0, todayCashOut: 0, successful: 0, pending: 0, failed: 0, remainingBalance: 0, grossReceived: 0, totalFeeCut: 0, todayFeeCut: 0, todayNetRemaining: 0 })
  const [transactions, setTransactions] = useState<any[]>([])
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [ledger, setLedger] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterMethod, setFilterMethod] = useState('all')
  const [copiedKey, setCopiedKey] = useState('')
  const [showKeyDialog, setShowKeyDialog] = useState(false)
  const [secretRevealed, setSecretRevealed] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' })

  const fetchStats = useCallback(async () => {
    try {
      const res = await authFetch('/api/user/dashboard')
      const data = await res.json()
      if (res.ok) setStats((prev: any) => ({ ...prev, ...(typeof data === 'object' && data !== null && !Array.isArray(data) ? data : {}) }))
    } catch { /* ignore */ }
  }, [])

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await authFetch('/api/transactions')
      const data = await res.json()
      if (res.ok) { const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []; setTransactions(items) }
    } catch { /* ignore */ }
  }, [])

  const fetchApiKeys = useCallback(async () => {
    try {
      const res = await authFetch('/api/api-credentials')
      const data = await res.json()
      if (res.ok) setApiKeys(data.items || data || [])
    } catch { /* ignore */ }
  }, [])

  const fetchLedger = useCallback(async () => {
    try {
      const res = await authFetch('/api/ledger')
      const data = await res.json()
      if (res.ok) setLedger(data.items || data || [])
    } catch { /* ignore */ }
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await authFetch('/api/notifications')
      const data = await res.json()
      const items = Array.isArray(data) ? data : (data.items || [])
      setNotifications(Array.isArray(items) ? items : [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchStats()
    fetchTransactions()
    fetchApiKeys()
    fetchLedger()
    fetchNotifications()
  }, [fetchStats, fetchTransactions, fetchApiKeys, fetchLedger, fetchNotifications])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(label)
    setTimeout(() => setCopiedKey(''), 2000)
  }

  const filteredTransactions = transactions.filter(t => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!t.transactionId?.toLowerCase().includes(q) && !t.orderId?.toLowerCase().includes(q)) return false
    }
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    if (filterMethod !== 'all' && t.paymentMethod !== filterMethod) return false
    return true
  })

  const statCards = [
    { label: 'Total Balance', value: `Rs ${(stats.balance || 0).toLocaleString()}`, icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Total Cash In', value: `Rs ${(stats.totalCashIn || 0).toLocaleString()}`, icon: ArrowDownRight, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Total Cash Out', value: `Rs ${(stats.totalCashOut || 0).toLocaleString()}`, icon: ArrowUpRight, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: "Today's Cash In", value: `Rs ${(stats.todayCashIn || 0).toLocaleString()}`, icon: ArrowDownRight, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: "Today's Cash Out", value: `Rs ${(stats.todayCashOut || 0).toLocaleString()}`, icon: ArrowUpRight, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Successful', value: stats.successful, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Failed', value: stats.failed, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Top Bar */}
      <div className="bg-[#111827] border-b border-white/10 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-bold text-sm">P</div>
          <span className="font-bold text-lg">PayBridge</span>
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 ml-2">Merchant</Badge>
          <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 ml-2 text-xs font-mono">
            Fee: {stats.feePercentage ?? user.feePercentage ?? 2}%
          </Badge>
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
            { id: 'transactions', icon: CreditCard, label: 'Transactions' },
            { id: 'api', icon: Key, label: 'API Keys' },
            { id: 'ledger', icon: Activity, label: 'Ledger' },
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
              <h2 className="text-2xl font-bold">My Dashboard</h2>
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

              {/* Fee Breakdown Section (Hisaab) */}
              <Card className="bg-[#111827] border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wallet size={18} className="text-emerald-400" />
                    Fee Breakdown (Hisaab)
                    <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-xs font-mono ml-auto">
                      Fee: {stats.feePercentage ?? user.feePercentage ?? 2}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-[#1a2332] border border-blue-500/20 space-y-1">
                      <div className="text-xs text-blue-400 font-semibold">1. Total Gross Received</div>
                      <div className="text-xl font-bold font-mono text-white">
                        Rs {(stats.grossReceived || stats.totalCashIn || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-gray-400">Sab payments ka total amount</div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#1a2332] border border-emerald-500/20 space-y-1">
                      <div className="text-xs text-emerald-400 font-semibold">2. Fee Rate</div>
                      <div className="text-xl font-bold font-mono text-emerald-400">
                        {stats.feePercentage ?? user.feePercentage ?? 2}%
                      </div>
                      <div className="text-[10px] text-gray-400">Har payment par lagne wali fee</div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#1a2332] border border-red-500/20 space-y-1">
                      <div className="text-xs text-red-400 font-semibold">3. Fee Cut (Kati Hui)</div>
                      <div className="text-xl font-bold font-mono text-red-400">
                        - Rs {(stats.totalFeeCut || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-gray-400">Platform ne kaat li hai</div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#1a2332] border border-emerald-500/20 space-y-1">
                      <div className="text-xs text-emerald-400 font-semibold">4. Baqi Balance</div>
                      <div className="text-xl font-bold font-mono text-emerald-300">
                        Rs {(stats.remainingBalance ?? stats.balance ?? 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-gray-400">Fee katne ke baad baaki</div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-black/40 border border-white/5 text-xs text-gray-400 font-mono">
                    Gross (Rs {(stats.grossReceived || stats.totalCashIn || 0).toLocaleString()}) − Fee Cut (Rs {(stats.totalFeeCut || 0).toLocaleString()}) = Baqi Balance (Rs {(stats.remainingBalance ?? stats.balance ?? 0).toLocaleString()})
                  </div>

                  {stats.todayFeeCut > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                      <strong>Aaj ka Hisaab:</strong> Gross Rs {(stats.todayCashIn || 0).toLocaleString()} − Fee Rs {(stats.todayFeeCut || 0).toLocaleString()} = Net Rs {(stats.todayNetRemaining || 0).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card className="bg-[#111827] border-white/10">
                <CardHeader><CardTitle className="text-lg">Recent Transactions</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-gray-400">Transaction ID</TableHead>
                        <TableHead className="text-gray-400">Type</TableHead>
                        <TableHead className="text-gray-400">Amount</TableHead>
                        <TableHead className="text-gray-400">Method</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.slice(0, 8).map((t: any) => (
                        <TableRow key={t.id} className="border-white/10">
                          <TableCell className="font-mono text-xs">{t.transactionId}</TableCell>
                          <TableCell className="capitalize">{t.type}</TableCell>
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
                          <TableCell className="text-gray-400 text-sm">{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                      {transactions.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">No transactions yet</TableCell></TableRow>
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
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Transactions</h2>
                <Button variant="outline" className="border-white/10" onClick={() => {
                  const csv = ['Transaction ID,Order ID,Type,Amount,Fee,Net,Method,Status,Date'].concat(
                    filteredTransactions.map((t: any) => `${t.transactionId},${t.orderId || ''},${t.type},${t.amount},${t.fee || 0},${t.netAmount || 0},${t.paymentMethod},${t.status},${t.createdAt}`)
                  ).join('\n')
                  const blob = new Blob([csv], { type: 'text/csv' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a'); a.href = url; a.download = 'my-transactions.csv'; a.click()
                }}>
                  <Download size={16} className="mr-2" /> Export CSV
                </Button>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
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
                  </SelectContent>
                </Select>
                <Select value={filterMethod} onValueChange={setFilterMethod}>
                  <SelectTrigger className="w-36 bg-[#111827] border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1a2332] border-white/10">
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="easypaisa">EasyPaisa</SelectItem>
                    <SelectItem value="jazzcash">JazzCash</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card className="bg-[#111827] border-white/10">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-gray-400">Transaction ID</TableHead>
                        <TableHead className="text-gray-400">Order ID</TableHead>
                        <TableHead className="text-gray-400">Type</TableHead>
                        <TableHead className="text-gray-400">Amount</TableHead>
                        <TableHead className="text-gray-400">Fee</TableHead>
                        <TableHead className="text-gray-400">Net</TableHead>
                        <TableHead className="text-gray-400">Method</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((t: any) => (
                        <TableRow key={t.id} className="border-white/10">
                          <TableCell className="font-mono text-xs">{t.transactionId}</TableCell>
                          <TableCell className="text-sm">{t.orderId || '-'}</TableCell>
                          <TableCell className="capitalize">{t.type}</TableCell>
                          <TableCell>Rs {t.amount?.toLocaleString()}</TableCell>
                          <TableCell className="text-gray-400">Rs {t.fee?.toLocaleString() || 0}</TableCell>
                          <TableCell>Rs {t.netAmount?.toLocaleString() || t.amount?.toLocaleString()}</TableCell>
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
                          <TableCell className="text-gray-400 text-sm">{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                      {filteredTransactions.length === 0 && (
                        <TableRow><TableCell colSpan={9} className="text-center text-gray-500 py-8">No transactions found</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">API Credentials</h2>
                <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
                  <DialogTrigger>
                    <Button className="bg-emerald-500 hover:bg-emerald-600"><Key size={16} className="mr-2" /> Generate New Key</Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#111827] border-white/10">
                    <DialogHeader><DialogTitle>New API Key</DialogTitle></DialogHeader>
                    <p className="text-sm text-gray-400">A new API key pair will be generated. The secret key will only be shown once.</p>
                    <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={async () => {
                      const res = await authFetch('/api/api-credentials', { method: 'POST', body: JSON.stringify({ permissions: 'read,write' }) })
                      if (res.ok) { fetchApiKeys(); setShowKeyDialog(false) }
                    }}>
                      Generate Key Pair
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-400">
                <strong>Security Note:</strong> Your secret key is only shown once during creation. Store it securely. Never share it publicly or include it in frontend code.
              </div>

              <Card className="bg-[#111827] border-white/10">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-gray-400">API Key</TableHead>
                        <TableHead className="text-gray-400">Permissions</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">Created</TableHead>
                        <TableHead className="text-gray-400 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map((k: any) => (
                        <TableRow key={k.id} className="border-white/10">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-[#1a2332] px-2 py-1 rounded">{k.apiKey?.slice(0, 12)}...{k.apiKey?.slice(-4)}</code>
                              <button onClick={() => copyToClipboard(k.apiKey, 'api')} className="text-gray-500 hover:text-emerald-400">
                                {copiedKey === 'api' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                              </button>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{k.permissions}</TableCell>
                          <TableCell>
                            <Badge className={k.isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                              {k.isActive ? 'Active' : 'Revoked'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400 text-sm">{new Date(k.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={async () => {
                              await authFetch(`/api/api-credentials/${k.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !k.isActive }) })
                              fetchApiKeys()
                            }}>
                              {k.isActive ? 'Revoke' : 'Activate'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {apiKeys.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-8">
                          No API keys yet. Generate one to start integrating.
                        </TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* API Base URL */}
              <Card className="bg-[#111827] border-white/10">
                <CardHeader><CardTitle className="text-lg">API Endpoints</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-[#1a2332] font-mono text-sm">
                      <div className="text-gray-400 mb-1">Base URL</div>
                      <div className="flex items-center gap-2">
                        <code>{window.location.origin}/api/v1</code>
                        <button onClick={() => copyToClipboard(`${window.location.origin}/api/v1`, 'base')} className="text-gray-500 hover:text-emerald-400">
                          {copiedKey === 'base' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { method: 'POST', path: '/payment/create', desc: 'Create payment' },
                        { method: 'GET', path: '/payment/status/{id}', desc: 'Check status' },
                        { method: 'GET', path: '/balance', desc: 'Get balance' },
                        { method: 'GET', path: '/transactions', desc: 'List transactions' },
                      ].map((ep, i) => (
                        <div key={i} className="p-3 rounded-lg bg-[#1a2332] border border-white/5">
                          <Badge className={ep.method === 'POST' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}>
                            {ep.method}
                          </Badge>
                          <code className="text-sm ml-2">{ep.path}</code>
                          <div className="text-xs text-gray-500 mt-1">{ep.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Ledger Tab */}
          {activeTab === 'ledger' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Balance Ledger</h2>
              <Card className="bg-[#111827] border-white/10">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-gray-400">Date</TableHead>
                        <TableHead className="text-gray-400">Type</TableHead>
                        <TableHead className="text-gray-400">Description</TableHead>
                        <TableHead className="text-gray-400 text-right">Amount</TableHead>
                        <TableHead className="text-gray-400 text-right">Balance After</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ledger.map((l: any) => (
                        <TableRow key={l.id} className="border-white/10">
                          <TableCell className="text-gray-400 text-sm">{new Date(l.createdAt).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={
                              l.type === 'cash_in' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                              l.type === 'cash_out' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              'bg-gray-500/20 text-gray-400 border-gray-500/30'
                            }>
                              {l.type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{l.description || '-'}</TableCell>
                          <TableCell className={`text-right font-medium ${l.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {l.amount >= 0 ? '+' : ''} Rs {Math.abs(l.amount).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">Rs {l.balanceAfter?.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      {ledger.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-8">No ledger entries yet</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settings / Change Password Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Account Settings</h2>

              <Card className="bg-[#111827] border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lock size={18} className="text-emerald-400" /> Change Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pwMsg.text && (
                    <div className={`p-3 rounded-lg text-sm ${pwMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                      {pwMsg.text}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input
                      type="password"
                      placeholder="Enter current password"
                      className="bg-[#1a2332] border-white/10"
                      value={pwForm.currentPassword}
                      onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      placeholder="Min 8 characters"
                      className="bg-[#1a2332] border-white/10"
                      value={pwForm.newPassword}
                      onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                      minLength={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <Input
                      type="password"
                      placeholder="Re-enter new password"
                      className="bg-[#1a2332] border-white/10"
                      value={pwForm.confirmPassword}
                      onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    />
                  </div>
                  <Button
                    className="bg-emerald-500 hover:bg-emerald-600"
                    disabled={pwLoading || !pwForm.currentPassword || !pwForm.newPassword}
                    onClick={async () => {
                      setPwMsg({ type: '', text: '' })
                      if (pwForm.newPassword !== pwForm.confirmPassword) {
                        setPwMsg({ type: 'error', text: 'New passwords do not match' })
                        return
                      }
                      if (pwForm.newPassword.length < 8) {
                        setPwMsg({ type: 'error', text: 'New password must be at least 8 characters' })
                        return
                      }
                      setPwLoading(true)
                      try {
                        const res = await authFetch('/api/auth/change-password', {
                          method: 'POST',
                          body: JSON.stringify({
                            email: user.email,
                            currentPassword: pwForm.currentPassword,
                            newPassword: pwForm.newPassword,
                            role: user.role
                          })
                        })
                        const data = await res.json()
                        if (res.ok) {
                          setPwMsg({ type: 'success', text: 'Password changed successfully!' })
                          setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                        } else {
                          setPwMsg({ type: 'error', text: data.error || 'Failed to change password' })
                        }
                      } catch {
                        setPwMsg({ type: 'error', text: 'Network error. Please try again.' })
                      } finally {
                        setPwLoading(false)
                      }
                    }}
                  >
                    {pwLoading ? 'Changing...' : 'Change Password'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
