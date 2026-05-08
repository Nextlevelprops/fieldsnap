import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { t, formatShortDate } from '../lib/i18n'
import { isPast, isToday, parseISO } from 'date-fns'
import TaskDetailModal from '../components/TaskDetailModal'

export default function MyTasksPage({ onBack }) {
  const { profile, lang } = useApp()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState(null)

  useEffect(() => { loadTasks() }, [profile])

  async function loadTasks() {
    if (!profile) return
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*, property:properties(id,name,street), creator:profiles!tasks_created_by_fkey(name,photo_url), completer:profiles!tasks_completed_by_fkey(name,photo_url)')
      .eq('assigned_to', profile.id)
      .eq('status', 'open')
      .order('due_date', { ascending: true, nullsFirst: false })
    setTasks(data || [])
    setLoading(false)
  }

  function isOverdue(task) {
    return task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date))
  }

  function isDueToday(task) {
    return task.due_date && isToday(parseISO(task.due_date))
  }

  // Sort: overdue first, then today, then future, then no date
  const sorted = [...tasks].sort((a, b) => {
    const aOver = isOverdue(a), bOver = isOverdue(b)
    const aToday = isDueToday(a), bToday = isDueToday(b)
    if (aOver && !bOver) return -1
    if (!aOver && bOver) return 1
    if (aToday && !bToday) return -1
    if (!aToday && bToday) return 1
    if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date)
    if (a.due_date) return -1
    if (b.due_date) return 1
    return new Date(b.created_at) - new Date(a.created_at)
  })

  return (
    <div className="min-h-screen bg-gray-50 page-enter">
      <div className="bg-brand-700 safe-top">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={onBack} className="text-white text-xl active:scale-95">←</button>
          <h2 className="text-lg font-bold text-white flex-1">{lang === 'es' ? 'Mis Tareas' : 'My Tasks'}</h2>
          <span className="text-brand-200 text-sm">{sorted.length} {lang === 'es' ? 'abiertas' : 'open'}</span>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 pb-24">
        {loading ? (
          <div className="flex justify-center pt-16"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-gray-500 font-medium">{lang === 'es' ? 'No tienes tareas asignadas' : 'No tasks assigned to you'}</p>
          </div>
        ) : sorted.map(task => {
          const title = lang === 'es' ? (task.title_es || task.title_en) : (task.title_en || task.title_es)
          const overdue = isOverdue(task)
          const today = isDueToday(task)
          return (
            <button key={task.id} onClick={() => setSelectedTask(task)}
              className="w-full bg-white rounded-2xl shadow-sm p-4 text-left active:scale-95 transition-transform">
              <div className="flex gap-3">
                {task.photo_url && (
                  <img src={task.photo_url} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" alt="" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{title || (lang === 'es' ? 'Sin descripción' : 'No description')}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{task.property?.name || task.property?.street}</p>
                  {task.due_date && (
                    <span className={`inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      overdue ? 'bg-red-100 text-red-600' :
                      today ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {overdue ? (lang === 'es' ? '⚠️ Vencida' : '⚠️ Overdue') :
                       today ? (lang === 'es' ? '📅 Hoy' : '📅 Today') :
                       formatShortDate(task.due_date, lang)}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          lang={lang}
          propertyId={selectedTask.property_id}
          onClose={() => setSelectedTask(null)}
          onRefresh={loadTasks}
        />
      )}
    </div>
  )
}
