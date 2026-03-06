import { Download, ExternalLink, FileText } from 'lucide-react'

export default function ResourceButton({ resourceLink }) {
  if (!resourceLink) return null

  const handleOpen = () => {
    window.open(resourceLink, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleOpen}
      className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-lg
                 bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-dark-500
                 text-dark-200 hover:text-white text-sm font-display font-500
                 transition-all duration-200 group"
    >
      <div className="w-7 h-7 rounded-md bg-brand-600/20 flex items-center justify-center
                      group-hover:bg-brand-600/30 transition-colors">
        <FileText size={14} className="text-brand-400" />
      </div>
      Download Resource
      <ExternalLink size={13} className="text-dark-500 group-hover:text-dark-300 transition-colors ml-1" />
    </button>
  )
}