import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { t, formatDateTime } from '../lib/i18n'

export default function NotificationBell() {
  const { notifications, markNotificationRead, lang } = useApp()
  const [open, setOpen] = useState(false)
  const count = notifications.length

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center active:scale-95">
        <span className="text-lg">🔔</span>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="font-bold text-gray-800 text-sm">{t('notif.title', lang)}</p>
            </div>
            {notifications.length === 0
              ? <p className="text-sm text-gray-400 text-center py-6">{t('notif.none', lang)}</p>
              : notifications.map(n => (
                <div key={n.id} onClick={() => markNotificationRead(n.id)}
                  className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50">
                  <span className="text-lg mt-0.5">💬</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 font-medium">{t('notif.mentioned', lang)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.created_at ? formatDateTime(n.created_at, lang) : ''}</p>
                  </div>
                </div>
              ))
            }
          </div>
        </>
      )}
    </div>
  )
}
