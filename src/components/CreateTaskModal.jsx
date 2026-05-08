import { useState, useRef, useEffect } from 'react'
import heic2any from 'heic2any'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { getBilingualText } from '../lib/translate'
import { sendPushNotification } from '../lib/push'
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
  const [showPhotoChoice, setShowPhotoChoice] = useState(false)
  const [showPhotoWarning, setShowPhotoWarning] = useState(false)
  const [assignedTo, setAssignedTo] = useState('')
  const [contractors, setContractors] = useState([])
  useEffect(() => { loadContractors() }, [])

  async function loadContractors() {
    const { data: propData } = await supabase.from('properties')
      .select('owner_id, profiles!properties_owner_id_fkey(id, name)')
      .eq('id', propertyId).single()
    const { data: contractorData } = await supabase.from('property_contractors')
      .select('contractor_id, profiles(id, name)')
      .eq('property_id', propertyId)
    const all = (contractorData || []).map(r => r.profiles).filter(Boolean)
    if (propData?.profiles && !all.find(p => p.id === propData.profiles.id)) {
      all.unshift(propData.profiles)
    }
    setContractors(all)
  }

  const cameraInput = useRef(null)
  const galleryInput = useRef(null)

  async function processFile(file, callback) {
    console.log("File type:", file.type, "File name:", file.name, "File size:", file.size)
    try {
      // Convert HEIC/HEIF to JPEG first using browser native support
      let processableFile = file
      const isHeic = file.type === 'image/heic' || file.type === 'image/heif' ||
          file.name?.toLowerCase().endsWith('.heic') || file.name?.toLowerCase().endsWith('.heif')
      if (isHeic) {
        try {
          const bitmap = await createImageBitmap(file)
          const canvas = document.createElement('canvas')
          canvas.width = Math.min(bitmap.width, 1600)
          canvas.height = Math.round(bitmap.height * (canvas.width / bitmap.width))
          const ctx = canvas.getContext('2d')
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
          bitmap.close()
          const jpegBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85))
          processableFile = new File([jpegBlob], 'converted.jpg', { type: 'image/jpeg' })
        } catch(e) { console.error('HEIC conversion failed:', e) }
      }
      const url = URL.createObjectURL(processableFile)
      const img = new Image()
      img.onload = () => {
        const MAX = 1600
        let w = img.naturalWidth, h = img.naturalHeight
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        canvas.toBlob(blob => {
          if (blob) callback(blob, URL.createObjectURL(blob))
          URL.revokeObjectURL(url)
        }, 'image/jpeg', 0.85)
      }
      img.onerror = () => { URL.revokeObjectURL(url); callback(processableFile, URL.createObjectURL(processableFile)) }
      img.src = url
    } catch(err) {
      console.error('processFile error:', err)
      callback(file, URL.createObjectURL(file))
    }
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
        assigned_to: assignedTo || null,
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

      // Notify contractors of new task
      const { data: cons } = await supabase.from('property_contractors').select('contractor_id').eq('property_id', propertyId)
      for (const c of (cons||[])) {
        await sendPushNotification(c.contractor_id, 'New Task', 'A new task has been added to your property', '/').catch(console.error)
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
            <div
              onClick={() => setShowPhotoChoice(true)}
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('bg-brand-50') }}
              onDragLeave={e => e.currentTarget.classList.remove('bg-brand-50')}
              onDrop={e => {
                e.preventDefault()
                e.currentTarget.classList.remove('bg-brand-50')
                const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
                if (!files.length) return
                const remaining = 5 - photos.length
                files.slice(0, remaining).forEach(file => {
                  processFile(file, (blob, preview) => {
                    setPhotos(prev => prev.length < 5 ? [...prev, { file: blob, preview }] : prev)
                  })
                })
              }}
              className="w-full h-16 border-2 border-dashed border-brand-300 rounded-xl flex items-center justify-center gap-2 text-brand-600 active:scale-95 cursor-pointer transition-colors">
              <span className="text-xl">📷</span>
              <span className="text-sm font-medium">{lang === 'es' ? 'Agregar foto o arrastra aquí' : 'Add Photo or drag here'}</span>
            </div>
          )}
          <input ref={cameraInput} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
          <input ref={galleryInput} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />

          {showPhotoChoice && (
            <div className="fixed inset-0 z-50 flex items-end" style={{background:'rgba(0,0,0,0.5)'}} onClick={() => setShowPhotoChoice(false)}>
              <div className="w-full bg-white rounded-t-3xl p-6 space-y-3" onClick={e => e.stopPropagation()}>
                <p className="text-center font-semibold text-gray-700 mb-2">{lang === 'es' ? 'Agregar foto' : 'Add Photo'}</p>
                <button onClick={() => { setShowPhotoChoice(false); cameraInput.current?.click() }}
                  className="w-full btn-primary flex items-center justify-center gap-2">
                  <span>📷</span> {lang === 'es' ? 'Tomar foto' : 'Take Photo'}
                </button>
                <button onClick={() => {
                  setShowPhotoChoice(false)
                  const skip = localStorage.getItem('skipPhotoWarning')
                  if (skip) { galleryInput.current?.click(); return }
                  setShowPhotoWarning(true)
                }}
                  className="w-full btn-secondary flex items-center justify-center gap-2">
                  <span>🖼️</span> {lang === 'es' ? 'Elegir de galería' : 'Choose from Gallery'}
                </button>
                <button onClick={() => setShowPhotoChoice(false)}
                  className="w-full text-gray-400 text-sm py-2">{lang === 'es' ? 'Cancelar' : 'Cancel'}</button>
              </div>
            </div>
          )}

          {showPhotoWarning && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{background:'rgba(0,0,0,0.5)'}}>
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
                <p className="font-semibold text-gray-800 mb-2">{lang === 'es' ? 'Límite de fotos' : 'Photo Limit'}</p>
                <p className="text-gray-600 text-sm mb-5">
                  {lang === 'es'
                    ? `Puedes seleccionar hasta ${5 - photos.length} foto(s) más (máximo 5 en total).`
                    : `You can select up to ${5 - photos.length} more photo(s) (5 max total).`}
                </p>
                <button onClick={() => {
                  setShowPhotoWarning(false)
                  galleryInput.current?.click()
                }} className="w-full btn-primary mb-2">
                  {lang === 'es' ? 'Okay' : 'Okay'}
                </button>
                <button onClick={() => {
                  localStorage.setItem('skipPhotoWarning', '1')
                  setShowPhotoWarning(false)
                  galleryInput.current?.click()
                }} className="w-full text-gray-400 text-sm py-2">
                  {lang === 'es' ? 'No mostrar de nuevo' : 'Do not show again'}
                </button>
              </div>
            </div>
          )}
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

        {contractors.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{lang === 'es' ? 'Asignar a' : 'Assign to'}</label>
            <select className="input h-11" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
              <option value="">{lang === 'es' ? 'Sin asignar' : 'Unassigned'}</option>
              {contractors.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <button onClick={handleSave} className="btn-primary w-full" disabled={saving}>
          {saving ? t('action.saving', lang) : t('createTask.save', lang)}
        </button>
      </div>
    </Modal>
  )
}
