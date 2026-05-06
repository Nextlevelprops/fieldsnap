import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { t } from '../lib/i18n'
import { isToday, isPast, isFuture, parseISO } from 'date-fns'
import TaskCard from '../components/TaskCard'
import CreateTaskModal from '../components/CreateTaskModal'
import PropertySettingsModal from '../components/PropertySettingsModal'
import TaskDetailModal from '../components/TaskDetailModal'

const tabMemory = {}

export default function PropertyPage({ property, onBack, onRefreshDashboard, initialTask, onTaskOpened }) {
  const { profile, lang } = useApp()
  const [tab, setTab]         = useState(tabMemory[property.id] || 'today')
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate]     = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedTask, setSelectedTask] = useState(initialTask || null)
  const isOwner = profile?.role === 'owner'

  function changeTab(t) { tabMemory[property.id] = t; setTab(t) }

  useEffect(() => { loadTasks() }, [property.id])

  async function loadTasks() {
    setLoading(true)
    const { data } = await supabase.from('tasks')
      .select('*, creator:profiles!tasks_created_by_fkey(name,photo_url), completer:profiles!tasks_completed_by_fkey(name,photo_url)')
      .eq('property_id', property.id)
      .order('created_at', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }

  function sortOpen(list) {
    return [...list].sort((a, b) => {
      const aOver = a.due_date && isPast(parseISO(a.due_date)) && !isToday(parseISO(a.due_date))
      const bOver = b.due_date && isPast(parseISO(b.due_date)) && !isToday(parseISO(b.due_date))
      if (aOver && !bOver) return -1
      if (!aOver && bOver) return 1
      if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date)
      if (a.due_date) return -1
      if (b.due_date) return 1
      return new Date(b.created_at) - new Date(a.created_at)
    })
  }

  const open        = tasks.filter(t => t.status !== 'completed')
  const todayTasks  = sortOpen(open.filter(t => !t.due_date || isToday(parseISO(t.due_date)) || isPast(parseISO(t.due_date))))
  const futureTasks = sortOpen(open.filter(t => t.due_date && isFuture(parseISO(t.due_date)) && !isToday(parseISO(t.due_date))))
  const doneTasks   = [...tasks.filter(t => t.status === 'completed')].sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
  const displayTasks = tab === 'today' ? todayTasks : tab === 'upcoming' ? futureTasks : doneTasks

  const TABS = [
    { id: 'today',    label: t('tasks.today', lang),    count: todayTasks.length },
    { id: 'upcoming', label: t('tasks.upcoming', lang), count: futureTasks.length },
    { id: 'done',     label: t('tasks.done', lang),     count: doneTasks.length },
  ]

  async function handleCompleteProperty() {
    const ok = window.confirm(t('property.confirmComplete', lang))
    if (!ok) return
    await supabase.from('properties').update({ status: 'completed' }).eq('id', property.id)
    onRefreshDashboard?.()
    onBack()
  }

  return (
    <div className="min-h-screen bg-gray-50 page-enter">
      <div className="bg-brand-700 safe-top">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={onBack} className="text-white text-xl active:scale-95">←</button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white truncate">{property.name}</h2>
            <p className="text-brand-200 text-xs truncate">{property.street}</p>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && <button onClick={() => setShowSettings(true)} className="text-white text-lg active:scale-95">⚙️</button>}
            {open.length === 0 && isOwner && property.status !== 'completed' && (
              <button onClick={handleCompleteProperty} className="text-xs bg-green-500 text-white px-3 py-1 rounded-full font-semibold active:scale-95">
                {t('property.markComplete', lang)}
              </button>
            )}
            {isOwner && property.status === 'completed' && (
              <button onClick={async () => {
                if (!window.confirm(lang === 'es' ? '¿Reabrir esta propiedad?' : 'Reopen this property?')) return
                await supabase.from('properties').update({ status: 'active' }).eq('id', property.id)
                onBack()
              }} className="text-xs bg-yellow-500 text-white px-3 py-1 rounded-full font-semibold active:scale-95">
                {lang === 'es' ? 'Reabrir' : 'Reopen'}
              </button>
            )}
          </div>
        </div>

        {/* Cover photo - object-cover so it fills without stretching */}
        {property.cover_photo_url && (
          <div className="bg-gray-900">
            <img src={property.cover_photo_url} className="w-full object-contain" style={{maxHeight:"220px"}} alt={property.name} />
          </div>
        )}

        <div className="flex px-4">
          {TABS.map(tb => (
            <button key={tb.id} onClick={() => changeTab(tb.id)}
              className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === tb.id ? 'border-white text-white' : 'border-transparent text-brand-300'
              }`}>
              {tb.label}
              {tb.count > 0 && (
                <span className={`ml-1 text-xs rounded-full px-1.5 ${tab === tb.id ? 'bg-white/20 text-white' : 'bg-brand-600 text-brand-200'}`}>
                  {tb.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 pb-24">
        {loading ? (
          <div className="flex justify-center pt-16"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : displayTasks.length === 0 ? (
          <div className="text-center py-16"><div className="text-5xl mb-3">📋</div><p className="text-gray-400 font-medium">{t('tasks.noTasks', lang)}</p></div>
        ) : displayTasks.map(task => (
          <TaskCard key={task.id} task={task} lang={lang} onTap={() => setSelectedTask(task)} />
        ))}
      </div>

      {property.status !== 'completed' && (
        <button onClick={() => setShowCreate(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-accent-500 rounded-full shadow-xl flex items-center justify-center text-white text-2xl active:scale-95 z-30">
          📷
        </button>
      )}

      {showCreate && (
        <CreateTaskModal propertyId={property.id} lang={lang}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadTasks() }} />
      )}
      {showSettings && (
        <PropertySettingsModal property={property} lang={lang}
          onClose={() => setShowSettings(false)}
          onUpdated={() => { setShowSettings(false); onRefreshDashboard?.() }} />
      )}
      {selectedTask && (
        <TaskDetailModal task={selectedTask} lang={lang} propertyId={property.id}
          onClose={() => setSelectedTask(null)}
          onRefresh={loadTasks} />
      )}
    </div>
  )
}
