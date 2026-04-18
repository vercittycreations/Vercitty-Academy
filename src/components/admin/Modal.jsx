import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else      document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet on mobile, centered modal on sm+ */}
      <div className={`
        relative w-full ${width} card border border-dark-700
        shadow-2xl shadow-black/60
        flex flex-col
        rounded-t-2xl sm:rounded-xl
        max-h-[92vh] sm:max-h-[88vh]
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5
                        border-b border-dark-800 shrink-0">
          <h2 className="text-base font-display font-700 text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-dark-800 hover:bg-dark-700
                       flex items-center justify-center text-dark-400
                       hover:text-white transition-all"
          >
            <X size={15}/>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 sm:py-5">
          {children}
        </div>
      </div>
    </div>
  )
}