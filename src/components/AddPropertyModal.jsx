import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { t } from '../lib/i18n'
import { prepareImageFile, uploadPreparedImage } from '../lib/images'
import Modal from './Modal'

export default function AddPropertyModal({ onClose, onCreated }) {
  const { profile, lang } = useApp()
  const [name, setName]     = useState(() => sessionStorage.getItem('fieldsnap_add_name') || '')
  const [street, setStreet] = useState(() => sessionStorage.getItem('fieldsnap_add_street') || '')
  const [city, setCity]     = useState(() => sessionStorage.getItem('fieldsnap_add_city') || '')
  const [state, setState]   = useState(() => sessionStorage.getItem('fieldsnap_add_state') || '')
  const [zip, setZip]       = useState(() => sessionStorage.getItem('fieldsnap_add_zip') || '')
  const [lat, setLat]       = useState(null)
  const [lng, setLng]       = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [searchText, setSearchText] = useState('')
  const searchTimer = useRef(null)
  const [photo, setPhoto]   = useState(null)
  const [photoError, setPhotoError] = useState('')
  const [contractors, setContractors] = useState([])
  const [selected, setSelected] = useState([])
  const [saving, setSaving] = useState(false)
  const cameraInput = useRef(null)
  const galleryInput = useRef(null)

  useEffect(() => {
    supabase.from('profiles').select('id,name,photo_url').eq('role','contractor')
      .then(({ data }) => setContractors(data || []))
  }, [])

  useEffect(() => { sessionStorage.setItem('fieldsnap_add_name', name) }, [name])
  useEffect(() => { sessionStorage.setItem('fieldsnap_add_street', street) }, [street])
  useEffect(() => { sessionStorage.setItem('fieldsnap_add_city', city) }, [city])
  useEffect(() => { sessionStorage.setItem('fieldsnap_add_state', state) }, [state])
  useEffect(() => { sessionStorage.setItem('fieldsnap_add_zip', zip) }, [zip])

  function clearDraft() {
    ;['name','street','city','state','zip'].forEach(k => sessionStorage.removeItem(`fieldsnap_add_${k}`))
  }

  function toggle(id) { setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]) }

  async function searchAddress(text) {
    if (!text || text.length < 4) { setSuggestions([]); return }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&addressdetails=1&limit=5&countrycodes=us`)
      const data = await res.json()
      setSuggestions(data)
    } catch { setSuggestions([]) }
  }

  function handleSearchChange(e) {
    const val = e.target.value
    setSearchText(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => searchAddress(val), 400)
  }

  function selectSuggestion(s) {
    const addr = s.address
    const houseNumber = addr.house_number || ''
    const road = addr.road || addr.pedestrian || ''
    const newStreet = `${houseNumber} ${road}`.trim()
    setStreet(newStreet)
    setCity(addr.city || addr.town || addr.village || addr.county || '')
    setState(addr.state_code || addr.state || '')
    setZip(addr.postcode || '')
    setLat(parseFloat(s.lat))
    setLng(parseFloat(s.lon))
    setSearchText(newStreet)
    setSuggestions([])
    // Auto-set name from street if name is empty or was auto-set
    setName(prev => (!prev || prev === street) ? newStreet : prev)
  }

  async function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoError('')
    try {
      const prepared = await prepareImageFile(file, { maxWidth: 1600, quality: 0.82 })
      setPhoto(prepared)
    } catch (err) {
      setPhoto(null)
      setPhotoError(err.message || 'Could not load that photo.')
    }
  }

  async function handleSave() {
    if (!name || !street || !profile?.id) return
    setSaving(true)
    try {
      let coverUrl = null
      if (photo) {
        coverUrl = await uploadPreparedImage(supabase, 'fieldsnap-uploads', `properties/${profile.id}`, photo)
      }
      const { data: prop, error } = await supabase.from('properties').insert({
        name: name.trim(), street: street.trim(), city: city.trim(), state: state.trim(), zip: zip.trim(),
        cover_photo_url: coverUrl, owner_id: profile.id, status: 'active',
        lat: lat || null, lng: lng || null
      }).select().single()
      if (error) throw error
      if (selected.length > 0) {
        const { error: assignError } = await supabase.from('property_contractors').insert(selected.map(cid => ({ property_id: prop.id, contractor_id: cid })))
        if (assignError) throw assignError
      }
      clearDraft()
      onCreated()
    } catch (err) {
      alert(err.message || 'Could not save property.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose} title={t('property.new', lang)}>
      <div className="space-y-4">
        <input className="input" placeholder="Property name" value={name} onChange={e=>setName(e.target.value)} />
        <div className="relative">
          <input className="input" placeholder={lang === 'es' ? 'Buscar dirección...' : 'Search address...'}
            value={searchText} onChange={handleSearchChange} />
          {suggestions.length > 0 && (
            <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => selectSuggestion(s)}
                  className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                  {s.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className="input" placeholder={t('property.street', lang)} value={street} onChange={e=>setStreet(e.target.value)} />
          <input className="input" placeholder={t('property.city', lang)} value={city} onChange={e=>setCity(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input className="input" placeholder={t('property.state', lang)} value={state} onChange={e=>setState(e.target.value.toUpperCase())} maxLength={2} />
          <input className="input col-span-2" placeholder={t('property.zip', lang)} value={zip} onChange={e=>setZip(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Property photo <span className="text-gray-400">(optional)</span></label>
          {photo ? (
            <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
              <img src={photo.previewUrl} className="w-full h-44 object-contain" alt="Property preview" />
              <button type="button" onClick={() => setPhoto(null)} className="absolute top-2 right-2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">Remove</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => cameraInput.current?.click()} className="h-20 border-2 border-dashed border-brand-300 rounded-xl flex flex-col items-center justify-center gap-1 text-brand-600 active:scale-95">
                <span className="text-2xl">📷</span><span className="text-xs font-medium">Take Photo</span>
              </button>
              <button type="button" onClick={() => galleryInput.current?.click()} className="h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-500 active:scale-95">
                <span className="text-2xl">🖼️</span><span className="text-xs font-medium">Choose Photo</span>
              </button>
            </div>
          )}
          {photoError && <p className="text-sm text-red-600 mt-2">{photoError}</p>}
          <input ref={cameraInput} type="file" accept="image/*,.heic,.heif" capture="environment" className="hidden" onChange={handlePhotoSelect} />
          <input ref={galleryInput} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handlePhotoSelect} />
        </div>

        {contractors.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign contractors</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {contractors.map(c => (
                <label key={c.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} className="w-4 h-4 accent-brand-700" />
                  {c.photo_url
                    ? <img src={c.photo_url} className="w-7 h-7 rounded-full object-contain" alt="" />
                    : <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-xs">{c.name?.[0]}</div>
                  }
                  <span className="text-sm text-gray-700">{c.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        <button onClick={handleSave} className="btn-primary w-full" disabled={saving || !name.trim() || !street.trim()}>
          {saving ? t('action.saving', lang) : t('property.save', lang)}
        </button>
      </div>
    </Modal>
  )
}
