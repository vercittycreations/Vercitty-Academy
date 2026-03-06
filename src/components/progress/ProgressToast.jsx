import { useEffect, useState } from 'react'
import { CheckCircle, X } from 'lucide-react'

export default function ProgressToast({ message, show, onClose }) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onClose, 3500)
      return () => clearTimeout(t)
    }
  }, [show, onClose])

  if (!show) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl
                      bg-dark-800 border border-emerald-500/30
                      shadow-2xl shadow-black/50">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
          <CheckCircle size={16} className="text-emerald-400" />
        </div>
        <p className="text-sm font-body text-white">{message}</p>
        <button onClick={onClose} className="text-dark-500 hover:text-dark-200 ml-2">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}