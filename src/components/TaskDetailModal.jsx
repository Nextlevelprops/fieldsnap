import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { getBilingualText, getTextPairForLang } from '../lib/translate'
import { t, formatDateTime, formatShortDate } from '../lib/i18n'
import AnnotationCanvas from './AnnotationCanvas'

export default function TaskDetailModal({ task, lang, propertyId, onClose, onRefresh }) {
  const { profile } = useApp()
  const [comments, setComments]     = useState([])
  const [commentText, setCommentText] = useState('')
  const [mentionSuggestions, setMentionSuggestions] = useState([])
  const [contractors, setContractors] = useState([])
  const [showComplete, setShowComplete] = useState(false)
  const [compPhoto, setCompPhoto]   = useState(null)
  const [compPreview, setCompPreview] = useState(null)
  const [showAnnotate, setShowAnnotate] = useState(false)
  const [annotatedBlob, setAnnotatedBlob] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [completing, setCompleting] = useState(false)
  const [beforePhotos, setBeforePhotos] = useState([])
  const [afterPhotos, setAfterPhotos]   = useState([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const commentInput = useRef(null)
  const fileInput    = useRef(null)
  const beforeInput  = useRef(null)
  const beforeGallery = useRef(null)
  const afterInput   = useRef(null)
  const afterGallery  = useRef(null)

  const isCompleted = task.status === 'completed'
  const title     = lang==='es' ? (task.title_es||task.title_en) : (task.title_en||task.title_es)
  const titleOther = lang==='es' ? task.title_en : task.title_es

  useEffect(() => {
    loadComments(); loadContractors(); loadTaskPhotos()
    const ch = supabase.channel(`task-${task.id}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'comments', filter:`task_id=eq.${task.id}` }, () => loadComments())
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [task.id])

  async function loadTaskPhotos() {
    const { data } = await supabase.from('task_photos').select('*').eq('task_id', task.id).order('created_at', { ascending: true })
    setBeforePhotos((data||[]).filter(p => p.type === 'before'))
    setAfterPhotos((data||[]).filter(p => p.type === 'after'))
  }

  async function handleAddPhoto(e, type) {
    const file = e.target.files?.[0]; if (!file) return
    const current = type === 'before' ? beforePhotos : afterPhotos
    if (current.length >= 5) { alert(lang === 'es' ? 'Máximo 5 fotos' : 'Maximum 5 photos'); return }
    setUploadingPhoto(true)
    try {
      const path = `tasks/${task.id}/${type}_${Date.now()}.jpg`
      const { error } = await supabase.storage.from('fieldsnap-uploads').upload(path, file, { contentType: file.type || 'image/jpeg', upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('fieldsnap-uploads').getPublicUrl(path)
      await supabase.from('task_photos').insert({ task_id: task.id, photo_url: urlData.publicUrl, type })
      loadTaskPhotos()
    } catch(err) { alert(err.message) }
    setUploadingPhoto(false)
  }

  async function loadComments() {
    const { data } = await supabase.from('comments')
      .select('*, author:profiles!comments_user_id_fkey(name,photo_url)')
      .eq('task_id', task.id).order('created_at', { ascending: true })
    setComments(data || [])
  }

  async function loadContractors() {
    const { data } = await supabase.from('property_contractors')
      .select('contractor_id, profiles(id,name)').eq('property_id', propertyId)
    setContractors((data||[]).map(r=>r.profiles).filter(Boolean))
  }

  function handleCommentChange(e) {
    const val = e.target.value; setCommentText(val)
    const atMatch = val.match(/@(\w*)$/)
    if (atMatch) {
      const q = atMatch[1].toLowerCase()
      setMentionSuggestions(contractors.filter(c => {
        const h = (c.name.split(' ')[0] + (c.name.split(' ').slice(-1)[0]?.[0]||'')).toLowerCase()
        return h.includes(q)
      }).slice(0,5))
    } else setMentionSuggestions([])
  }

  function insertMention(person) {
    const h = person.name.split(' ')[0] + (person.name.split(' ').slice(-1)[0]?.[0]||'')
    setCommentText(prev => prev.replace(/@\w*$/, `@${h} `))
    setMentionSuggestions([]); commentInput.current?.focus()
  }

  async function postComment() {
    if (!commentText.trim()) return; setSaving(true)
    const bi = await getBilingualText(commentText)
    const { data: comment } = await supabase.from('comments').insert({
      task_id: task.id, user_id: profile.id, body_en: bi.en, body_es: bi.es
    }).select().single()
    const handles = commentText.match(/@(\w+)/g) || []
    for (const h of handles) {
      const handle = h.slice(1).toLowerCase()
      const mentioned = contractors.find(c => {
        const ch = (c.name.split(' ')[0] + (c.name.split(' ').slice(-1)[0]?.[0]||'')).toLowerCase()
        return ch === handle
      })
      if (mentioned && mentioned.id !== profile.id) {
        await supabase.from('notifications').insert({ user_id: mentioned.id, type:'mention', task_id: task.id, comment_id: comment?.id, read: false })
      }
    }
    setCommentText(''); setSaving(false)
  }

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0]; if (!file) return
    setCompPhoto(file); setAnnotatedBlob(null)
    const reader = new FileReader()
    reader.onload = ev => setCompPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function handleComplete() {
    if (!compPreview) { alert(t('taskDetail.proofRequired', lang)); return }
    setCompleting(true)
    try {
      const uploadBlob = annotatedBlob || compPhoto
      const path = `completions/${task.id}/${Date.now()}.jpg`
      await supabase.storage.from('fieldsnap-uploads').upload(path, uploadBlob, { contentType:'image/jpeg' })
      const { data: urlData } = supabase.storage.from('fieldsnap-uploads').getPublicUrl(path)
      await supabase.from('tasks').update({ status:'completed', completed_by: profile.id, completed_at: new Date().toISOString(), completion_photo_url: urlData.publicUrl }).eq('id', task.id)
      onRefresh(); onClose()
    } catch (err) { alert(err.message) }
    setCompleting(false)
  }

  if (showAnnotate && compPreview) {
    return <AnnotationCanvas imageUrl={compPreview} onDone={blob=>{setAnnotatedBlob(blob);setShowAnnotate(false)}} onCancel={()=>setShowAnnotate(false)} lang={lang} />
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end" style={{background:"rgba(0,0,0,0.5)"}}>
      <div className="bg-white rounded-t-3xl max-h-[93vh] flex flex-col safe-bottom">
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
        <div className="overflow-y-auto flex-1 px-5 pb-4">

          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-4 pt-2">
            <h2 className="text-lg font-bold text-gray-800 flex-1">{title || t('task.noDescription', lang)}</h2>
            <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
          </div>

          {/* Translation */}
          {titleOther && titleOther !== title && (
            <div className="bg-gray-50 rounded-xl px-4 py-2 mb-4">
              <p className="text-xs text-gray-400 mb-0.5">{lang==='es' ? t('taskDetail.englishLabel','es') : t('taskDetail.spanishLabel','en')}</p>
              <p className="text-sm text-gray-600 italic">{titleOther}</p>
            </div>
          )}

          {/* Before photos */}
          {(task.photo_url || beforePhotos.length > 0) && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-400">{lang === 'es' ? 'Fotos Antes' : 'Before Photos'} ({beforePhotos.length > 0 ? beforePhotos.length : 1}/5)</p>
                {!isCompleted && (beforePhotos.length < 5) && (
                  <div className="flex gap-2">
                    <button onClick={() => beforeInput.current?.click()} disabled={uploadingPhoto}
                      className="text-xs text-brand-600 font-semibold">📷</button>
                    <button onClick={() => beforeGallery.current?.click()} disabled={uploadingPhoto}
                      className="text-xs text-brand-600 font-semibold">🖼️</button>
                  </div>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {task.photo_url && beforePhotos.length === 0 && (
                  <img src={task.photo_url} className="h-32 w-32 object-cover rounded-xl flex-shrink-0" alt="before" />
                )}
                {beforePhotos.map(p => (
                  <img key={p.id} src={p.photo_url} className="h-32 w-32 object-cover rounded-xl flex-shrink-0" alt="before" />
                ))}
              </div>
              <input ref={beforeInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleAddPhoto(e, 'before')} />
              <input ref={beforeGallery} type="file" accept="image/*" multiple className="hidden" onChange={e => handleAddPhoto(e, 'before')} />
            </div>
          )}
          {!isCompleted && beforePhotos.length === 0 && !task.photo_url && (
            <div className="mb-4">
              <div className="flex gap-2">
                <button onClick={() => beforeInput.current?.click()} disabled={uploadingPhoto}
                  className="flex-1 h-16 border-2 border-dashed border-brand-300 rounded-xl flex flex-col items-center justify-center gap-1 text-brand-600">
                  <span className="text-xl">📷</span>
                  <span className="text-xs">{lang === 'es' ? 'Cámara' : 'Camera'}</span>
                </button>
                <button onClick={() => beforeGallery.current?.click()} disabled={uploadingPhoto}
                  className="flex-1 h-16 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-500">
                  <span className="text-xl">🖼️</span>
                  <span className="text-xs">{lang === 'es' ? 'Galería' : 'Gallery'}</span>
                </button>
              </div>
              <input ref={beforeInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleAddPhoto(e, 'before')} />
              <input ref={beforeGallery} type="file" accept="image/*" multiple className="hidden" onChange={e => handleAddPhoto(e, 'before')} />
            </div>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
            {task.creator?.name && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">{t('taskDetail.createdBy', lang)}</p>
                <p className="font-semibold text-gray-700">{task.creator.name}</p>
              </div>
            )}
            {task.due_date && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">{t('taskDetail.dueDate', lang)}</p>
                <p className="font-semibold text-gray-700">{formatShortDate(task.due_date, lang)}</p>
              </div>
            )}
            {task.completer?.name && (
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xs text-green-600">{t('taskDetail.completedBy', lang)}</p>
                <p className="font-semibold text-green-700">{task.completer.name}</p>
              </div>
            )}
            {task.completed_at && (
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xs text-green-600">{t('taskDetail.completedAt', lang)}</p>
                <p className="font-semibold text-green-700">{formatDateTime(task.completed_at, lang)}</p>
              </div>
            )}
          </div>

          {/* After photos */}
          {(task.completion_photo_url || afterPhotos.length > 0) && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-400">{lang === 'es' ? 'Fotos Después' : 'After Photos'} ({afterPhotos.length > 0 ? afterPhotos.length : 1}/5)</p>
                {isCompleted && afterPhotos.length < 5 && (
                  <div className="flex gap-2">
                    <button onClick={() => afterInput.current?.click()} disabled={uploadingPhoto}
                      className="text-xs text-brand-600 font-semibold">📷</button>
                    <button onClick={() => afterGallery.current?.click()} disabled={uploadingPhoto}
                      className="text-xs text-brand-600 font-semibold">🖼️</button>
                  </div>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {task.completion_photo_url && afterPhotos.length === 0 && (
                  <img src={task.completion_photo_url} className="h-32 w-32 object-cover rounded-xl flex-shrink-0" alt="after" />
                )}
                {afterPhotos.map(p => (
                  <img key={p.id} src={p.photo_url} className="h-32 w-32 object-cover rounded-xl flex-shrink-0" alt="after" />
                ))}
              </div>
              <input ref={afterInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleAddPhoto(e, 'after')} />
              <input ref={afterGallery} type="file" accept="image/*" multiple className="hidden" onChange={e => handleAddPhoto(e, 'after')} />
            </div>
          )}

          {/* Complete task */}
          {!isCompleted && (
            <div className="mb-5">
              {!showComplete ? (
                <button onClick={() => setShowComplete(true)} className="btn-primary w-full">{t('taskDetail.markComplete', lang)}</button>
              ) : (
                <div className="space-y-3 bg-green-50 rounded-2xl p-4">
                  <p className="font-semibold text-green-800 text-sm">{t('taskDetail.proofPhoto', lang)}</p>
                  {compPreview ? (
                    <div>
                      <img src={compPreview} className="w-full h-36 object-cover rounded-xl mb-2" alt="" />
                      <div className="flex gap-2">
                        <button onClick={() => setShowAnnotate(true)} className="flex-1 btn-secondary text-sm py-2">✏️ {t('createTask.annotate', lang)}</button>
                        <button onClick={() => { setCompPhoto(null); setCompPreview(null) }} className="flex-1 btn-secondary text-sm py-2 text-red-500">{t('createTask.removePhoto', lang)}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { fileInput.current.setAttribute('capture','environment'); fileInput.current.click() }}
                        className="flex-1 h-16 border-2 border-dashed border-green-400 rounded-xl text-green-700 text-sm active:scale-95">📷 {t('createTask.camera', lang)}</button>
                      <button onClick={() => { fileInput.current.removeAttribute('capture'); fileInput.current.click() }}
                        className="flex-1 h-16 border-2 border-dashed border-green-300 rounded-xl text-green-600 text-sm active:scale-95">🖼️ {t('createTask.gallery', lang)}</button>
                    </div>
                  )}
                  <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                  <div className="flex gap-2">
                    <button onClick={() => setShowComplete(false)} className="flex-1 btn-secondary text-sm">{t('taskDetail.cancel', lang)}</button>
                    <button onClick={handleComplete} className="flex-1 btn-primary text-sm" disabled={completing||!compPreview}>
                      {completing ? t('action.loading', lang) : t('taskDetail.confirm', lang)}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          <div>
            <h3 className="font-semibold text-gray-700 text-sm mb-3">{t('taskDetail.comments', lang)}</h3>
            <div className="space-y-3 mb-3">
              {comments.map(c => {
                const { primary: body, secondary: bodyOther } = getTextPairForLang(c.body_en, c.body_es, lang)
                return (
                  <div key={c.id} className="flex gap-2">
                    {c.author?.photo_url
                      ? <img src={c.author.photo_url} className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5" alt="" />
                      : <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-xs flex-shrink-0">{c.author?.name?.[0]}</div>
                    }
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-gray-700">{c.author?.name?.split(' ')[0]}</span>
                        <span className="text-xs text-gray-400">{formatDateTime(c.created_at, lang)}</span>
                      </div>
                      <div className="bg-gray-50 rounded-2xl rounded-tl-none px-3 py-2">
                        <p className="text-sm text-gray-800">{body}</p>
                        {bodyOther && bodyOther !== body && <p className="text-xs text-gray-400 italic mt-1">{bodyOther}</p>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Comment input */}
            <div className="relative">
              {mentionSuggestions.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mb-1 overflow-hidden z-10">
                  {mentionSuggestions.map(p => (
                    <button key={p.id} onClick={() => insertMention(p)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 font-medium">
                      @{p.name.split(' ')[0]}{p.name.split(' ').slice(-1)[0]?.[0]}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input ref={commentInput} className="input flex-1 text-sm"
                  placeholder={t('taskDetail.commentPlaceholder', lang)}
                  value={commentText} onChange={handleCommentChange}
                  onKeyDown={e => e.key==='Enter' && !e.shiftKey && postComment()} />
                <button onClick={postComment} disabled={saving||!commentText.trim()}
                  className="bg-brand-700 text-white px-4 rounded-xl font-semibold disabled:opacity-40 active:scale-95">→</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
