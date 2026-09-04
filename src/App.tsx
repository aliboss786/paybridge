import { useState, useEffect } from 'react'
import LandingPage from '@/components/LandingPage'
import AuthPage from '@/components/AuthPage'
import AdminPanel from '@/components/AdminPanel'
import UserDashboard from '@/components/UserDashboard'
import ApiDocs from '@/components/ApiDocs'
import PaymentPage from '@/components/PaymentPage'

export default function App() {
  const [page, setPage] = useState('home')
  const [user, setUser] = useState<{ id?: string; email: string; name: string; role: string; feePercentage?: number } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('pb_user')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setUser(parsed)
        if (parsed.role === 'admin') setPage('admin')
        else setPage('dashboard')
      } catch { /* ignore */ }
    }
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

  const pathParts = window.location.pathname.split('/')
  if (pathParts[1] === 'pay' && pathParts[2]) {
    return <PaymentPage transactionId={pathParts[2]} />
  }

  if (pathParts[1] === 'docs' || page === 'docs') {
    return <ApiDocs onNavigate={setPage} />
  }

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
