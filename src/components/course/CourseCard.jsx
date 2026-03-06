import { useNavigate } from 'react-router-dom'
import { PlayCircle, BookOpen, ChevronRight } from 'lucide-react'
import ProgressBar from '../ui/ProgressBar'
import { useProgress } from '../../hooks/useProgress'
import { useLessons } from '../../hooks/useLessons'
import { useAuth } from '../../context/AuthContext'

export default function CourseCard({ course }) {
  const navigate = useNavigate()
  const { user }  = useAuth()
  const { lessons } = useLessons(course.id)
  const { getPercent } = useProgress(user?.uid, course.id)
  const percent = getPercent(lessons.length)

  return (
    <div
      className="card group flex flex-col overflow-hidden cursor-pointer
                 hover:border-brand-600/40 hover:shadow-xl hover:shadow-brand-600/5
                 transition-all duration-300"
      onClick={() => navigate(`/course/${course.id}`)}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-dark-800 overflow-hidden">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={36} className="text-dark-600" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-dark-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/40">
            <PlayCircle size={28} className="text-white" />
          </div>
        </div>

        {/* Progress badge */}
        {percent > 0 && (
          <div className="absolute top-3 right-3">
            <span className="badge bg-brand-600/90 text-white text-xs px-2.5 py-1">
              {percent}%
            </span>
          </div>
        )}

        {percent === 100 && (
          <div className="absolute top-3 left-3">
            <span className="badge bg-emerald-500/90 text-white text-xs px-2.5 py-1">
              ✓ Completed
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-white font-display font-600 text-base leading-snug group-hover:text-brand-300 transition-colors">
            {course.title}
          </h3>
        </div>

        <p className="text-dark-400 text-sm leading-relaxed line-clamp-2 flex-1 mb-4">
          {course.description || 'No description provided.'}
        </p>

        {/* Lesson count */}
        <div className="flex items-center gap-2 text-xs text-dark-500 mb-4">
          <BookOpen size={12} />
          <span>{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Progress bar */}
        <ProgressBar percent={percent} size="md" />

        {/* CTA */}
        <button className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
                           bg-brand-600/10 hover:bg-brand-600/20 border border-brand-600/20
                           hover:border-brand-600/40 text-brand-400 text-sm font-display font-600
                           transition-all duration-200 group/btn">
          {percent === 0 ? 'Start Course' : percent === 100 ? 'Review Course' : 'Continue Learning'}
          <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  )
}