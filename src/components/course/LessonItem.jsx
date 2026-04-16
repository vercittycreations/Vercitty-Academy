import { CheckCircle, PlayCircle, FileText, Bookmark, Lock } from 'lucide-react'

export default function LessonItem({
  lesson,
  index,
  isActive,
  isCompleted,
  isBookmarked = false,
  isLocked     = false,
  dayNumber    = null,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`w-full text-left flex items-start gap-3 px-4 py-3.5 rounded-lg
                  transition-all duration-200 group relative
                  ${isLocked
                    ? 'opacity-50 cursor-not-allowed border border-transparent'
                    : isActive
                      ? 'bg-brand-600/15 border border-brand-600/30 cursor-pointer'
                      : 'hover:bg-dark-800 border border-transparent cursor-pointer'
                  }`}
    >
      {/* Status icon */}
      <div className="shrink-0 mt-0.5">
        {isLocked ? (
          <Lock size={16} className="text-dark-600" />
        ) : isCompleted ? (
          <CheckCircle size={18} className="text-emerald-400" />
        ) : isActive ? (
          <PlayCircle size={18} className="text-brand-400" />
        ) : (
          <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center
                           ${isActive ? 'border-brand-500' : 'border-dark-600 group-hover:border-dark-400'}`}>
            <span className="text-[9px] font-display font-700 text-dark-400 group-hover:text-dark-200">
              {index + 1}
            </span>
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-body leading-snug truncate
                       ${isLocked
                         ? 'text-dark-600'
                         : isActive
                           ? 'text-white font-500'
                           : 'text-dark-300 group-hover:text-dark-100'
                       }`}>
          {lesson.title}
        </p>
        {lesson.description && !isLocked && (
          <p className="text-xs text-dark-500 mt-0.5 line-clamp-1">
            {lesson.description}
          </p>
        )}
        {isLocked && dayNumber && (
          <p className="text-[10px] text-dark-700 mt-0.5">
            Unlocks on Day {dayNumber}
          </p>
        )}
        {!isLocked && (
          <div className="flex items-center gap-2 mt-1">
            {lesson.youtubeUrl && (
              <span className="inline-flex items-center gap-1 text-[10px] text-dark-500">
                <PlayCircle size={9} /> Video
              </span>
            )}
            {(lesson.resources?.length > 0 || lesson.resourceLink) && (
              <span className="inline-flex items-center gap-1 text-[10px] text-dark-500">
                <FileText size={9} /> Resources
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        {/* Day badge */}
        {dayNumber && !isLocked && (
          <span className="text-[9px] text-dark-600 font-display font-600">
            D{dayNumber}
          </span>
        )}
        {/* Bookmark icon */}
        {isBookmarked && !isLocked && (
          <Bookmark size={11} className="text-amber-400 fill-amber-400" />
        )}
      </div>

      {/* Active left indicator */}
      {isActive && !isLocked && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-brand-500 rounded-r-full" />
      )}
    </button>
  )
}