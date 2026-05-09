import { useApp } from './context/AppContext'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import PropertyPage from './pages/PropertyPage'
import SettingsPage from './components/SettingsPage'
import AvatarCropModal from './components/AvatarCropModal'
import { useState, useRef } from 'react'
import NotificationsPage from './pages/NotificationsPage'
import MyTasksPage from './pages/MyTasksPage'
import HelpPage from './pages/HelpPage'
import WorkLogPage from './pages/WorkLogPage'
import { supabase } from './lib/supabase'
import { subscribeToPush } from './lib/push'
import { useEffect } from 'react'

function PhotoRequiredScreen() {
  const { profile, setProfile } = useApp()
  const photoInput = useRef(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const lang = profile?.language || 'en'

  async function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setSaving(true)
    setError('')
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = ev => resolve(ev.target.result)
        reader.onerror = () => reject(new Error('Could not read file'))
        reader.readAsDataURL(file)
      })
      const blob = await new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          const MAX = 1200
          let w = img.naturalWidth, h = img.naturalHeight
          if (w > MAX) { h = Math.round(h * MAX / w); w = MAX }
          const canvas = document.createElement('canvas')
          canvas.width = w; canvas.height = h
          canvas.getContext('2d').drawImage(img, 0, 0, w, h)
          canvas.toBlob(b => resolve(b || file), 'image/jpeg', 0.85)
        }
        img.onerror = () => resolve(file)
        img.src = dataUrl
      })
      const path = `profiles/${profile.id}/avatar_${Date.now()}.jpg`
      const { error: uploadErr } = await supabase.storage.from('fieldsnap-uploads').upload(path, blob, { contentType: 'image/jpeg', upsert: true })
      if (uploadErr) { setError('Upload error: ' + uploadErr.message); setSaving(false); return }
      const { data } = supabase.storage.from('fieldsnap-uploads').getPublicUrl(path)
      const { error: updateErr } = await supabase.from('profiles').update({ photo_url: data.publicUrl }).eq('id', profile.id)
      if (updateErr) { setError('Save error: ' + updateErr.message); setSaving(false); return }
      setProfile({ ...profile, photo_url: data.publicUrl })
    } catch(e) { setError('Error: ' + e.message) }
    setSaving(false)
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-800 to-brand-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-7 text-center">
        <img src="/logo.png" alt="FieldSnap" className="h-12 object-contain mx-auto mb-6" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {profile?.language === 'es' ? '¡Bienvenido!' : 'Welcome!'} {profile?.name?.split(' ')[0]}
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          {profile?.language === 'es'
            ? 'Por favor agrega una foto de perfil para continuar.'
            : 'Please add a profile photo to continue.'}
        </p>
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-4xl">
            📷
          </div>
        </div>
        {error && <p className="text-red-500 text-xs mb-3 bg-red-50 rounded-xl p-3 text-left">{error}</p>}
        <button
          onClick={() => photoInput.current?.click()}
          disabled={saving}
          className="btn-primary w-full mb-3">
          {saving
            ? (profile?.language === 'es' ? 'Guardando...' : 'Saving...')
            : (profile?.language === 'es' ? 'Agregar foto de perfil' : 'Add Profile Photo')}
        </button>
        <input ref={photoInput} type="file" accept="image/*,.heic,.heif" capture="environment" className="hidden" onChange={handlePhotoSelect} />
      </div>
    </div>
  )
}

export default function App() {
  const { session, profile, setProfile } = useApp()

  useEffect(() => {
    if (session?.user?.id) {
      subscribeToPush(session.user.id).catch(console.error);
    }
  }, [session?.user?.id]);
  const [page, setPage]             = useState('dashboard')
  const [activeProperty, setActiveProperty] = useState(null)
  const [notifTask, setNotifTask] = useState(null)

  // Handle deep links from push notifications
  useEffect(() => {
    const path = window.location.pathname
    const taskMatch = path.match(/^\/task\/([a-f0-9-]+)$/)
    if (taskMatch && session) {
      const taskId = taskMatch[1]
      supabase.from('tasks')
        .select('*, creator:profiles!tasks_created_by_fkey(name,photo_url), completer:profiles!tasks_completed_by_fkey(name,photo_url)')
        .eq('id', taskId).single()
        .then(({ data: task }) => {
          if (task) {
            supabase.from('properties').select('*').eq('id', task.property_id).single()
              .then(({ data: prop }) => {
                if (prop) {
                  setActiveProperty(prop)
                  setNotifTask(task)
                  setPage('property')
                  window.history.replaceState({}, '', '/')
                }
              })
          }
        })
    }
    if (path === '/worklog' && session) {
      setPage('worklog')
      window.history.replaceState({}, '', '/')
    }
  }, [session])

  // Still loading auth state
  if (session === undefined || (session && profile === undefined)) {
    return (
      <div className="min-h-screen bg-brand-700 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <AuthPage />

  // Force photo upload before accessing app
  if (session && profile && !profile.photo_url) {
    return <PhotoRequiredScreen />
  }

  if (page === 'help') {
    return <HelpPage onBack={() => setPage('settings')} />
  }

  if (page === 'mytasks') {
    return <MyTasksPage onBack={() => setPage('dashboard')} />
  }

  if (page === 'settings') {
    return <SettingsPage onBack={() => setPage('dashboard')} onOpenWorkLog={() => setPage('worklog')} onOpenHelp={() => setPage('help')} />
  }

  if (page === 'worklog') {
    return <WorkLogPage onBack={() => setPage('settings')} />
  }

  if (page === 'notifications') {
    return <NotificationsPage
      onBack={() => setPage('dashboard')}
      onOpenTask={async (task) => {
        // Load the property for this task
        const { data: prop } = await supabase.from('properties').select('*').eq('id', task.property_id).single()
        if (prop) {
          setActiveProperty(prop)
          setNotifTask(task)
          setPage('property')
        } else {
          setPage('dashboard')
        }
      }}
    />
  }

  if (page === 'property' && activeProperty) {
    return (
      <PropertyPage
        property={activeProperty}
        onBack={() => { setPage('dashboard'); setActiveProperty(null); setNotifTask(null) }}
        onRefreshDashboard={() => {}}
        initialTask={notifTask}
        onTaskOpened={() => setNotifTask(null)}
      />
    )
  }

  return (
    <Dashboard
      onOpenProperty={p => { setActiveProperty(p); setPage('property') }}
      onOpenSettings={() => setPage('settings')} onOpenNotifications={() => setPage('notifications')} onOpenMyTasks={() => setPage('mytasks')}
    />
  )
}
