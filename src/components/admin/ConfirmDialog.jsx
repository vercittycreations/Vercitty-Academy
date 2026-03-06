import Modal from './Modal'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal open={open} onClose={onClose} title="Confirm Action" width="max-w-md">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="w-14 h-14 rounded-full bg-red-600/10 border border-red-600/20 flex items-center justify-center">
          <AlertTriangle size={24} className="text-red-400" />
        </div>
        <div>
          <h3 className="text-base font-display font-700 text-white mb-1">{title}</h3>
          <p className="text-dark-400 text-sm">{message}</p>
        </div>
        <div className="flex gap-3 w-full pt-2">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg
                       bg-red-600 hover:bg-red-500 text-white font-display font-600 text-sm
                       transition-all duration-200 disabled:opacity-50"
          >
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Deleting...</>
              : 'Delete'
            }
          </button>
        </div>
      </div>
    </Modal>
  )
}
