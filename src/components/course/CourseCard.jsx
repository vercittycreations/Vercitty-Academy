import { useNavigate } from 'react-router-dom'
import { PlayCircle, BookOpen, ChevronRight } from 'lucide-react'
import ProgressBar from '../ui/ProgressBar'

// meta = { lessonCount, completedIds, percent } — passed from parent, NO individual Firestore reads
export default function CourseCard({ course, meta }) {
  const navigate = useNavigate()
  const percent      = meta?.percent      ?? 0
  const lessonCount  = meta?.lessonCount  ?? 0

  return (
    <div
      className="card group flex flex-col overflow-hidden cursor-pointer
                 hover:border-brand-600/40 transition-all duration-200
                 active:scale-[0.99]"
      onClick={() => navigate(`/course/${course.id}`)}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-dark-800 overflow-hidden">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={36} className="text-dark-600" />
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 bg-dark-950/60 opacity-0 group-hover:opacity-100
                        transition-opacity duration-200 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center">
            <PlayCircle size={24} className="text-white" />
          </div>
        </div>

        {percent > 0 && percent < 100 && (
          <div className="absolute top-2 right-2">
            <span className="badge bg-brand-600/90 text-white text-xs px-2 py-0.5">
              {percent}%
            </span>
          </div>
        )}
        {percent === 100 && (
          <div className="absolute top-2 left-2">
            <span className="badge bg-emerald-500/90 text-white text-xs px-2 py-0.5">
              ✓ Done
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <h3 className="text-white font-display font-600 text-base leading-snug
                       group-hover:text-brand-300 transition-colors mb-2 line-clamp-2">
          {course.title}
        </h3>

        <p className="text-dark-400 text-sm leading-relaxed line-clamp-2 flex-1 mb-3">
          {course.description || 'No description provided.'}
        </p>

        <div className="flex items-center gap-2 text-xs text-dark-500 mb-3">
          <BookOpen size={11} />
          <span>{lessonCount} lesson{lessonCount !== 1 ? 's' : ''}</span>
        </div>

        <ProgressBar percent={percent} size="md" />

        <button className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
                           bg-brand-600/10 hover:bg-brand-600/20 border border-brand-600/20
                           hover:border-brand-600/40 text-brand-400 text-sm font-display font-600
                           transition-all duration-150 group/btn">
          {percent === 0 ? 'Start Course' : percent === 100 ? 'Review Course' : 'Continue'}
          <ChevronRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  )
}