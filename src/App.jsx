import { useApp } from './context/AppContext'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import PropertyPage from './pages/PropertyPage'
import SettingsPage from './components/SettingsPage'
import { useState } from 'react'

export default function App() {
  const { session, profile } = useApp()
  const [page, setPage]             = useState('dashboard')
  const [activeProperty, setActiveProperty] = useState(null)

  // Still loading auth state
  if (session === undefined || (session && profile === undefined)) {
    return (
      <div className="min-h-screen bg-brand-700 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <AuthPage />

  if (page === 'settings') {
    return <SettingsPage onBack={() => setPage('dashboard')} />
  }

  if (page === 'property' && activeProperty) {
    return (
      <PropertyPage
        property={activeProperty}
        onBack={() => { setPage('dashboard'); setActiveProperty(null) }}
        onRefreshDashboard={() => {}}
      />
    )
  }

  return (
    <Dashboard
      onOpenProperty={p => { setActiveProperty(p); setPage('property') }}
      onOpenSettings={() => setPage('settings')}
    />
  )
}
