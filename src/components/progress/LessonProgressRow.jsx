import { CheckCircle, Circle, Clock } from 'lucide-react'

export default function LessonProgressRow({ lesson, index, isCompleted, completedAt }) {
  return (
    <div className={`flex items-center gap-4 px-5 py-3.5 rounded-lg border transition-all duration-200
                     ${isCompleted
                       ? 'bg-emerald-500/5 border-emerald-500/15'
                       : 'bg-dark-900 border-dark-800'
                     }`}>
      {/* Status icon */}
      <div className="shrink-0">
        {isCompleted
          ? <CheckCircle size={18} className="text-emerald-400" />
          : <Circle      size={18} className="text-dark-700" />
        }
      </div>

      {/* Lesson number */}
      <div className="w-6 h-6 rounded-md bg-dark-800 flex items-center justify-center shrink-0">
        <span className="text-xs font-display font-700 text-dark-400">{index + 1}</span>
      </div>

      {/* Title */}
      <p className={`flex-1 text-sm font-body ${isCompleted ? 'text-dark-200' : 'text-dark-400'}`}>
        {lesson.title}
      </p>

      {/* Completed badge */}
      {isCompleted && (
        <span className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs shrink-0">
          ✓ Done
        </span>
      )}
    </div>
  )
}