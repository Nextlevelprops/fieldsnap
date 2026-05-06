import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { getBilingualText } from '../lib/translate'
import { t } from '../lib/i18n'
import Modal from './Modal'
import AnnotationCanvas from './AnnotationCanvas'

export default function CreateTaskModal({ propertyId, lang, onClose, onCreated }) {
  const { profile } = useApp()
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate]   = useState('')
  const [photos, setPhotos] = useState([]) // [{file, preview}]
  const [showAnnotate, setShowAnnotate] = useState(false)
  const [annotateIndex, setAnnotateIndex] = useState(null)
  const [saving, setSaving]     = useState(false)
  const cameraInput = useRef(null)
  const galleryInput = useRef(null)

  function processFile(file, callback) {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const MAX = 1600
      let w = img.naturalWidth, h = img.naturalHeight
      if (w > MAX) { h = Math.round(h * MAX / w); w = MAX }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => {
        if (blob) callback(blob, URL.createObjectURL(blob))
        URL.revokeObjectURL(url)
      }, 'image/jpeg', 0.85)
    }
    img.onerror = () => callback(file, url)
    img.src = url
  }

  function handlePhotoSelect(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    const remaining = 5 - photos.length
    if (files.length > remaining) {
      alert(lang === 'es' ? `Solo puedes agregar ${remaining} foto(s) más (máximo 5)` : `You can only add ${remaining} more photo(s) (max 5)`)
    }
    const toAdd = files.slice(0, remaining)
    toAdd.forEach(file => {
      processFile(file, (blob, preview) => {
        setPhotos(prev => prev.length < 5 ? [...prev, { file: blob, preview }] : prev)
      })
    })
  }

  function removePhoto(index) {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!description && photos.length === 0) {
      alert(t('createTask.needPhotoOrDesc', lang))
      return
    }
    setSaving(true)
    try {
      let titleEn = '', titleEs = ''
      if (description) {
        const bi = await getBilingualText(description)
        titleEn = bi.en; titleEs = bi.es
      }

      // Upload first photo as main photo_url, rest go to task_photos
      let photoUrl = null
      if (photos.length > 0) {
        const path = `tasks/${propertyId}/${Date.now()}.jpg`
        const { error: upErr } = await supabase.storage
          .from('fieldsnap-uploads')
          .upload(path, photos[0].file, { contentType: 'image/jpeg', upsert: true })
        if (upErr) throw upErr
        const { data } = supabase.storage.from('fieldsnap-uploads').getPublicUrl(path)
        photoUrl = data.publicUrl
      }

      const { data: task, error } = await supabase.from('tasks').insert({
        property_id: propertyId,
        created_by: profile.id,
        title_en: titleEn,
        title_es: titleEs,
        photo_url: photoUrl,
        due_date: dueDate || null,
        status: 'open'
      }).select().single()
      if (error) throw error

      // Upload additional photos to task_photos
      if (task && photos.length > 1) {
        for (let i = 1; i < photos.length; i++) {
          const path = `tasks/${task.id}/before_${Date.now()}_${i}.jpg`
          const { error: upErr } = await supabase.storage
            .from('fieldsnap-uploads')
            .upload(path, photos[i].file, { contentType: 'image/jpeg', upsert: true })
          if (!upErr) {
            const { data } = supabase.storage.from('fieldsnap-uploads').getPublicUrl(path)
            await supabase.from('task_photos').insert({ task_id: task.id, photo_url: data.publicUrl, type: 'before' })
          }
        }
      }

      onCreated()
    } catch (err) {
      alert(err.message)
    }
    setSaving(false)
  }



  return (
    <Modal onClose={onClose} title={t('createTask.title', lang)}>
      <div className="space-y-4">
        {/* Photo area */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">{lang === 'es' ? `Fotos Antes (${photos.length}/5)` : `Before Photos (${photos.length}/5)`}</p>
          {photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
              {photos.map((p, i) => (
                <div key={i} className="relative flex-shrink-0">
                  <img src={p.preview} className="h-24 w-24 object-cover rounded-xl" alt="preview" />
                  <div className="absolute top-1 left-1 bg-black bg-opacity-60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">{i+1}</div>
                  <button onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✕</button>
                </div>
              ))}
            </div>
          )}
          {photos.length > 0 && (
            <p className="text-center text-xs text-gray-400 mb-2">{photos.length}/5 {lang === 'es' ? 'fotos seleccionadas' : 'photos selected'}</p>
          )}
          {photos.length < 5 && (
            <div className="flex gap-2">
              <button onClick={() => cameraInput.current?.click()}
                className="flex-1 h-16 border-2 border-dashed border-brand-300 rounded-xl flex flex-col items-center justify-center gap-1 text-brand-600 active:scale-95">
                <span className="text-xl">📷</span>
                <span className="text-xs font-medium">{t('createTask.camera', lang)}</span>
              </button>
              <button onClick={() => galleryInput.current?.click()}
                className="flex-1 h-16 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-500 active:scale-95">
                <span className="text-xl">🖼️</span>
                <span className="text-xs font-medium">{t('createTask.gallery', lang)}</span>
              </button>
            </div>
          )}
          <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelect} />
          <input ref={galleryInput} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
        </div>

        <textarea
          className="input resize-none h-24"
          placeholder={t('createTask.description', lang)}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        {description && (
          <p className="text-xs text-gray-400 italic">{t('createTask.translateHint', lang)}</p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">{t('createTask.dueDate', lang)}</label>
          <input type="date" className="input" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>

        <button onClick={handleSave} className="btn-primary w-full" disabled={saving}>
          {saving ? t('action.saving', lang) : t('createTask.save', lang)}
        </button>
      </div>
    </Modal>
  )
}
