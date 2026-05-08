import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { t } from '../lib/i18n'
import ContractorProfileModal from './ContractorProfileModal'
import WorkLogModal from './WorkLogModal'
import AvatarCropModal from './AvatarCropModal'

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0,3)}-${digits.slice(3)}`
  return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`
}

function splitName(fullName) {
  if (!fullName) return { first: '', last: '' }
  const parts = fullName.trim().split(' ')
  return { first: parts[0] || '', last: parts.slice(1).join(' ') || '' }
}

export default function SettingsPage({ onBack, onOpenWorkLog, onOpenHelp }) {
  const { profile, lang, signOut, setLang, loadProfile } = useApp()
  const [contractors, setContractors] = useState([])
  const [inviteInput, setInviteInput] = useState('')
  const [inviting, setInviting]       = useState(false)
  const [inviteLink, setInviteLink]   = useState('')

  useEffect(() => {
    if (profile?.id) generateInviteLink()
  }, [profile])

  async function generateInviteLink() {
    // check if token exists
    const { data } = await supabase.from('invite_tokens').select('token').eq('owner_id', profile.id).maybeSingle()
    if (data) {
      setInviteLink(`${window.location.origin}/invite/${data.token}`)
    } else {
      // create one
      const { data: created } = await supabase.from('invite_tokens').insert({ owner_id: profile.id }).select('token').single()
      if (created) setInviteLink(`${window.location.origin}/invite/${created.token}`)
    }
  }
  const [selectedContractor, setSelectedContractor] = useState(null)
  const [showWorkLog, setShowWorkLog] = useState(false)

  const { first: initFirst, last: initLast } = splitName(profile?.name)
  const [firstName, setFirstName] = useState(initFirst)
  const [lastName, setLastName]   = useState(initLast)
  const [editPhone, setEditPhone] = useState(profile?.phone || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [editMode, setEditMode]   = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [cropUrl, setCropUrl]     = useState(null)
  const photoInput = useRef(null)

  const isOwner = profile?.role === 'owner'

  useEffect(() => { loadContractors() }, [])
  useEffect(() => {
    const { first, last } = splitName(profile?.name)
    setFirstName(first); setLastName(last)
    setEditPhone(profile?.phone || '')
  }, [profile])

  async function loadContractors() {
    const { data } = await supabase.from('profiles').select('*').eq('role','contractor').order('name')
    setContractors(data || [])
  }

  // New photo selected — upload the ORIGINAL full photo first, then open crop
  async function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setSavingProfile(true)
    try {
      // Upload original full photo to a separate path
      const origPath = `profiles/${profile.id}/original.jpg`
      // Convert to jpeg via canvas first
      const blob = await toJpeg(file)
      await supabase.storage.from('fieldsnap-uploads').upload(origPath, blob, { contentType: 'image/jpeg', upsert: true })
      const { data } = supabase.storage.from('fieldsnap-uploads').getPublicUrl(origPath)
      await supabase.from('profiles').update({ photo_original_url: data.publicUrl }).eq('id', profile.id)
      await loadProfile(profile.id)
      // Open crop with blob URL (avoids cross-origin issues)
      setCropUrl(URL.createObjectURL(blob))
    } catch (err) { alert(err.message) }
    setSavingProfile(false)
  }

  // Tap existing photo — always load from the stored original
  async function handleAdjustExisting() {
    const origUrl = profile?.photo_original_url || profile?.photo_url
    if (!origUrl) return
    setSavingProfile(true)
    try {
      const r = await fetch(origUrl)
      const blob = await r.blob()
      setCropUrl(URL.createObjectURL(blob))
    } catch { alert('Could not load photo.') }
    setSavingProfile(false)
  }

  async function toJpeg(file) {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = ev => {
        const img = new Image()
        img.onload = () => {
          const MAX = 1600
          let w = img.naturalWidth, h = img.naturalHeight
          if (w > MAX) { h = Math.round(h * MAX / w); w = MAX }
          const canvas = document.createElement('canvas')
          canvas.width = w; canvas.height = h
          canvas.getContext('2d').drawImage(img, 0, 0, w, h)
          canvas.toBlob(blob => resolve(blob || file), 'image/jpeg', 0.9)
        }
        img.onerror = () => resolve(file)
        img.src = ev.target.result
      }
      reader.onerror = () => resolve(file)
      reader.readAsDataURL(file)
    })
  }

  async function handleCropDone(blob) {
    setCropUrl(null)
    setSavingProfile(true)
    try {
      const path = `profiles/${profile.id}/avatar_${Date.now()}.jpg`
      const { error: upErr } = await supabase.storage
        .from('fieldsnap-uploads')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('fieldsnap-uploads').getPublicUrl(path)
      await supabase.from('profiles').update({ photo_url: data.publicUrl }).eq('id', profile.id)
      await loadProfile(profile.id)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) { alert(err.message) }
    setSavingProfile(false)
  }

  async function handleSaveProfile() {
    if (!firstName.trim()) return
    setSavingProfile(true); setSaveSuccess(false)
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
      await supabase.from('profiles').update({ name: fullName, phone: editPhone }).eq('id', profile.id)
      await loadProfile(profile.id)
      setEditMode(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) { alert(err.message) }
    setSavingProfile(false)
  }

  function cancelEdit() {
    const { first, last } = splitName(profile?.name)
    setFirstName(first); setLastName(last)
    setEditPhone(profile?.phone || '')
    setEditMode(false)
  }

  async function handleInvite() {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink).then(() => {
      alert(lang === 'es' ? 'Enlace copiado! Compártelo con tu contratista.' : 'Link copied! Share it with your contractor.')
    })
  }

  async function handleDelete(id) {
    const ok = window.confirm(t('settings.deleteContractor', lang)); if (!ok) return
    await supabase.from('profiles').delete().eq('id', id); loadContractors()
  }

  async function handleLangChange(l) {
    setLang(l)
    await supabase.from('profiles').update({ language: l }).eq('id', profile.id)
  }

  return (
    <div className="min-h-screen bg-gray-50 page-enter">
      <div className="bg-brand-700 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-white text-xl">←</button>
        <h1 className="text-xl font-bold text-white">{t('settings.title', lang)}</h1>
      </div>

      <div className="px-4 py-5 space-y-5">
        <div className="card p-5">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-5">
            <div className="relative mb-2">
              {profile?.photo_url
                ? <img src={profile.photo_url} onClick={handleAdjustExisting}
                    className="w-24 h-24 rounded-full object-cover border-2 border-brand-200 shadow-md cursor-pointer active:scale-95" alt="profile" />
                : <div className="w-24 h-24 bg-brand-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-md">
                    {profile?.name?.[0]?.toUpperCase()}
                  </div>
              }
              {savingProfile && (
                <div className="absolute inset-0 bg-white/60 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <button onClick={() => photoInput.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 border-2 border-white">
                📷
              </button>
              <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
            </div>
            <p className="text-xs text-gray-400 text-center">
              {profile?.photo_url
                ? (lang === 'es' ? 'Toca la foto para ajustar · 📷 para nueva foto' : 'Tap photo to adjust · 📷 for new photo')
                : (lang === 'es' ? 'Toca 📷 para agregar foto' : 'Tap 📷 to add a photo')}
            </p>
          </div>

          {/* Fields */}
          {editMode ? (
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{lang==='es'?'Nombre':'First name'}</label>
                  <input className="input text-sm py-2" value={firstName} onChange={e=>setFirstName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{lang==='es'?'Apellido':'Last name'}</label>
                  <input className="input text-sm py-2" value={lastName} onChange={e=>setLastName(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{lang==='es'?'Teléfono':'Phone'}</label>
                <input className="input text-sm py-2" placeholder="555-555-5555" value={editPhone} inputMode="numeric"
                  onChange={e=>setEditPhone(formatPhone(e.target.value))} maxLength={12} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{lang==='es'?'Correo':'Email'}</label>
                <div className="input text-sm py-2 bg-gray-50 text-gray-400">{profile?.email}</div>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <p className="font-bold text-gray-800 text-xl">{profile?.name}</p>
              <p className="text-brand-600 text-sm font-medium mt-0.5">
                {profile?.role==='owner' ? t('settings.roleOwner',lang) : t('settings.roleContractor',lang)}
              </p>
              {profile?.phone && <p className="text-gray-500 text-sm mt-2">📞 {profile.phone}</p>}
              {profile?.email && <p className="text-gray-500 text-sm">✉️ {profile.email}</p>}
            </div>
          )}

          {saveSuccess && (
            <div className="mb-3 p-2 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm text-center font-medium">
              ✓ {lang==='es' ? '¡Guardado!' : 'Saved!'}
            </div>
          )}

          {editMode ? (
            <div className="flex gap-2">
              <button onClick={cancelEdit} className="flex-1 btn-secondary text-sm py-2">{t('action.cancel',lang)}</button>
              <button onClick={handleSaveProfile} disabled={savingProfile||!firstName.trim()} className="flex-1 btn-primary text-sm py-2">
                {savingProfile ? t('action.saving',lang) : t('action.save',lang)}
              </button>
            </div>
          ) : (
            <button onClick={() => setEditMode(true)} className="w-full btn-secondary text-sm py-2">
              {lang==='es' ? '✏️ Editar perfil' : '✏️ Edit Profile'}
            </button>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-2">{t('settings.language',lang)}</p>
            <div className="flex gap-2">
              <button onClick={() => handleLangChange('en')} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${lang==='en'?'bg-brand-700 text-white':'bg-gray-100 text-gray-500'}`}>🇺🇸 English</button>
              <button onClick={() => handleLangChange('es')} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${lang==='es'?'bg-accent-500 text-white':'bg-gray-100 text-gray-500'}`}>🇲🇽 Español</button>
            </div>
          </div>
        </div>

        <button onClick={() => onOpenWorkLog && onOpenWorkLog()} className="card p-4 w-full text-left flex items-center gap-3 active:scale-[0.98]">
          <span className="text-2xl">📅</span>
          <div>
            <p className="font-semibold text-gray-800">{t('settings.logWorkDay',lang)}</p>
            <p className="text-sm text-gray-400">{t('settings.logWorkDesc',lang)}</p>
          </div>
          <span className="ml-auto text-gray-300">›</span>
        </button>

        <button onClick={() => onOpenHelp && onOpenHelp()} className="card p-4 w-full text-left flex items-center gap-3 active:scale-[0.98]">
          <span className="text-2xl">❓</span>
          <div>
            <p className="font-semibold text-gray-800">{lang === 'es' ? 'Ayuda' : 'Help'}</p>
            <p className="text-sm text-gray-400">{lang === 'es' ? 'Guía de la app' : 'App guide & how-to'}</p>
          </div>
          <span className="ml-auto text-gray-300">›</span>
        </button>

        {isOwner && (
          <div className="card p-5">
            <h2 className="font-bold text-gray-800 mb-4">{t('settings.contractors',lang)}</h2>
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">{lang === 'es' ? 'Comparte este enlace con tus contratistas para que se registren:' : 'Share this link with your contractors to sign up:'}</p>
              <div className="flex gap-2">
                <div className="input flex-1 text-sm text-gray-500 truncate bg-gray-50">{inviteLink || '...'}</div>
                <button onClick={handleInvite} disabled={!inviteLink} className="btn-primary px-4 text-sm py-0">{lang === 'es' ? 'Copiar' : 'Copy'}</button>
              </div>
            </div>
            <div className="space-y-2">
              {contractors.map(c => (
                <div key={c.id} className="flex items-center gap-3">
                  <button onClick={() => setSelectedContractor(c)} className="flex items-center gap-3 flex-1 py-2 active:scale-[0.98]">
                    {c.photo_url
                      ? <img src={c.photo_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                      : <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold">{c.name?.[0]}</div>
                    }
                    <div className="text-left">
                      <p className="font-semibold text-gray-800 text-sm">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.phone||c.email}</p>
                    </div>
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-400 text-sm px-3 py-1 active:scale-95">✕</button>
                </div>
              ))}
              {contractors.length===0 && <p className="text-sm text-gray-400 text-center py-4">{t('settings.noContractors',lang)}</p>}
            </div>
          </div>
        )}

        <button onClick={signOut} className="btn-secondary w-full text-red-500">{t('settings.signOut',lang)}</button>
      </div>

      {selectedContractor && <ContractorProfileModal contractor={selectedContractor} lang={lang} onClose={() => { setSelectedContractor(null); loadContractors() }} />}

      {cropUrl && <AvatarCropModal imageUrl={cropUrl} lang={lang} onDone={handleCropDone} onCancel={() => setCropUrl(null)} />}
    </div>
  )
}
