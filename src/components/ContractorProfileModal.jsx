import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { t, formatShortDate, getDayName } from '../lib/i18n'
import Modal from './Modal'
import TaskDetailModal from './TaskDetailModal'
import { isPast, isToday, parseISO } from 'date-fns'

const PAY_TYPES = ['daily','hourly','weekly','gc']

export default function ContractorProfileModal({ contractor, lang, onClose }) {
  const { profile } = useApp()
  const [tab, setTab]         = useState('info')
  const [activity, setActivity] = useState([])
  const [workLogs, setWorkLogs] = useState([])
  const [payRate, setPayRate] = useState(null)
  const [payType, setPayType] = useState('daily')
  const [rateInput, setRateInput] = useState('')
  const [saving, setSaving]   = useState(false)
  const [properties, setProperties] = useState([])
  const [tasks, setTasks] = useState([])
  const [taskFilter, setTaskFilter] = useState('all') // 'all' or property_id
  const [taskTab, setTaskTab] = useState('open') // 'open' or 'completed'
  const [selectedTask, setSelectedTask] = useState(null)
  const isOwner = profile?.role === 'owner'

  useEffect(() => {
    loadActivity(); loadWorkLogs(); loadPayRate(); loadProperties(); loadTasks()
  }, [contractor.id])

  async function loadActivity() {
    const { data: created }   = await supabase.from('tasks').select('id,title_en,title_es,created_at,property:properties(street)').eq('created_by', contractor.id).order('created_at',{ascending:false}).limit(20)
    const { data: completed } = await supabase.from('tasks').select('id,title_en,title_es,completed_at,property:properties(street)').eq('completed_by', contractor.id).order('completed_at',{ascending:false}).limit(20)
    const all = [
      ...(created||[]).map(t=>({...t,action:'created',date:t.created_at})),
      ...(completed||[]).map(t=>({...t,action:'completed',date:t.completed_at}))
    ].sort((a,b)=>new Date(b.date)-new Date(a.date))
    setActivity(all)
  }

  async function loadWorkLogs() {
    const { data } = await supabase.from('work_logs').select('*, property:properties(street,name)').eq('contractor_id', contractor.id).order('log_date',{ascending:false}).limit(30)
    setWorkLogs(data || [])
  }

  async function loadPayRate() {
    const { data } = await supabase.from('pay_rates').select('*').eq('contractor_id', contractor.id).single()
    if (data) { setPayRate(data); setPayType(data.pay_type); setRateInput(String(data.rate)) }
  }

  async function loadTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*, property:properties(id,street,name), creator:profiles!tasks_created_by_fkey(name,photo_url), completer:profiles!tasks_completed_by_fkey(name,photo_url)')
      .eq('assigned_to', contractor.id)
      .order('due_date', { ascending: true, nullsFirst: false })
    setTasks(data || [])
  }

  async function loadProperties() {
    const { data } = await supabase.from('property_contractors').select('property_id, properties(street,name)').eq('contractor_id', contractor.id)
    setProperties((data||[]).map(r=>r.properties).filter(Boolean))
  }

  async function savePayRate() {
    setSaving(true)
    const upsertData = { contractor_id: contractor.id, pay_type: payType, rate: parseFloat(rateInput), set_by_owner_id: profile.id }
    if (payRate?.id) await supabase.from('pay_rates').update(upsertData).eq('id', payRate.id)
    else await supabase.from('pay_rates').insert(upsertData)
    setSaving(false); alert(t('contractor.saved', lang))
  }

  const TABS = [
    { id:'info',     label: t('contractor.tabInfo', lang) },
    { id:'tasks',    label: lang === 'es' ? 'Tareas' : 'Tasks' },
    { id:'activity', label: t('contractor.tabActivity', lang) },
    { id:'schedule', label: t('contractor.tabSchedule', lang) },
    ...(isOwner ? [{ id:'pay', label: t('contractor.tabPay', lang) }] : []),
  ]

  const PAY_TYPE_LABELS = {
    daily:  t('contractor.payPerDay', lang),
    hourly: t('contractor.payPerHour', lang),
    weekly: t('contractor.payWeeklyFlat', lang),
    gc:     t('contractor.payGC', lang),
  }

  return (
    <>
    <Modal onClose={onClose} title={contractor.name}>
      <div className="flex border-b border-gray-100 mb-4 -mt-1">
        {TABS.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={`flex-1 pb-2 text-xs font-semibold transition-colors ${tab===tb.id?'tab-active':'tab-inactive'}`}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* Info */}
      {tab==='info' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {contractor.photo_url
              ? <img src={contractor.photo_url} className="w-20 h-20 rounded-full object-contain" alt="" />
              : <div className="w-20 h-20 bg-brand-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">{contractor.name?.[0]}</div>
            }
            <div>
              <p className="font-bold text-gray-800 text-lg">{contractor.name}</p>
              {contractor.phone && <p className="text-gray-500 text-sm">📞 {contractor.phone}</p>}
              {contractor.email && <p className="text-gray-500 text-sm">✉️ {contractor.email}</p>}
            </div>
          </div>
          <div>
            <p className="font-semibold text-gray-600 text-sm mb-2">{t('contractor.assignedProps', lang)}</p>
            {properties.map((p,i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-50">
                <span className="text-gray-400">🏠</span>
                <span className="text-sm text-gray-700">{p.street}</span>
              </div>
            ))}
            {properties.length===0 && <p className="text-sm text-gray-400">{t('property.noProperties', lang)}</p>}
          </div>
        </div>
      )}

      {/* Activity */}
      {tab==='activity' && (
        <div className="space-y-2">
          {activity.map((a,i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50">
              <span className="text-lg mt-0.5">{a.action==='created'?'📝':'✅'}</span>
              <div>
                <p className="text-sm text-gray-700 font-medium line-clamp-1">{lang==='es'?(a.title_es||a.title_en):(a.title_en||a.title_es)}</p>
                <p className="text-xs text-gray-400">
                  {a.action==='created' ? t('contractor.created',lang) : t('contractor.completed',lang)} · {a.property?.street} · {a.date ? formatShortDate(a.date, lang) : ''}
                </p>
              </div>
            </div>
          ))}
          {activity.length===0 && <p className="text-sm text-gray-400 text-center py-8">{t('contractor.noActivity', lang)}</p>}
        </div>
      )}

      {/* Schedule */}
      {tab==='schedule' && (
        <div className="space-y-2">
          {workLogs.map((w,i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50">
              <div className="text-center w-14">
                <p className="text-xs text-gray-400">{getDayName(w.log_date, lang, true)}</p>
                <p className="font-bold text-gray-800">{new Date(w.log_date).getDate()}</p>
                <p className="text-xs text-gray-400">{formatShortDate(w.log_date, lang)}</p>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">{w.property?.street || w.property?.name}</p>
              </div>
              <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${w.day_type==='full'?'bg-brand-100 text-brand-700':'bg-orange-100 text-orange-700'}`}>
                {w.day_type==='full' ? t('worklog.fullDayLabel', lang) : t('worklog.halfDayLabel', lang)}
              </div>
            </div>
          ))}
          {workLogs.length===0 && <p className="text-sm text-gray-400 text-center py-8">{t('contractor.noLogs', lang)}</p>}
        </div>
      )}

      {/* Pay (owner only) */}
      {tab==='tasks' && (
        <div>
          {/* Property filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
            <button onClick={() => setTaskFilter('all')}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${taskFilter==='all' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {lang === 'es' ? 'Todas' : 'All'}
            </button>
            {properties.map(p => (
              <button key={p.id || p.street} onClick={() => setTaskFilter(p.id || p.street)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${taskFilter===(p.id||p.street) ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {p.street}
              </button>
            ))}
          </div>

          {/* Open / Completed toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-3">
            <button onClick={() => setTaskTab('open')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${taskTab==='open' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500'}`}>
              {lang === 'es' ? 'Abiertas' : 'Open'}
            </button>
            <button onClick={() => setTaskTab('completed')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${taskTab==='completed' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500'}`}>
              {lang === 'es' ? 'Completadas' : 'Completed'}
            </button>
          </div>

          {/* Task list */}
          <div className="space-y-2">
            {tasks
              .filter(t => taskTab === 'open' ? t.status === 'open' : t.status === 'completed')
              .filter(t => taskFilter === 'all' || t.property_id === taskFilter || t.property?.street === taskFilter)
              .map(task => {
                const title = lang === 'es' ? (task.title_es || task.title_en) : (task.title_en || task.title_es)
                const overdue = task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date)) && task.status === 'open'
                const today = task.due_date && isToday(parseISO(task.due_date))
                return (
                  <button key={task.id} onClick={() => setSelectedTask(task)}
                    className="w-full bg-gray-50 rounded-xl p-3 text-left active:scale-95 transition-transform border border-gray-100">
                    <div className="flex items-start gap-3">
                      {task.photo_url && (
                        <img src={task.photo_url} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" alt="" onError={e => e.currentTarget.style.display='none'} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm line-clamp-2">{title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{task.property?.street}</p>
                        {task.status === 'open' && task.due_date && (
                          <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                            overdue ? 'bg-red-100 text-red-600' :
                            today ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {overdue ? '⚠️ Overdue' : today ? '📅 Today' : task.due_date}
                          </span>
                        )}
                        {task.status === 'completed' && task.completed_at && (
                          <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            ✅ {lang === 'es' ? 'Completada' : 'Completed'} {formatShortDate(task.completed_at, lang)}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            {tasks.filter(t => taskTab==='open' ? t.status==='open' : t.status==='completed')
              .filter(t => taskFilter==='all' || t.property_id===taskFilter || t.property?.street===taskFilter)
              .length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">
                {lang === 'es' ? 'No hay tareas' : 'No tasks'}
              </p>
            )}
          </div>
        </div>
      )}

      {tab==='pay' && isOwner && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('contractor.payType', lang)}</label>
            <div className="grid grid-cols-2 gap-2">
              {PAY_TYPES.map(pt => (
                <button key={pt} onClick={() => setPayType(pt)}
                  className={`py-2 rounded-xl text-sm font-semibold border transition-all ${payType===pt?'bg-brand-700 text-white border-brand-700':'bg-white text-gray-600 border-gray-200'}`}>
                  {PAY_TYPE_LABELS[pt]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('contractor.payRate', lang)}
              {payType==='gc' && <span className="text-gray-400 font-normal"> — {t('contractor.payPerWeek', lang)}</span>}
            </label>
            <input className="input" type="number" placeholder="0.00" value={rateInput} onChange={e=>setRateInput(e.target.value)} />
          </div>
          {payType==='gc' && (
            <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">{t('contractor.payGCNote', lang)}</div>
          )}
          <button onClick={savePayRate} disabled={saving||!rateInput} className="btn-primary w-full">
            {saving ? t('action.saving', lang) : t('contractor.saveRate', lang)}
          </button>
        </div>
      )}
    </Modal>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          lang={lang}
          propertyId={selectedTask.property_id}
          onClose={() => setSelectedTask(null)}
          onRefresh={loadTasks}
        />
      )}
    </>
  )
}
