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
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [showAnnotate, setShowAnnotate] = useState(false)
  const [annotatedBlob, setAnnotatedBlob] = useState(null)
  const [saving, setSaving]     = useState(false)
  const cameraInput = useRef(null)
  const galleryInput = useRef(null)

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoFile(file)
    setAnnotatedBlob(null)

    // Convert to JPEG via canvas so HEIC and other formats work
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
        if (blob) {
          setPhotoFile(blob)
          setPhotoPreview(URL.createObjectURL(blob))
        }
        URL.revokeObjectURL(url)
      }, 'image/jpeg', 0.85)
    }
    img.onerror = () => {
      // Fallback — show directly
      setPhotoPreview(url)
    }
    img.src = url
  }

  async function handleSave() {
    if (!description && !photoPreview) {
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

      let photoUrl = null
      const uploadBlob = annotatedBlob || photoFile
      if (uploadBlob) {
        const path = `tasks/${propertyId}/${Date.now()}.jpg`
        const { error: upErr } = await supabase.storage
          .from('fieldsnap-uploads')
          .upload(path, uploadBlob, { contentType: 'image/jpeg', upsert: true })
        if (upErr) throw upErr
        const { data } = supabase.storage.from('fieldsnap-uploads').getPublicUrl(path)
        photoUrl = data.publicUrl
      }

      const { error } = await supabase.from('tasks').insert({
        property_id: propertyId,
        created_by: profile.id,
        title_en: titleEn,
        title_es: titleEs,
        photo_url: photoUrl,
        due_date: dueDate || null,
        status: 'open'
      })
      if (error) throw error
      onCreated()
    } catch (err) {
      alert(err.message)
    }
    setSaving(false)
  }

  if (showAnnotate && photoPreview) {
    return (
      <AnnotationCanvas
        imageUrl={photoPreview}
        onDone={blob => { setAnnotatedBlob(blob); setPhotoPreview(URL.createObjectURL(blob)); setShowAnnotate(false) }}
        onCancel={() => setShowAnnotate(false)}
        lang={lang}
      />
    )
  }

  return (
    <Modal onClose={onClose} title={t('createTask.title', lang)}>
      <div className="space-y-4">
        {/* Photo area */}
        <div>
          {photoPreview ? (
            <div>
              <img src={photoPreview} className="w-full h-48 object-contain rounded-xl mb-2" alt="preview" />
              <div className="flex gap-2">
                <button onClick={() => setShowAnnotate(true)} className="flex-1 btn-secondary text-sm py-2">
                  ✏️ {t('createTask.annotate', lang)}
                </button>
                <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); setAnnotatedBlob(null) }}
                  className="flex-1 btn-secondary text-sm py-2 text-red-500">
                  {t('createTask.removePhoto', lang)}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => cameraInput.current?.click()}
                className="flex-1 h-20 border-2 border-dashed border-brand-300 rounded-xl flex flex-col items-center justify-center gap-1 text-brand-600 active:scale-95">
                <span className="text-2xl">📷</span>
                <span className="text-xs font-medium">{t('createTask.camera', lang)}</span>
              </button>
              <button onClick={() => galleryInput.current?.click()}
                className="flex-1 h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-500 active:scale-95">
                <span className="text-2xl">🖼️</span>
                <span className="text-xs font-medium">{t('createTask.gallery', lang)}</span>
              </button>
            </div>
          )}
          <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelect} />
          <input ref={galleryInput} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
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
