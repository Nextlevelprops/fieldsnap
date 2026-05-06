import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { format, startOfWeek, endOfWeek, parseISO, isWithinInterval } from 'date-fns'

export default function WorkLogPage({ onBack }) {
  const { profile, lang } = useApp()
  const [logs, setLogs] = useState([])
  const [properties, setProperties] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [prop1, setProp1] = useState('')
  const [prop2, setProp2] = useState('')
  const [dayType, setDayType] = useState('full')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all') // 'all', 'week', 'month'

  useEffect(() => { loadLogs(); loadProperties() }, [])

  async function loadLogs() {
    const { data } = await supabase.from('work_logs')
      .select('*, properties(street, city, name)')
      .eq('contractor_id', profile.id)
      .order('log_date', { ascending: false })
    setLogs(data || [])
  }

  async function loadProperties() {
    const q = profile.role === 'owner'
      ? supabase.from('properties').select('id,name,street').eq('status', 'active')
      : supabase.from('property_contractors').select('property_id, properties(id,name,street)').eq('contractor_id', profile.id)
    const { data } = await q
    const list = profile.role === 'owner' ? data : (data || []).map(r => r.properties).filter(Boolean)
    setProperties(list || [])
  }

  async function handleSave() {
    if (!prop1) return
    setSaving(true)
    const rows = [{ contractor_id: profile.id, property_id: prop1, log_date: date, day_type: dayType, slot: 1 }]
    if (dayType === 'half' && prop2 && prop2 !== prop1) {
      rows.push({ contractor_id: profile.id, property_id: prop2, log_date: date, day_type: 'half', slot: 2 })
    }
    await supabase.from('work_logs').upsert(rows, { onConflict: 'contractor_id,property_id,log_date,slot' })
    setSaving(false)
    setShowForm(false)
    setProp1(''); setProp2(''); setDayType('full')
    setDate(format(new Date(), 'yyyy-MM-dd'))
    loadLogs()
  }

  const filtered = logs.filter(l => {
    if (filter === 'week') {
      const now = new Date()
      return isWithinInterval(parseISO(l.log_date), { start: startOfWeek(now, { weekStartsOn: 6 }), end: endOfWeek(now, { weekStartsOn: 6 }) })
    }
    if (filter === 'month') {
      const now = new Date()
      return parseISO(l.log_date).getMonth() === now.getMonth() && parseISO(l.log_date).getFullYear() === now.getFullYear()
    }
    return true
  })

  // Group by week
  const grouped = {}
  filtered.forEach(l => {
    const weekStart = format(startOfWeek(parseISO(l.log_date), { weekStartsOn: 6 }), 'MMM d')
    const weekEnd = format(endOfWeek(parseISO(l.log_date), { weekStartsOn: 6 }), 'MMM d, yyyy')
    const key = `${weekStart} – ${weekEnd}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(l)
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-brand-700 px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="text-white text-xl active:scale-95">←</button>
        <h1 className="text-white font-bold text-lg">{lang === 'es' ? 'Registro de Trabajo' : 'Work Log'}</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-accent-500 text-white text-xs font-bold px-3 py-1.5 rounded-full active:scale-95">
          + {lang === 'es' ? 'Agregar' : 'Log Day'}
        </button>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="bg-white border-b border-gray-100 px-4 py-4 space-y-3">
          <p className="font-semibold text-gray-800">{lang === 'es' ? 'Registrar día de trabajo' : 'Log Work Day'}</p>
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={() => setDayType('full')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${dayType === 'full' ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-gray-600 border-gray-200'}`}>
              {lang === 'es' ? 'Día completo' : 'Full Day'}
            </button>
            <button onClick={() => setDayType('half')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${dayType === 'half' ? 'bg-accent-500 text-white border-accent-500' : 'bg-white text-gray-600 border-gray-200'}`}>
              {lang === 'es' ? 'Medio día' : 'Half Day'}
            </button>
          </div>
          <select className="input" value={prop1} onChange={e => setProp1(e.target.value)}>
            <option value="">{lang === 'es' ? 'Seleccionar propiedad' : 'Select property'}</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.street || p.name}</option>)}
          </select>
          {dayType === 'half' && (
            <select className="input" value={prop2} onChange={e => setProp2(e.target.value)}>
              <option value="">{lang === 'es' ? 'Segunda propiedad (opcional)' : 'Second property (optional)'}</option>
              {properties.filter(p => p.id !== prop1).map(p => <option key={p.id} value={p.id}>{p.street || p.name}</option>)}
            </select>
          )}
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 btn-secondary text-sm">
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button onClick={handleSave} disabled={saving || !prop1} className="flex-1 btn-primary text-sm">
              {saving ? '...' : (lang === 'es' ? 'Guardar' : 'Save')}
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        {['all', 'week', 'month'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-2.5 text-sm font-semibold ${filter === f ? 'border-b-2 border-brand-700 text-brand-700' : 'text-gray-400'}`}>
            {f === 'all' ? (lang === 'es' ? 'Todo' : 'All') : f === 'week' ? (lang === 'es' ? 'Esta semana' : 'This week') : (lang === 'es' ? 'Este mes' : 'This month')}
          </button>
        ))}
      </div>

      {/* Log list */}
      <div className="px-4 py-4 space-y-5">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📋</div>
            <p>{lang === 'es' ? 'Sin registros aún' : 'No logs yet'}</p>
          </div>
        ) : Object.entries(grouped).map(([week, weekLogs]) => (
          <div key={week}>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">{week}</p>
            <div className="space-y-2">
              {weekLogs.map(l => (
                <div key={l.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{l.properties?.street || l.properties?.name}</p>
                    <p className="text-xs text-gray-400">{format(parseISO(l.log_date), 'EEEE, MMM d')}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${l.day_type === 'full' ? 'bg-brand-100 text-brand-700' : 'bg-orange-100 text-orange-600'}`}>
                    {l.day_type === 'full' ? (lang === 'es' ? 'Completo' : 'Full') : (lang === 'es' ? 'Medio' : 'Half')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
