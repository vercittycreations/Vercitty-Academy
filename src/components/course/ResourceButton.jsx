import { ExternalLink, FileText, PlayCircle, BookOpen, Github, Link } from 'lucide-react'

const TYPE_CONFIG = {
  video:   { icon: PlayCircle, label: 'Watch',    color: 'text-red-400',    bg: 'bg-red-600/15'    },
  article: { icon: BookOpen,   label: 'Read',     color: 'text-blue-400',   bg: 'bg-blue-600/15'   },
  pdf:     { icon: FileText,   label: 'PDF',      color: 'text-amber-400',  bg: 'bg-amber-500/15'  },
  github:  { icon: Github,     label: 'GitHub',   color: 'text-dark-200',   bg: 'bg-dark-700'      },
  other:   { icon: Link,       label: 'Resource', color: 'text-brand-400',  bg: 'bg-brand-600/15'  },
}

export default function ResourceButton({ resourceLink, resources = [] }) {
  const list = resources.filter(r => r.url?.trim()).length > 0
    ? resources.filter(r => r.url?.trim())
    : resourceLink?.trim()
      ? [{ label: 'Download Resource', url: resourceLink, type: 'other' }]
      : []

  if (list.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {list.map((r, i) => {
        const cfg  = TYPE_CONFIG[r.type] || TYPE_CONFIG.other
        const Icon = cfg.icon
        const displayLabel = r.label || cfg.label

        return (
          <button
            key={i}
            onClick={() => window.open(r.url, '_blank', 'noopener,noreferrer')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg
                        bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-dark-500
                        text-dark-200 hover:text-white text-sm font-display font-500
                        transition-all duration-200 group`}
          >
            <div className={`w-6 h-6 rounded-md ${cfg.bg} flex items-center justify-center
                            group-hover:opacity-90 transition-opacity shrink-0`}>
              <Icon size={12} className={cfg.color} />
            </div>
            {displayLabel}
            <ExternalLink size={11} className="text-dark-500 group-hover:text-dark-300 transition-colors" />
          </button>
        )
      })}
    </div>
  )
}