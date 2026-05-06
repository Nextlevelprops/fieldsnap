import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { t } from '../lib/i18n'
import PropertyCard from '../components/PropertyCard'
import AddPropertyModal from '../components/AddPropertyModal'
import NotificationBell from '../components/NotificationBell'

export default function Dashboard({ onOpenProperty, onOpenSettings, onOpenNotifications }) {
  const { profile, lang } = useApp()
  const [tab, setTab]               = useState('active')
  const [properties, setProperties] = useState([])
  const [loading, setLoading]       = useState(true)
  const [showAdd, setShowAdd]       = useState(false)
  const isOwner = profile?.role === 'owner'

  useEffect(() => { loadProperties() }, [profile])

  async function loadProperties() {
    if (!profile) return
    setLoading(true)
    let data = []
    if (isOwner) {
      const { data: d } = await supabase.from('properties').select('*').order('created_at', { ascending: false })
      data = d || []
    } else {
      const { data: d } = await supabase.from('property_contractors').select('property_id, properties(*)').eq('contractor_id', profile.id)
      data = (d || []).map(r => r.properties).filter(Boolean)
    }
    setProperties(data)
    setLoading(false)
  }

  const filtered = properties.filter(p => tab === 'active' ? p.status !== 'completed' : p.status === 'completed')

  return (
    <div className="min-h-screen bg-gray-50 page-enter">
      <div className="bg-brand-700">
        <div className="flex items-center justify-between px-4 py-2">
          <img src="/logo.png" alt="FieldSnap" className="h-12 object-contain" />
          <div className="flex items-center gap-3">
            <NotificationBell onOpen={() => onOpenNotifications()} />
            <button onClick={onOpenSettings} className="active:scale-95">
              {profile?.photo_url
                ? <img src={profile.photo_url} className="w-10 h-10 rounded-full object-cover border-2 border-brand-400" alt="profile" />
                : <div className="w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {profile?.name?.[0]?.toUpperCase()}
                  </div>
              }
            </button>
          </div>
        </div>
        <div className="px-4 pb-1">
          <p className="text-brand-200 text-sm font-medium">{t('dashboard.greeting', lang)}, {profile?.name?.split(' ')[0]}</p>
        </div>
        <div className="flex px-4 pb-0">
          {['active','completed'].map(tb => (
            <button key={tb} onClick={() => setTab(tb)}
              className={`flex-1 pb-1 pt-0 text-sm font-semibold border-b-2 transition-colors ${tab===tb?'border-white text-white':'border-transparent text-brand-300'}`}>
              {tb === 'active' ? t('dashboard.active', lang) : t('dashboard.completed', lang)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5">
        {loading ? (
          <div className="flex justify-center pt-16"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏠</div>
            <p className="text-gray-500 font-medium">{t('dashboard.noProperties', lang)}</p>
            {isOwner && <p className="text-gray-400 text-sm mt-1">{t('dashboard.tapToAdd', lang)}</p>}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(p => <PropertyCard key={p.id} property={p} lang={lang} onTap={() => onOpenProperty(p)} />)}
          </div>
        )}
      </div>

      {isOwner && tab === 'active' && (
        <button onClick={() => setShowAdd(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-accent-500 rounded-full shadow-xl flex items-center justify-center text-white text-2xl active:scale-95 transition-all z-30">+</button>
      )}
      {showAdd && <AddPropertyModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); loadProperties() }} />}
    </div>
  )
}
