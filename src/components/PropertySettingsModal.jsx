import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { t } from '../lib/i18n'
import { prepareImageFile, uploadPreparedImage } from '../lib/images'
import Modal from './Modal'

export default function PropertySettingsModal({ property, lang, onClose, onUpdated }) {
  const [name, setName] = useState(property.name || '')
  const [street, setStreet] = useState(property.street || '')
  const [city, setCity] = useState(property.city || '')
  const [state, setState] = useState(property.state || '')
  const [zip, setZip] = useState(property.zip || '')
  const [lat, setLat] = useState(property.lat || null)
  const [lng, setLng] = useState(property.lng || null)
  const [searchText, setSearchText] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const searchTimer = useRef(null)
  const [photo, setPhoto] = useState(null)
  const [photoError, setPhotoError] = useState('')
  const [allContractors, setAllContractors] = useState([])
  const [assigned, setAssigned] = useState([])
  const [saving, setSaving] = useState(false)
  const cameraInput = useRef(null)
  const galleryInput = useRef(null)

  useEffect(() => {
    supabase.from('profiles').select('id,name,photo_url').eq('role','contractor').then(({ data }) => setAllContractors(data || []))
    supabase.from('property_contractors').select('contractor_id').eq('property_id', property.id)
      .then(({ data }) => setAssigned((data||[]).map(r=>r.contractor_id)))
  }, [property.id])

  function toggle(id) { setAssigned(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]) }

  const stateMap = {'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA','Colorado':'CO','Connecticut':'CT','Delaware':'DE','Florida':'FL','Georgia':'GA','Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA','Kansas':'KS','Kentucky':'KY','Louisiana':'LA','Maine':'ME','Maryland':'MD','Massachusetts':'MA','Michigan':'MI','Minnesota':'MN','Mississippi':'MS','Missouri':'MO','Montana':'MT','Nebraska':'NE','Nevada':'NV','New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND','Ohio':'OH','Oklahoma':'OK','Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT','Virginia':'VA','Washington':'WA','West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY'}

  function abbreviateDirection(str) {
    return str
      .replace(/North/g,'N').replace(/South/g,'S')
      .replace(/East/g,'E').replace(/West/g,'W')
      .replace(/Street/g,'St').replace(/Avenue/g,'Ave')
      .replace(/Boulevard/g,'Blvd').replace(/Drive/g,'Dr')
      .replace(/Lane/g,'Ln').replace(/Road/g,'Rd')
      .replace(/Court/g,'Ct').replace(/Place/g,'Pl')
  }

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
    const road = abbreviateDirection(addr.road || addr.pedestrian || '')
    const newStreet = `${houseNumber} ${road}`.trim()
    setStreet(newStreet)
    setCity(addr.city || addr.town || addr.village || addr.county || '')
    setState(stateMap[addr.state] || addr.state_code || '')
    setZip(addr.postcode || '')
    setLat(parseFloat(s.lat))
    setLng(parseFloat(s.lon))
    setSearchText('')
    setSuggestions([])
    if (!name || name === property.street) setName(newStreet)
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
    setSaving(true)
    try {
      const updates = { name, street, city, state, zip, lat: lat || null, lng: lng || null }
      if (photo) {
        updates.cover_photo_url = await uploadPreparedImage(supabase, 'fieldsnap-uploads', `properties/${property.id}`, photo)
      }
      const { error } = await supabase.from('properties').update(updates).eq('id', property.id)
      if (error) throw error
      await supabase.from('property_contractors').delete().eq('property_id', property.id)
      if (assigned.length > 0) {
        const { error: assignError } = await supabase.from('property_contractors').insert(assigned.map(cid => ({ property_id: property.id, contractor_id: cid })))
        if (assignError) throw assignError
      }
      onUpdated()
    } catch (err) {
      alert(err.message || 'Could not save property settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose} title={t('property.settings', lang)}>
      <div className="space-y-4">
        <input className="input" placeholder="Property name" value={name} onChange={e=>setName(e.target.value)} />
        <div className="relative">
          <input className="input" placeholder={lang === 'es' ? 'Buscar dirección...' : 'Search address...'}
            value={searchText} onChange={handleSearchChange} autoComplete="off" />
          {suggestions.length > 0 && (
            <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
              {suggestions.map((s, i) => {
                const a = s.address
                const hn = a.house_number || ''
                const rd = a.road || a.pedestrian || ''
                const c = a.city || a.town || a.village || ''
                const st = stateMap[a.state] || a.state_code || ''
                const z = a.postcode || ''
                const label = `${hn} ${rd}`.trim() + (c ? `, ${c}` : '') + (st ? `, ${st}` : '') + (z ? ` ${z}` : '')
                return (
                  <button key={i} onClick={() => selectSuggestion(s)}
                    className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                    {label}
                  </button>
                )
              })}
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Property photo</label>
          {photo ? (
            <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
              <img src={photo.previewUrl} className="w-full h-44 object-contain" alt="Property preview" />
              <button type="button" onClick={() => setPhoto(null)} className="absolute top-2 right-2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">Remove</button>
            </div>
          ) : property.cover_photo_url ? (
            <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
              <img src={property.cover_photo_url} className="w-full h-44 object-contain" alt="Current property" />
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button type="button" onClick={() => cameraInput.current?.click()} className="h-14 border-2 border-dashed border-brand-300 rounded-xl text-brand-600 text-sm font-medium">📷 Take Photo</button>
            <button type="button" onClick={() => galleryInput.current?.click()} className="h-14 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 text-sm font-medium">🖼️ Choose Photo</button>
          </div>
          {photoError && <p className="text-sm text-red-600 mt-2">{photoError}</p>}
          <input ref={cameraInput} type="file" accept="image/*,.heic,.heif" capture="environment" className="hidden" onChange={handlePhotoSelect} />
          <input ref={galleryInput} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handlePhotoSelect} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('property.assignedContractors', lang)}</label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {allContractors.map(c => (
              <label key={c.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={assigned.includes(c.id)} onChange={() => toggle(c.id)} className="w-4 h-4 accent-brand-700" />
                {c.photo_url
                  ? <img src={c.photo_url} className="w-7 h-7 rounded-full object-contain" alt="" />
                  : <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-xs">{c.name?.[0]}</div>
                }
                <span className="text-sm text-gray-700">{c.name}</span>
              </label>
            ))}
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
          {saving ? t('action.saving', lang) : t('property.saveChanges', lang)}
        </button>
      </div>
    </Modal>
  )
}
