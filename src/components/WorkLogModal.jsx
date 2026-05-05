import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { t, formatShortDate } from '../lib/i18n'
import { format } from 'date-fns'
import Modal from './Modal'

export default function WorkLogModal({ lang, onClose }) {
  const { profile } = useApp()
  const [properties, setProperties] = useState([])
  const [prop1, setProp1]   = useState('')
  const [prop2, setProp2]   = useState('')
  const [dayType, setDayType] = useState('full')
  const [date, setDate]     = useState(format(new Date(), 'yyyy-MM-dd'))
  const [saving, setSaving] = useState(false)

  const isHalf = dayType === 'half'

  useEffect(() => {
    const q = profile.role==='owner'
      ? supabase.from('properties').select('id,name,street').eq('status','active')
      : supabase.from('property_contractors').select('property_id, properties(id,name,street)').eq('contractor_id', profile.id)
    q.then(({ data }) => {
      const list = profile.role==='owner' ? data : (data||[]).map(r=>r.properties).filter(Boolean)
      setProperties(list || [])
    })
  }, [])

  async function handleSave() {
    if (!prop1) return; setSaving(true)
    const rows = [{ contractor_id: profile.id, property_id: prop1, log_date: date, day_type: dayType, slot: 1 }]
    if (isHalf && prop2 && prop2 !== prop1) {
      rows.push({ contractor_id: profile.id, property_id: prop2, log_date: date, day_type: 'half', slot: 2 })
    }
    await supabase.from('work_logs').upsert(rows, { onConflict: 'contractor_id,property_id,log_date,slot' })
    setSaving(false); onClose()
  }

  return (
    <Modal onClose={onClose} title={t('worklog.title', lang)}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('worklog.date', lang)}</label>
          <input type="date" className="input" value={date} onChange={e=>setDate(e.target.value)} />
          {date && <p className="text-xs text-gray-400 mt-1">{formatShortDate(date, lang)}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('worklog.dayType', lang)}</label>
          <div className="flex gap-2">
            <button onClick={() => setDayType('full')}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${dayType==='full'?'bg-brand-700 text-white border-brand-700':'bg-white text-gray-600 border-gray-200'}`}>
              {t('worklog.fullDay', lang)}
            </button>
            <button onClick={() => setDayType('half')}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${dayType==='half'?'bg-accent-500 text-white border-accent-500':'bg-white text-gray-600 border-gray-200'}`}>
              {t('worklog.halfDay', lang)}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isHalf ? t('worklog.property1Half', lang) : t('worklog.property1', lang)}
          </label>
          <select className="input" value={prop1} onChange={e=>setProp1(e.target.value)}>
            <option value="">{t('field.select', lang)}</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.street || p.name}</option>)}
          </select>
        </div>

        {isHalf && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('worklog.property2', lang)}</label>
            <select className="input" value={prop2} onChange={e=>setProp2(e.target.value)}>
              <option value="">{t('field.select', lang)}</option>
              {properties.filter(p=>p.id!==prop1).map(p => <option key={p.id} value={p.id}>{p.street || p.name}</option>)}
            </select>
          </div>
        )}

        <button onClick={handleSave} disabled={saving||!prop1} className="btn-primary w-full">
          {saving ? t('action.saving', lang) : t('worklog.save', lang)}
        </button>
      </div>
    </Modal>
  )
}
