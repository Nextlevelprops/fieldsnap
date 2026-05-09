import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { formatDateTime } from '../lib/i18n'
import { useState, useEffect } from 'react'

export default function NotificationsPage({ onBack, onOpenTask }) {
  const { notifications, markNotificationRead, lang, loadNotifications } = useApp()
  const [enriched, setEnriched] = useState([])

  useEffect(() => {
    async function enrich() {
      const results = await Promise.all(notifications.map(async n => {
        let mentioner = null, propertyAddress = null, requesterName = null, propertyName = null
        if (n.comment_id) {
          const { data: comment } = await supabase.from('comments')
            .select('user_id, profiles!comments_user_id_fkey(name)')
            .eq('id', n.comment_id).single()
          mentioner = comment?.profiles?.name
        }
        if ((n.type === 'access_request' || n.type === 'access_approved' || n.type === 'access_denied') && n.property_id) {
          const { data: prop } = await supabase.from('properties')
            .select('street, name').eq('id', n.property_id).single()
          propertyName = prop?.name || prop?.street
          if (n.request_id) {
            const { data: req } = await supabase.from('access_requests')
              .select('contractor_id, profiles(name)').eq('id', n.request_id).single()
            requesterName = req?.profiles?.name
          }
        }
        if (n.task_id) {
          const { data: task } = await supabase.from('tasks')
            .select('property_id').eq('id', n.task_id).single()
          if (task?.property_id) {
            const { data: prop } = await supabase.from('properties')
              .select('street, city, state').eq('id', task.property_id).single()
            propertyAddress = prop ? `${prop.street}, ${prop.city}` : null
          }
        }
        return { ...n, mentioner, propertyAddress, requesterName, propertyName }
      }))
      setEnriched(results)
    }
    enrich()
  }, [notifications])

  async function handleClick(n) {
    if (!n.read) await markNotificationRead(n.id)
    if (n.task_id && onOpenTask) {
      // Look up the full task with its property
      const { data: task } = await supabase.from('tasks')
        .select('*, creator:profiles!tasks_created_by_fkey(name,photo_url), completer:profiles!tasks_completed_by_fkey(name,photo_url)')
        .eq('id', n.task_id).single()
      if (task) onOpenTask(task)
      else onBack()
    } else onBack()
  }

  async function handleAccessRequest(n, action) {
    if (!n.request_id || !n.property_id) {
      console.error('Missing request_id or property_id', n)
      return
    }
    try {
      console.log('handleAccessRequest:', action, n.request_id)

      // 1. Update request status
      const { error: updateErr } = await supabase.from('access_requests')
        .update({ status: action }).eq('id', n.request_id)
      if (updateErr) { console.error('update error:', updateErr); throw updateErr }

      // 2. Get contractor_id from the request
      const { data: req, error: reqErr } = await supabase.from('access_requests')
        .select('contractor_id, property_id').eq('id', n.request_id).single()
      console.log('req:', req, 'reqErr:', reqErr)
      if (reqErr) throw reqErr

      const contractorId = req?.contractor_id
      const propertyId = req?.property_id || n.property_id
      if (!contractorId) throw new Error('Could not find contractor_id')

      // 3. If approved, add to property_contractors
      if (action === 'approved') {
        const { error: pcErr } = await supabase.from('property_contractors').upsert({
          contractor_id: contractorId,
          property_id: propertyId
        })
        if (pcErr) console.error('property_contractors error:', pcErr)
      }

      // 4. Insert bell notification for contractor
      const { error: notifErr } = await supabase.from('notifications').insert({
        user_id: contractorId,
        type: action === 'approved' ? 'access_approved' : 'access_denied',
        property_id: propertyId,
        read: false
      })
      console.log('notif insert error:', notifErr)

      // 5. Send push notification
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (token) {
        const pushResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            user_id: contractorId,
            title: action === 'approved' ? 'Access Approved ✓' : 'Access Denied',
            body: action === 'approved'
              ? 'Your access request has been approved'
              : 'Your access request was denied',
            url: '/'
          })
        })
        console.log('push resp:', pushResp.status)
      }

      await markNotificationRead(n.id)
      setEnriched(prev => prev.map(e => e.id === n.id ? { ...e, resolved: true } : e))
    } catch(err) {
      console.error('handleAccessRequest error:', err)
      alert('Error: ' + err.message)
    }
  }

  async function markAllRead() {
    for (const n of notifications.filter(n => !n.read)) {
      await supabase.from('notifications').update({ read: true }).eq('id', n.id)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand-700 px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="text-white text-xl active:scale-95">←</button>
        <h1 className="text-white font-bold text-lg">{lang === 'es' ? 'Notificaciones' : 'Notifications'}</h1>
        <div className="flex gap-3">
          <button onClick={() => { loadNotifications(); setEnriched([]) }} className="text-brand-200 text-xs font-medium">↺</button>
          <button onClick={markAllRead} className="text-brand-200 text-xs font-medium">
            {lang === 'es' ? 'Marcar todo' : 'Mark all read'}
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {notifications.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🔔</div>
            <p>{lang === 'es' ? 'Sin notificaciones' : 'No notifications'}</p>
          </div>
        ) : (enriched.length > 0 ? enriched : notifications).map(n => (
          <div key={n.id} onClick={() => handleClick(n)}
            className={`flex items-start gap-3 px-4 py-4 cursor-pointer active:bg-gray-100 ${n.read ? 'bg-white' : 'bg-blue-50'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${n.read ? 'bg-gray-100' : 'bg-brand-100'}`}>
              <span className="text-lg">{n.type === 'access_request' ? '🔑' : n.type === 'access_approved' ? '✅' : n.type === 'access_denied' ? '❌' : '💬'}</span>
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${n.read ? 'text-gray-400' : 'text-gray-800'}`}>
                {n.type === 'access_request'
                  ? (lang === 'es'
                    ? `${n.requesterName || 'Alguien'} solicita acceso a ${n.propertyName || 'una propiedad'}`
                    : `${n.requesterName || 'Someone'} is requesting access to ${n.propertyName || 'a property'}`)
                  : n.type === 'access_approved'
                    ? (lang === 'es' ? `✓ Acceso aprobado a ${n.propertyName || 'una propiedad'}` : `✓ Access approved to ${n.propertyName || 'a property'}`)
                  : n.type === 'access_denied'
                    ? (lang === 'es' ? `✕ Acceso denegado a ${n.propertyName || 'una propiedad'}` : `✕ Access denied to ${n.propertyName || 'a property'}`)
                  : n.mentioner
                    ? (lang === 'es' ? `${n.mentioner} te mencionó` : `${n.mentioner} mentioned you`)
                    : (lang === 'es' ? 'Te mencionaron en una tarea' : 'You were mentioned in a task')}
              </p>
              {n.propertyAddress && (
                <p className="text-xs text-brand-600 font-medium mt-0.5">{n.propertyAddress}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">{n.created_at ? formatDateTime(n.created_at, lang) : ''}</p>
              {n.type === 'access_request' && !n.resolved && !n.read && (
                <div className="flex gap-2 mt-2">
                  <button onClick={e => { e.stopPropagation(); handleAccessRequest(n, 'approved') }}
                    className="flex-1 bg-green-500 text-white text-xs font-semibold py-1.5 rounded-lg active:scale-95">
                    {lang === 'es' ? '✓ Aprobar' : '✓ Approve'}
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleAccessRequest(n, 'denied') }}
                    className="flex-1 bg-red-400 text-white text-xs font-semibold py-1.5 rounded-lg active:scale-95">
                    {lang === 'es' ? '✕ Denegar' : '✕ Deny'}
                  </button>
                </div>
              )}
            </div>
            {!n.read && <div className="w-2.5 h-2.5 bg-brand-500 rounded-full mt-1 flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  )
}
