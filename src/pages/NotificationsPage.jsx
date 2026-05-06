import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { formatDateTime } from '../lib/i18n'

export default function NotificationsPage({ onBack, onOpenTask }) {
  const { notifications, markNotificationRead, lang } = useApp()

  async function handleClick(n) {
    if (!n.read) await markNotificationRead(n.id)
    if (n.task_id && onOpenTask) onOpenTask(n.task_id)
    else onBack()
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
        <button onClick={markAllRead} className="text-brand-200 text-xs font-medium">
          {lang === 'es' ? 'Marcar todo' : 'Mark all read'}
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        {notifications.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🔔</div>
            <p>{lang === 'es' ? 'Sin notificaciones' : 'No notifications'}</p>
          </div>
        ) : notifications.map(n => (
          <div key={n.id} onClick={() => handleClick(n)}
            className={`flex items-start gap-3 px-4 py-4 cursor-pointer active:bg-gray-100 ${n.read ? 'bg-white' : 'bg-blue-50'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${n.read ? 'bg-gray-100' : 'bg-brand-100'}`}>
              <span className="text-lg">💬</span>
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${n.read ? 'text-gray-400' : 'text-gray-800'}`}>
                {lang === 'es' ? 'Te mencionaron en una tarea' : 'You were mentioned in a task'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{n.created_at ? formatDateTime(n.created_at, lang) : ''}</p>
            </div>
            {!n.read && <div className="w-2.5 h-2.5 bg-brand-500 rounded-full mt-1 flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  )
}
