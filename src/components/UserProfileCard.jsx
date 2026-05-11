import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function UserProfileCard({ userId, user, lang, onClose }) {
  const [profile, setProfile] = useState(user || null)

  useEffect(() => {
    if (!user && userId) {
      supabase.from('profiles').select('*').eq('id', userId).single()
        .then(({ data }) => { if (data) setProfile(data) })
    }
  }, [userId])

  if (!profile) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{background:'rgba(0,0,0,0.5)'}}
      onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-10"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-1 pb-4">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center gap-4 mb-6">
          {profile.photo_url
            ? <img src={profile.photo_url} className="w-20 h-20 rounded-full object-cover" alt="" />
            : <div className="w-20 h-20 bg-brand-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">{profile.name?.[0]}</div>
          }
          <div>
            <p className="font-bold text-gray-800 text-xl">{profile.name}</p>
            <p className="text-sm text-gray-400 capitalize">{profile.role}</p>
          </div>
        </div>

        <div className="space-y-3">
          {profile.phone && (
            <div className="flex gap-3">
              <a href={`tel:${profile.phone}`}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white font-semibold py-3 rounded-2xl active:scale-95">
                📞 {lang === 'es' ? 'Llamar' : 'Call'}
              </a>
              <a href={`sms:${profile.phone}`}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white font-semibold py-3 rounded-2xl active:scale-95">
                💬 {lang === 'es' ? 'Mensaje' : 'Text'}
              </a>
            </div>
          )}
          {profile.email && (
            <a href={`mailto:${profile.email}`}
              className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-semibold py-3 rounded-2xl active:scale-95 w-full">
              ✉️ {profile.email}
            </a>
          )}
          {!profile.phone && !profile.email && (
            <p className="text-center text-gray-400 text-sm py-4">
              {lang === 'es' ? 'No hay información de contacto' : 'No contact info available'}
            </p>
          )}
        </div>

        <button onClick={onClose}
          className="w-full mt-4 py-3 text-gray-400 font-medium active:scale-95">
          {lang === 'es' ? 'Cerrar' : 'Close'}
        </button>
      </div>
    </div>
  )
}
