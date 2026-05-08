import { useApp } from '../context/AppContext'

export default function NotificationBell({ onOpen }) {
  const { notifications } = useApp()
  const count = notifications.filter(n => !n.read).length

  return (
    <button onClick={onOpen} className="relative w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center active:scale-95">
      <span className="text-lg">🔔</span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  )
}
