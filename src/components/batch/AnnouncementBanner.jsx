import { useState, useEffect } from 'react'
import { Megaphone, Pin, X, ChevronDown, ChevronUp } from 'lucide-react'
import { subscribeToAnnouncements } from '../../firebase/firestore.batches'

// Converts plain text with URLs into text + clickable <a> tags
function LinkifiedText({ text }) {
  if (!text) return null
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts    = text.split(urlRegex)
  return (
    <>
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-400 underline underline-offset-2 hover:text-brand-300
                       break-all transition-colors"
            onClick={e => e.stopPropagation()}
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

export default function AnnouncementBanner({ batchId }) {
  const [items,     setItems]     = useState([])
  const [collapsed, setCollapsed] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('dismissed_ann') || '[]') }
    catch { return [] }
  })

  useEffect(() => {
    const unsub = subscribeToAnnouncements(batchId, setItems)
    return unsub
  }, [batchId])

  const dismiss = (id) => {
    const next = [...dismissed, id]
    setDismissed(next)
    try { sessionStorage.setItem('dismissed_ann', JSON.stringify(next)) } catch {}
  }

  const visible = items.filter(a => !dismissed.includes(a.id))
  if (visible.length === 0) return null

  const sorted = [...visible.filter(a => a.pinned), ...visible.filter(a => !a.pinned)]

  return (
    <div className="mb-6">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center gap-2 w-full text-left mb-2"
      >
        <Megaphone size={14} className="text-brand-400 shrink-0"/>
        <span className="text-sm font-display font-600 text-brand-400">
          {sorted.length} Announcement{sorted.length > 1 ? 's' : ''}
        </span>
        {collapsed
          ? <ChevronDown size={14} className="text-dark-500 ml-auto"/>
          : <ChevronUp   size={14} className="text-dark-500 ml-auto"/>
        }
      </button>

      {!collapsed && (
        <div className="space-y-2">
          {sorted.map(item => (
            <div
              key={item.id}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${
                item.pinned
                  ? 'bg-brand-600/8 border-brand-600/20'
                  : 'bg-dark-900 border-dark-800'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {item.pinned
                  ? <Pin size={14} className="text-brand-400"/>
                  : <Megaphone size={14} className="text-dark-500"/>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-display font-600 ${item.pinned ? 'text-brand-300' : 'text-white'}`}>
                  {item.title}
                </p>
                <p className="text-dark-400 text-sm mt-0.5 leading-relaxed">
                  <LinkifiedText text={item.body}/>
                </p>
              </div>
              <button
                onClick={() => dismiss(item.id)}
                className="shrink-0 text-dark-600 hover:text-dark-300 transition-colors mt-0.5"
              >
                <X size={13}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}