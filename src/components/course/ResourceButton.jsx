import { ExternalLink, FileText } from 'lucide-react'

export default function ResourceButton({ resourceLink, resources = [] }) {
  // Build final list — new array format first, fall back to old single link
  const list = resources.filter(r => r.url?.trim()).length > 0
    ? resources.filter(r => r.url?.trim())
    : resourceLink?.trim()
      ? [{ label: 'Download Resource', url: resourceLink }]
      : []

  if (list.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {list.map((r, i) => (
        <button
          key={i}
          onClick={() => window.open(r.url, '_blank', 'noopener,noreferrer')}
          className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg
                     bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-dark-500
                     text-dark-200 hover:text-white text-sm font-display font-500
                     transition-all duration-200 group"
        >
          <div className="w-6 h-6 rounded-md bg-brand-600/20 flex items-center justify-center
                          group-hover:bg-brand-600/30 transition-colors shrink-0">
            <FileText size={12} className="text-brand-400" />
          </div>
          {r.label || `Resource ${i + 1}`}
          <ExternalLink size={12} className="text-dark-500 group-hover:text-dark-300 transition-colors" />
        </button>
      ))}
    </div>
  )
}