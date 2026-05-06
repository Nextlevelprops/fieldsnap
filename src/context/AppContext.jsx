import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [session, setSession]       = useState(undefined) // undefined = loading
  const [profile, setProfile]       = useState(undefined) // undefined = loading, null = not found
  const [lang, setLang]             = useState('en')
  const [notifications, setNotifications] = useState([])

  // ── Auth ────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user)
      else setProfile(null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadProfile(session.user)
      else { setProfile(null); setLang('en') }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userOrId) {
    const userId = typeof userOrId === 'string' ? userOrId : userOrId?.id
    const user = typeof userOrId === 'string' ? null : userOrId
    if (!userId) { setProfile(null); return }

    setProfile(undefined)
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()

    if (data) {
      setProfile(data)
      setLang(data.language || 'en')
      return
    }

    // Profile not found yet — may still be inserting after email confirmation.
    // Wait briefly and retry once before creating a fallback.
    await new Promise(r => setTimeout(r, 1500))
    const { data: retry } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (retry) {
      setProfile(retry)
      setLang(retry.language || 'en')
      return
    }

    // Still not found — create minimal fallback (name will be updated by signup flow)
    const meta = user?.user_metadata || {}
    const fallbackProfile = {
      id: userId,
      name: meta.full_name || meta.name || 'User',
      phone: meta.phone || null,
      email: user?.email || null,
      photo_url: null,
      language: meta.language === 'es' ? 'es' : 'en',
      role: 'contractor'
    }

    const { data: created, error: createErr } = await supabase
      .from('profiles')
      .insert(fallbackProfile)
      .select('*')
      .single()

    if (created && !createErr) {
      setProfile(created)
      setLang(created.language || 'en')
    } else {
      console.error('Profile load/create error:', error || createErr)
      setProfile(null)
    }
  }

  // ── Notifications ───────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return
    loadNotifications()
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${session.user.id}`
      }, () => loadNotifications())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [session])

  async function loadNotifications() {
    if (!session?.user?.id) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setNotifications(data)
  }

  async function markNotificationRead(id) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // ── Translation helper ──────────────────────────────────────────────
  function t(enText, esText) {
    return lang === 'es' ? (esText || enText) : enText
  }

  // ── Sign out ────────────────────────────────────────────────────────
  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AppContext.Provider value={{
      session, profile, setProfile, lang, setLang,
      notifications, markNotificationRead, loadNotifications,
      signOut, t, loadProfile
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
