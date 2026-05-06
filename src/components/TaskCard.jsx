import { useApp } from '../context/AppContext'
import { isPast, isToday, parseISO } from 'date-fns'
import { t, formatShortDate } from '../lib/i18n'

function shortName(fullName) {
  if (!fullName) return ''
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return parts[0]
  return parts[0] + ' ' + parts[parts.length-1][0] + '.'
}

export default function TaskCard({ task, lang: langProp, onTap }) {
  const { lang: langCtx } = useApp()
  const lang = langCtx || langProp
  const isOverdue   = task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date)) && task.status !== 'completed'
  const isDueToday  = task.due_date && isToday(parseISO(task.due_date))
  const titlePrimary   = lang === 'es' ? (task.title_es || task.title_en) : (task.title_en || task.title_es)
  const titleSecondary = lang === 'es' ? task.title_en : task.title_es
  const isCompleted = task.status === 'completed'
  const hasBoth     = isCompleted && task.photo_url && task.completion_photo_url

  return (
    <button onClick={onTap}
      className={`card p-4 text-left w-full active:scale-[0.98] transition-all border-l-4 ${
        isCompleted  ? 'border-l-green-400'
        : isOverdue  ? 'border-l-red-500'
        : isDueToday ? 'border-l-accent-500'
        : 'border-l-brand-400'
      }`}>

      {/* Status badge */}
      <div className="flex items-center gap-2 mb-2">
        {isCompleted
          ? <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">✓ {t('task.done', lang)}</span>
          : isOverdue
            ? <span className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-full">⚠ {t('task.overdue', lang)}</span>
            : isDueToday
              ? <span className="text-xs text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded-full">📅 {t('task.dueToday', lang)}</span>
              : null
        }
      </div>

      {/* Title */}
      <div className="font-semibold text-gray-800 text-sm mb-3">
        <p className="line-clamp-2">{titlePrimary || t('task.noDescription', lang)}</p>
        {titleSecondary && (
          <p className="text-xs text-gray-400 mt-0.5">{titleSecondary}</p>
        )}
      </div>

      {/* Before / After photos — natural height, no cropping */}
      {hasBoth && (
        <div className="flex gap-2 mb-2">
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-400 mb-1">{lang === 'es' ? 'Antes' : 'Before'}</p>
            <img src={task.photo_url}
              className="w-full rounded-xl"
              style={{ maxHeight: '200px', objectFit: 'contain', background: '#f3f4f6' }}
              alt="before" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-green-500 mb-1">{lang === 'es' ? 'Después' : 'After'}</p>
            <img src={task.completion_photo_url}
              className="w-full rounded-xl"
              style={{ maxHeight: '200px', objectFit: 'contain', background: '#f3f4f6' }}
              alt="after" />
          </div>
        </div>
      )}

      {/* Single task photo */}
      {!hasBoth && task.photo_url && (
        <img src={task.photo_url}
          className="w-full rounded-xl mb-2"
          style={{ maxHeight: '260px', objectFit: 'contain', background: '#f3f4f6' }}
          alt="task" />
      )}

      {/* Single completion photo */}
      {!hasBoth && !task.photo_url && task.completion_photo_url && isCompleted && (
        <img src={task.completion_photo_url}
          className="w-full rounded-xl mb-2"
          style={{ maxHeight: '260px', objectFit: 'contain', background: '#f3f4f6' }}
          alt="completion" />
      )}

      {/* Creator and date */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          {task.creator?.name && <span className="text-xs text-gray-400">{shortName(task.creator.name)}</span>}
          {task.due_date && (
            <span className={`text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
              {formatShortDate(task.due_date, lang)}
            </span>
          )}
        </div>
        <span className="text-gray-300 text-sm">›</span>
      </div>
    </button>
  )
}
