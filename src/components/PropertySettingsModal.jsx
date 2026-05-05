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
      const updates = { name, street, city, state, zip }
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
        <input className="input" placeholder={t('property.street', lang)} value={street} onChange={e=>setStreet(e.target.value)} />
        <div className="grid grid-cols-3 gap-2">
          <input className="input" placeholder={t('property.city', lang)} value={city} onChange={e=>setCity(e.target.value)} />
          <input className="input" placeholder={t('property.state', lang)} value={state} onChange={e=>setState(e.target.value.toUpperCase())} maxLength={2} />
          <input className="input" placeholder={t('property.zip', lang)} value={zip} onChange={e=>setZip(e.target.value)} />
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
