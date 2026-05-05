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

    // If the user confirmed their email before a profile row was created,
    // create the missing profile from the signup metadata so the dashboard does not spin forever.
    const meta = user?.user_metadata || {}
    const fallbackProfile = {
      id: userId,
      name: meta.name || user?.email?.split('@')?.[0] || 'User',
      phone: meta.phone || null,
      email: user?.email || null,
      photo_url: null,
      language: meta.language === 'es' ? 'es' : 'en',
      role: 'contractor'
    }

    const { data: created, error: createErr } = await supabase
      .from('profiles')
      .upsert(fallbackProfile, { onConflict: 'id' })
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
