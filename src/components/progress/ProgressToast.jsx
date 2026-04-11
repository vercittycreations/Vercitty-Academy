import { useEffect } from 'react'
import { CheckCircle, AlertTriangle, X } from 'lucide-react'

export default function ProgressToast({ message, show, type = 'success', onClose }) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onClose, 3500)
      return () => clearTimeout(t)
    }
  }, [show, onClose])

  if (!show) return null

  const isWarning = type === 'warning'

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up max-w-sm">
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl shadow-black/50
                       ${isWarning
                         ? 'bg-dark-800 border border-amber-500/30'
                         : 'bg-dark-800 border border-emerald-500/30'
                       }`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
                         ${isWarning ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
          {isWarning
            ? <AlertTriangle size={15} className="text-amber-400" />
            : <CheckCircle  size={15} className="text-emerald-400" />
          }
        </div>
        <p className="text-sm font-body text-white flex-1">{message}</p>
        <button onClick={onClose} className="text-dark-500 hover:text-dark-200 ml-1 shrink-0">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}