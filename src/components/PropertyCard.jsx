import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { t } from '../lib/i18n'

export default function PropertyCard({ property, lang, onTap }) {
  const [openCount, setOpenCount] = useState(0)
  const [fallbackPhoto, setFallbackPhoto] = useState(null)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    setImageFailed(false)
    supabase.from('tasks').select('id', { count: 'exact', head: true })
      .eq('property_id', property.id).neq('status', 'completed')
      .then(({ count }) => setOpenCount(count || 0))

    // If an older property cover image is broken/missing, use the newest task/completion photo as a fallback.
    supabase.from('tasks')
      .select('photo_url, completion_photo_url, created_at, completed_at')
      .eq('property_id', property.id)
      .or('photo_url.not.is.null,completion_photo_url.not.is.null')
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => {
        const found = (data || []).find(r => r.photo_url || r.completion_photo_url)
        setFallbackPhoto(found?.photo_url || found?.completion_photo_url || null)
      })
  }, [property.id, property.cover_photo_url])

  const isCompleted = property.status === 'completed'
  const imageUrl = !imageFailed && property.cover_photo_url ? property.cover_photo_url : fallbackPhoto

  return (
    <button onClick={onTap} className="card overflow-hidden text-left active:scale-95 transition-all duration-150 w-full">
      <div className="h-28 bg-gray-100 relative flex items-center justify-center">
        {imageUrl
          ? <img src={imageUrl} onError={() => setImageFailed(true)} className="w-full h-full object-contain" alt={property.name} />
          : <div className="w-full h-full flex items-center justify-center text-4xl bg-brand-50">🏠</div>
        }
        {isCompleted && (
          <div className="absolute inset-0 bg-green-600/60 flex items-center justify-center">
            <span className="text-white font-bold text-xs bg-green-700 px-2 py-1 rounded-full">{t('property.doneLabel', lang)}</span>
          </div>
        )}
        {!isCompleted && openCount > 0 && (
          <div className="absolute top-2 right-2 bg-accent-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{openCount}</div>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-gray-800 text-sm truncate">{property.name}</p>
        <p className="text-gray-400 text-xs truncate mt-0.5">{property.street}</p>
      </div>
    </button>
  )
}
