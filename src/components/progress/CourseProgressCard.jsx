import { useNavigate } from 'react-router-dom'
import { ChevronRight, Trophy, BookOpen } from 'lucide-react'
import ProgressBar  from '../ui/ProgressBar'
import ProgressRing from '../ui/ProgressRing'
import { useProgress } from '../../hooks/useProgress'
import { useLessons }  from '../../hooks/useLessons'
import { useAuth }     from '../../context/AuthContext'

export default function CourseProgressCard({ course }) {
  const navigate              = useNavigate()
  const { user }              = useAuth()
  const { lessons }           = useLessons(course.id)
  const { completedLessons, getPercent } = useProgress(user?.uid, course.id)
  const percent               = getPercent(lessons.length)
  const remaining             = lessons.length - completedLessons.length

  return (
    <div
      onClick={() => navigate(`/course/${course.id}`)}
      className="card border border-dark-800 hover:border-brand-600/30 p-5 cursor-pointer
                 transition-all duration-200 hover:shadow-lg hover:shadow-brand-600/5 group"
    >
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-dark-800 shrink-0">
          {course.thumbnail
            ? <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><BookOpen size={20} className="text-dark-600" /></div>
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-display font-600 text-sm leading-snug mb-1 group-hover:text-brand-300 transition-colors line-clamp-1">
            {course.title}
          </h3>
          <p className="text-xs text-dark-500 mb-3">
            {percent === 100
              ? '🎓 Course completed!'
              : `${remaining} lesson${remaining !== 1 ? 's' : ''} remaining`
            }
          </p>
          <ProgressBar percent={percent} showLabel={false} size="sm" color={percent === 100 ? 'emerald' : 'brand'} />
        </div>

        {/* Ring + arrow */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <ProgressRing percent={percent} size={48} stroke={3} />
          <ChevronRight size={13} className="text-dark-600 group-hover:text-brand-400 transition-colors" />
        </div>
      </div>

      {/* Completion banner */}
      {percent === 100 && (
        <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Trophy size={13} className="text-emerald-400" />
          <span className="text-xs text-emerald-400 font-display font-600">All lessons completed</span>
        </div>
      )}
    </div>
  )
}