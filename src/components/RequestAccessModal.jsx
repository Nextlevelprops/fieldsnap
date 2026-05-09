import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

export default function RequestAccessModal({ onClose }) {
  const { profile, lang } = useApp()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState({})
  const [requested, setRequested] = useState({})

  useEffect(() => {
    loadAvailableProperties()
  }, [])

  async function loadAvailableProperties() {
    setLoading(true)
    // Get all active properties
    const { data: allProps } = await supabase
      .from('properties')
      .select('id, name, street, city, cover_photo_url')
      .eq('status', 'active')
      .order('street')

    // Get properties contractor already has access to
    const { data: myProps } = await supabase
      .from('property_contractors')
      .select('property_id')
      .eq('contractor_id', profile.id)

    // Get pending requests
    const { data: myRequests } = await supabase
      .from('access_requests')
      .select('property_id, status')
      .eq('contractor_id', profile.id)

    const myPropIds = new Set((myProps || []).map(p => p.property_id))
    const requestMap = {}
    ;(myRequests || []).forEach(r => { requestMap[r.property_id] = r.status })
    setRequested(requestMap)

    // Filter out properties already assigned to
    const available = (allProps || []).filter(p => !myPropIds.has(p.id))
    setProperties(available)
    setLoading(false)
  }

  async function requestAccess(property) {
    setRequesting(prev => ({ ...prev, [property.id]: true }))
    try {
      // Delete any existing denied request first
      await supabase.from('access_requests')
        .delete()
        .eq('contractor_id', profile.id)
        .eq('property_id', property.id)
        .eq('status', 'denied')
      // Insert new access request
      const { data: req } = await supabase.from('access_requests').upsert({
        contractor_id: profile.id,
        property_id: property.id,
        status: 'pending'
      }, { onConflict: 'contractor_id,property_id' }).select().single()

      // Get property owner
      const { data: prop } = await supabase.from('properties')
        .select('owner_id').eq('id', property.id).single()

      if (prop?.owner_id) {
        // Insert notification for owner
        await supabase.from('notifications').insert({
          user_id: prop.owner_id,
          type: 'access_request',
          property_id: property.id,
          request_id: req?.id,
          read: false
        })

        // Send push notification to owner
        const { data: { session } } = await supabase.auth.getSession()
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            user_id: prop.owner_id,
            title: lang === 'es' ? 'Solicitud de acceso' : 'Access Request',
            body: `${profile.name} ${lang === 'es' ? 'solicita acceso a' : 'is requesting access to'} ${property.street}`,
            url: '/'
          })
        }).catch(console.error)
      }

      setRequested(prev => ({ ...prev, [property.id]: 'pending' }))
    } catch(err) { alert(err.message) }
    setRequesting(prev => ({ ...prev, [property.id]: false }))
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50">
      <div className="bg-brand-700 safe-top px-4 py-4 flex items-center gap-3">
        <button onClick={onClose} className="text-white text-xl active:scale-95">←</button>
        <h2 className="text-lg font-bold text-white flex-1">
          {lang === 'es' ? 'Solicitar Acceso' : 'Request Access'}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24">
        {loading ? (
          <div className="flex justify-center pt-16">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏠</div>
            <p className="text-gray-400">{lang === 'es' ? 'No hay propiedades disponibles' : 'No properties available'}</p>
          </div>
        ) : properties.map(p => {
          const status = requested[p.id]
          return (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {p.cover_photo_url && (
                <img src={p.cover_photo_url} className="w-full h-32 object-cover" alt={p.name} />
              )}
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{p.name || p.street}</p>
                  <p className="text-sm text-gray-400 truncate">{p.street}</p>
                </div>
                {status === 'pending' ? (
                  <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-3 py-1.5 rounded-full flex-shrink-0">
                    {lang === 'es' ? 'Pendiente' : 'Pending'}
                  </span>
                ) : status === 'approved' ? (
                  <span className="text-xs bg-green-100 text-green-700 font-semibold px-3 py-1.5 rounded-full flex-shrink-0">
                    {lang === 'es' ? 'Aprobado' : 'Approved'}
                  </span>
                ) : status === 'denied' ? (
                  <button
                    onClick={() => requestAccess(p)}
                    disabled={requesting[p.id]}
                    className="text-xs bg-red-100 text-red-600 font-semibold px-3 py-1.5 rounded-full flex-shrink-0 active:scale-95">
                    {requesting[p.id]
                      ? (lang === 'es' ? 'Enviando...' : 'Sending...')
                      : (lang === 'es' ? '↺ Solicitar de nuevo' : '↺ Request again')}
                  </button>
                ) : (
                  <button
                    onClick={() => requestAccess(p)}
                    disabled={requesting[p.id]}
                    className="btn-primary text-xs px-3 py-1.5 flex-shrink-0">
                    {requesting[p.id]
                      ? (lang === 'es' ? 'Enviando...' : 'Sending...')
                      : (lang === 'es' ? 'Solicitar' : 'Request')}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
