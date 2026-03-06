import LessonItem from './LessonItem'
import { ListVideo } from 'lucide-react'

export default function LessonPlaylist({ lessons, activeLesson, completedLessons, onSelect }) {
  if (!lessons || lessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <ListVideo size={28} className="text-dark-600" />
        <p className="text-dark-500 text-sm">No lessons yet.</p>
      </div>
    )
  }

  const completedCount = completedLessons.length
  const totalCount     = lessons.length
  const percent        = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="flex flex-col h-full">
      {/* Playlist header */}
      <div className="px-4 py-4 border-b border-dark-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-display font-700 text-white">Lessons</h3>
          <span className="text-xs text-dark-400 font-body">
            {completedCount}/{totalCount}
          </span>
        </div>
        {/* Mini progress bar */}
        <div className="w-full h-1 bg-dark-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-700"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {lessons.map((lesson, i) => (
          <LessonItem
            key={lesson.id}
            lesson={lesson}
            index={i}
            isActive={activeLesson?.id === lesson.id}
            isCompleted={completedLessons.includes(lesson.id)}
            onClick={() => onSelect(lesson)}
          />
        ))}
      </div>
    </div>
  )
}