'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const LandingPage = dynamic(() => import('@/components/LandingPage'))
const AuthPage = dynamic(() => import('@/components/AuthPage'))
const AdminPanel = dynamic(() => import('@/components/AdminPanel'))
const UserDashboard = dynamic(() => import('@/components/UserDashboard'))
const PaymentPage = dynamic(() => import('@/components/PaymentPage'))
const ApiDocs = dynamic(() => import('@/components/ApiDocs'))

export default function Home() {
  const [page, setPage] = useState('home')
  const [user, setUser] = useState<{ id?: string; email: string; name: string; role: string; feePercentage?: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const [payId, setPayId] = useState<string | null>(null)

  useEffect(() => {
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
    setPage('home')
  }

  if (!mounted) return <div className="flex items-center justify-center min-h-screen bg-[#0a0e1a]"><div className="text-white text-lg">Loading PayBridge...</div></div>

  if (payId) return <PaymentPage transactionId={payId} />

  if (page === 'docs') return <ApiDocs onNavigate={setPage} />

  switch (page) {
    case 'login':
    case 'register':
      return <AuthPage onNavigate={setPage} onLogin={handleLogin} />
    case 'admin':
      return user ? <AdminPanel user={user} onLogout={handleLogout} /> : <AuthPage onNavigate={setPage} onLogin={handleLogin} />
    case 'dashboard':
      return user ? <UserDashboard user={user} onLogout={handleLogout} /> : <AuthPage onNavigate={setPage} onLogin={handleLogin} />
    default:
      return <LandingPage onNavigate={setPage} />
  }
}
