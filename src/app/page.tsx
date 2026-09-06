'use client'

import { useState, useEffect, Component, type ReactNode, type ErrorInfo } from 'react'
import dynamic from 'next/dynamic'
import LandingPage from '@/components/LandingPage'
import AuthPage from '@/components/AuthPage'

const AdminPanel = dynamic(() => import('@/components/AdminPanel'), { ssr: false })
const UserDashboard = dynamic(() => import('@/components/UserDashboard'), { ssr: false })
const PaymentPage = dynamic(() => import('@/components/PaymentPage'), { ssr: false })
const ApiDocs = dynamic(() => import('@/components/ApiDocs'), { ssr: false })

interface ErrorBoundaryState { hasError: boolean; error: string; stack: string }
class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '', stack: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message || String(error), stack: error.stack || '' }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('PayBridge Error:', error, info.componentStack)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center p-8">
          <div className="max-w-lg w-full text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h2>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4 text-left">
              <p className="text-red-300 font-mono text-sm break-all">{this.state.error}</p>
              {this.state.stack && <pre className="text-gray-500 text-xs mt-2 overflow-auto max-h-40">{this.state.stack}</pre>}
            </div>
            <button onClick={() => window.location.reload()} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg">
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function Home() {
  const [page, setPage] = useState('home')
  const [user, setUser] = useState<{ id?: string; email: string; name: string; role: string; feePercentage?: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const [payId, setPayId] = useState<string | null>(null)

  useEffect(() => {
    try {
      const pathParts = window.location.pathname.split('/')
      if (pathParts[1] === 'pay' && pathParts[2]) {
        setPayId(pathParts[2])
      }
      const saved = localStorage.getItem('pb_user')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setUser(parsed)
          if (parsed.role === 'admin') setPage('admin')
          else setPage('dashboard')
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
    setMounted(true)
  }, [])

  const handleLogin = (userData: { id?: string; email: string; name: string; role: string; feePercentage?: number }) => {
    setUser(userData)
    localStorage.setItem('pb_user', JSON.stringify(userData))
    if (userData.role === 'admin') setPage('admin')
    else setPage('dashboard')
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('pb_user')
    localStorage.removeItem('pb_token')
    document.cookie = 'pb_token=; path=/; max-age=0'
    setPage('home')
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0e1a]">
        <div className="text-white text-lg">Loading PayBridge...</div>
      </div>
    )
  }

  if (payId) return <ErrorBoundary><PaymentPage transactionId={payId} /></ErrorBoundary>
  if (page === 'docs') return <ErrorBoundary><ApiDocs onNavigate={setPage} /></ErrorBoundary>

  switch (page) {
    case 'login':
    case 'register':
      return <AuthPage onNavigate={setPage} onLogin={handleLogin} />
    case 'admin':
      return user ? <ErrorBoundary><AdminPanel user={user} onLogout={handleLogout} /></ErrorBoundary> : <AuthPage onNavigate={setPage} onLogin={handleLogin} />
    case 'dashboard':
      return user ? <ErrorBoundary><UserDashboard user={user} onLogout={handleLogout} /></ErrorBoundary> : <AuthPage onNavigate={setPage} onLogin={handleLogin} />
    default:
      return <LandingPage onNavigate={setPage} />
  }
}
