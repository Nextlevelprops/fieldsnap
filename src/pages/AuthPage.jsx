import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { t } from '../lib/i18n'

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0,3)}-${digits.slice(3)}`
  return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`
}

export default function AuthPage() {
  const [lang, setLang]         = useState(null)
  const [inviteToken, setInviteToken] = useState(null)
  const [inviteOwnerId, setInviteOwnerId] = useState(null)

  useEffect(() => {
    const path = window.location.pathname
    const match = path.match(/\/invite\/([a-zA-Z0-9-]+)/)
    if (match) {
      const token = match[1]
      setInviteToken(token)
      // look up owner from token
      supabase.from('invite_tokens').select('owner_id').eq('token', token).maybeSingle().then(({ data }) => {
        if (data) setInviteOwnerId(data.owner_id)
      })
    }
  }, [])
  const [mode, setMode]         = useState(window.location.pathname.includes('/invite/') ? 'signup' : 'signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [phone, setPhone]       = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [resetSent, setResetSent] = useState(false)

  if (!lang) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-800 to-brand-900 flex flex-col items-center justify-center p-6">
        <div className="mb-10 text-center">
          <img src="/logo.png" alt="FieldSnap" className="h-16 object-contain mx-auto mb-2" />
          <p className="text-brand-200 mt-1">Field Crew Management · Gestión de Cuadrilla</p>
        </div>
        <div className="w-full max-w-sm space-y-4">
          <p className="text-center text-white/70 text-sm mb-4">Choose your language / Elige tu idioma</p>
          <button onClick={() => setLang('en')} className="w-full py-4 bg-white text-brand-800 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all">🇺🇸 English</button>
          <button onClick={() => setLang('es')} className="w-full py-4 bg-accent-500 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all">🇲🇽 Español</button>
        </div>
      </div>
    )
  }

  async function handleSignIn(e) {
    e.preventDefault(); setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleSignUp(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (!firstName.trim()) throw new Error(lang === 'es' ? 'El nombre es requerido' : 'First name is required')
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
      const { data, error: authErr } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { full_name: fullName, phone, language: lang } }
      })
      if (authErr) throw authErr
      const userId = data.user.id
      const role = inviteToken ? 'contractor' : 'owner'
      await supabase.from('profiles').insert({
        id: userId,
        name: fullName,
        phone,
        email,
        language: lang,
        role
      })
      // if invited, link to owner's properties
      if (inviteToken && inviteOwnerId) {
        // get all owner properties and link contractor
        const { data: props } = await supabase.from('properties').select('id').eq('owner_id', inviteOwnerId)
        if (props && props.length > 0) {
          await supabase.from('property_contractors').insert(
            props.map(p => ({ property_id: p.id, contractor_id: userId }))
          )
        }
      }
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  async function handleForgot() {
    if (!email) { setError(t('field.email', lang)); return }
    await supabase.auth.resetPasswordForEmail(email)
    setResetSent(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-800 to-brand-900 flex flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        <img src="/logo.png" alt="FieldSnap" className="h-14 object-contain mx-auto mb-2" />
        <p className="text-brand-200 text-sm mt-1">{t('auth.tagline', lang)}</p>
      </div>
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-7">
        <div className="flex mb-6 border-b border-gray-100">
          {!inviteToken && <button onClick={() => setMode('signin')} className={`flex-1 pb-3 text-sm font-semibold ${mode==='signin'?'tab-active':'tab-inactive'}`}>{t('auth.signIn',lang)}</button>}
          <button onClick={() => setMode('signup')} className={`flex-1 pb-3 text-sm font-semibold ${mode==='signup'?'tab-active':'tab-inactive'}`}>{t('auth.createAccount',lang)}</button>
        </div>

        {error     && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
        {resetSent && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">{t('auth.resetSent',lang)}</div>}

        <form onSubmit={mode==='signin'?handleSignIn:handleSignUp} className="space-y-3">
          {mode==='signup' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <input className="input text-sm py-2.5"
                  type="text"
                  placeholder={lang === 'es' ? 'Nombre' : 'First name'}
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required />
                <input className="input text-sm py-2.5"
                  type="text"
                  placeholder={lang === 'es' ? 'Apellido' : 'Last name'}
                  value={lastName}
                  onChange={e => setLastName(e.target.value)} />
              </div>
              <input className="input"
                type="tel"
                placeholder="555-555-5555"
                value={phone}
                inputMode="numeric"
                onChange={e => setPhone(formatPhone(e.target.value))}
                maxLength={12} />
            </>
          )}
          <input className="input" type="email" placeholder={t('field.email',lang)} value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder={t('field.password',lang)} value={password} onChange={e=>setPassword(e.target.value)} required />

          <button type="submit" className="btn-primary w-full mt-1" disabled={loading}>
            {loading ? t('action.loading',lang) : mode==='signin' ? t('auth.signInBtn',lang) : t('auth.signUpBtn',lang)}
          </button>
        </form>

        {mode==='signin' && (
          <button onClick={handleForgot} className="mt-3 text-xs text-brand-600 underline w-full text-center">{t('auth.forgotPassword',lang)}</button>
        )}

        <div className="mt-5 pt-4 border-t border-gray-100 flex justify-center gap-3">
          <button onClick={() => setLang('en')} className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-colors ${lang==='en'?'bg-brand-700 text-white':'text-gray-400'}`}>🇺🇸 EN</button>
          <button onClick={() => setLang('es')} className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-colors ${lang==='es'?'bg-accent-500 text-white':'text-gray-400'}`}>🇲🇽 ES</button>
        </div>
      </div>
    </div>
  )
}
