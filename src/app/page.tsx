'use client'

import { useState, useEffect, Component, ReactNode } from 'react'
import dynamic from 'next/dynamic'

const LandingPage = dynamic(() => import('@/components/LandingPage'), { ssr: false })
const AuthPage = dynamic(() => import('@/components/AuthPage'), { ssr: false })
const AdminPanel = dynamic(() => import('@/components/AdminPanel'), { ssr: false })
const UserDashboard = dynamic(() => import('@/components/UserDashboard'), { ssr: false })
const PaymentPage = dynamic(() => import('@/components/PaymentPage'), { ssr: false })
const ApiDocs = dynamic(() => import('@/components/ApiDocs'), { ssr: false })

class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback
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

  const errorFallback = (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0e1a] text-white">
      <div className="text-center p-8">
        <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
        <p className="text-gray-400 mb-6">Please refresh the page or try again.</p>
        <button onClick={() => window.location.reload()} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg">
          Reload Page
        </button>
      </div>
    </div>
  )

  if (!mounted) return <div className="flex items-center justify-center min-h-screen bg-[#0a0e1a]"><div className="text-white text-lg">Loading PayBridge...</div></div>

  if (payId) return <ErrorBoundary fallback={errorFallback}><PaymentPage transactionId={payId} /></ErrorBoundary>

  if (page === 'docs') return <ErrorBoundary fallback={errorFallback}><ApiDocs onNavigate={setPage} /></ErrorBoundary>

  switch (page) {
    case 'login':
    case 'register':
      return <ErrorBoundary fallback={errorFallback}><AuthPage onNavigate={setPage} onLogin={handleLogin} /></ErrorBoundary>
    case 'admin':
      return user ? <ErrorBoundary fallback={errorFallback}><AdminPanel user={user} onLogout={handleLogout} /></ErrorBoundary> : <ErrorBoundary fallback={errorFallback}><AuthPage onNavigate={setPage} onLogin={handleLogin} /></ErrorBoundary>
    case 'dashboard':
      return user ? <ErrorBoundary fallback={errorFallback}><UserDashboard user={user} onLogout={handleLogout} /></ErrorBoundary> : <ErrorBoundary fallback={errorFallback}><AuthPage onNavigate={setPage} onLogin={handleLogin} /></ErrorBoundary>
    default:
      return <ErrorBoundary fallback={errorFallback}><LandingPage onNavigate={setPage} /></ErrorBoundary>
  }
}
