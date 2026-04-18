import { useState, useEffect } from 'react'
import { Award, Lock, ExternalLink, Clock } from 'lucide-react'
import { getCertificateLink } from '../../firebase/firestore.batches'

export default function CertificateButton({
  status,           // 'no-batch' | 'locked' | 'available' | 'expired'
  currentDay  = 0,
  totalDays   = 0,  // real batch totalDays — NOT hardcoded 30
  batchId     = '',
  userId      = '',
}) {
  const [driveLink, setDriveLink] = useState(null)
  const [loading,   setLoading]   = useState(false)

  useEffect(() => {
    if (status !== 'available' || !batchId || !userId) return
    setLoading(true)
    getCertificateLink(batchId, userId).then(link => {
      setDriveLink(link)
      setLoading(false)
    })
  }, [status, batchId, userId])

  if (status === 'no-batch') return null

  if (status === 'locked') {
    const daysLeft = Math.max(0, totalDays - currentDay)
    const pct      = totalDays > 0 ? Math.round((currentDay / totalDays) * 100) : 0
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-800 border border-dark-700">
        <div className="w-9 h-9 rounded-lg bg-dark-700 flex items-center justify-center shrink-0">
          <Lock size={15} className="text-dark-600"/>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-display font-600 text-dark-400">
            Certificate — Day {totalDays}
          </p>
          <p className="text-xs text-dark-600 mt-0.5">
            {daysLeft > 0
              ? `${daysLeft} more day${daysLeft !== 1 ? 's' : ''} remaining`
              : 'Almost there!'
            }
          </p>
          {/* Mini progress */}
          <div className="mt-1.5 h-1 bg-dark-900 rounded-full overflow-hidden w-full">
            <div
              className="h-full bg-brand-600/40 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <span className="text-xs font-display font-700 text-dark-600 shrink-0">
          {currentDay}/{totalDays}
        </span>
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-600/8 border border-red-600/15">
        <Clock size={16} className="text-red-400 shrink-0"/>
        <div>
          <p className="text-sm font-display font-600 text-red-400">Certificate Expired</p>
          <p className="text-xs text-red-500/70 mt-0.5">Available window (45 days) has passed.</p>
        </div>
      </div>
    )
  }

  // status === 'available'
  if (loading) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-600/8 border border-brand-600/20">
        <span className="w-4 h-4 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin shrink-0"/>
        <p className="text-sm text-brand-400">Loading certificate...</p>
      </div>
    )
  }

  if (!driveLink) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/15">
        <Award size={16} className="text-amber-500 shrink-0"/>
        <div>
          <p className="text-sm font-display font-600 text-amber-400">Certificate Ready!</p>
          <p className="text-xs text-amber-600 mt-0.5">
            Admin upload kar raha hai — thoda wait karo.
          </p>
        </div>
      </div>
    )
  }

  return (
    <a
      href={driveLink}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
                 bg-brand-600/15 border-brand-600/30 hover:bg-brand-600/25
                 hover:border-brand-600/50 group"
    >
      <div className="w-9 h-9 rounded-lg bg-brand-600/20 flex items-center justify-center shrink-0
                      group-hover:bg-brand-600/30 transition-colors">
        <Award size={18} className="text-brand-400"/>
      </div>
      <div className="flex-1">
        <p className="text-sm font-display font-600 text-brand-300">View Certificate</p>
        <p className="text-xs text-brand-500 mt-0.5">Google Drive • Click to open</p>
      </div>
      <ExternalLink size={15} className="text-brand-400 shrink-0"/>
    </a>
  )
}