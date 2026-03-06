import { getEmbedUrl } from '../../utils/youtube'
import { PlayCircle } from 'lucide-react'

export default function VideoPlayer({ youtubeUrl, title }) {
  const embedUrl = getEmbedUrl(youtubeUrl)

  if (!embedUrl) {
    return (
      <div className="w-full aspect-video bg-dark-900 border border-dark-800 rounded-xl flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-dark-800 flex items-center justify-center">
          <PlayCircle size={32} className="text-dark-500" />
        </div>
        <p className="text-dark-500 text-sm font-body">No video available for this lesson.</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="relative w-full aspect-video bg-dark-950 rounded-xl overflow-hidden border border-dark-800 shadow-2xl shadow-black/60">
        <iframe
          key={embedUrl}
          src={embedUrl}
          title={title || 'Lesson Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
          style={{ border: 'none' }}
        />
      </div>
    </div>
  )
}