import { useApp } from './context/AppContext'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import PropertyPage from './pages/PropertyPage'
import SettingsPage from './components/SettingsPage'
import AvatarCropModal from './components/AvatarCropModal'
import { useState, useRef } from 'react'
import { supabase } from './lib/supabase'

function PhotoRequiredScreen() {
  const { profile, loadProfile } = useApp()
  const photoInput = useRef(null)
  const [cropSrc, setCropSrc] = useState(null)
  const [showCrop, setShowCrop] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { setCropSrc(ev.target.result); setShowCrop(true) }
    reader.readAsDataURL(file)
  }

  async function handleCropDone(blob) {
    setShowCrop(false); setSaving(true)
    try {
      const path = `profiles/${profile.id}/avatar_${Date.now()}.jpg`
      await supabase.storage.from('fieldsnap-uploads').upload(path, blob, { contentType: 'image/jpeg', upsert: true })
      const { data } = supabase.storage.from('fieldsnap-uploads').getPublicUrl(path)
      await supabase.from('profiles').update({ photo_url: data.publicUrl }).eq('id', profile.id)
      await loadProfile(profile.id)
    } catch(e) { alert('Error saving photo, please try again.') }
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
        <button
          onClick={() => photoInput.current?.click()}
          disabled={saving}
          className="btn-primary w-full mb-3">
          {saving
            ? (profile?.language === 'es' ? 'Guardando...' : 'Saving...')
            : (profile?.language === 'es' ? 'Agregar foto de perfil' : 'Add Profile Photo')}
        </button>
        <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
      </div>
      {showCrop && <AvatarCropModal src={cropSrc} onDone={handleCropDone} onClose={() => setShowCrop(false)} />}
    </div>
  )
}

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

  // Force photo upload before accessing app
  if (session && profile && !profile.photo_url) {
    return <PhotoRequiredScreen />
  }

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
