import { useState } from 'react'
import LessonItem from './LessonItem'
import { ListVideo, Search, Bookmark } from 'lucide-react'

export default function LessonPlaylist({
  lessons, activeLesson, completedLessons,
  bookmarkedLessons = [], onSelect, onLockedClick
}) {
  const [query,         setQuery]         = useState('')
  const [showBookmarks, setShowBookmarks] = useState(false)

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
  const percent        = totalCount > 0
    ? Math.round((completedCount / totalCount) * 100)
    : 0

  // A lesson is locked if the previous lesson is not completed
  const isLocked = (index) => {
    if (index === 0) return false
    const prevLesson = lessons[index - 1]
    return !completedLessons.includes(prevLesson.id)
  }

  const filtered = lessons.filter(l => {
    const matchSearch = l.title.toLowerCase().includes(query.toLowerCase())
    const matchBm     = showBookmarks ? bookmarkedLessons.includes(l.id) : true
    return matchSearch && matchBm
  })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-dark-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-display font-700 text-white">Lessons</h3>
          <span className="text-xs text-dark-400 font-body">
            {completedCount}/{totalCount}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-dark-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-700"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search lessons..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-dark-800 border border-dark-700 rounded-lg pl-8 pr-3 py-2
                       text-dark-100 placeholder-dark-500 text-xs font-body
                       focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
          />
        </div>

        {/* Bookmark filter */}
        <button
          onClick={() => setShowBookmarks(b => !b)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-display
                      transition-all duration-200 w-full
                      ${showBookmarks
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                        : 'bg-dark-800 text-dark-400 border border-dark-700 hover:border-dark-600'
                      }`}
        >
          <Bookmark size={12} className={showBookmarks ? 'fill-amber-400' : ''} />
          {showBookmarks ? 'Showing saved only' : 'Show saved only'}
          {bookmarkedLessons.length > 0 && (
            <span className="ml-auto bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded text-[10px]">
              {bookmarkedLessons.length}
            </span>
          )}
        </button>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2">
            <p className="text-dark-500 text-xs">
              {showBookmarks ? 'No saved lessons.' : 'No lessons match.'}
            </p>
            {showBookmarks && (
              <button
                onClick={() => setShowBookmarks(false)}
                className="text-brand-400 text-xs hover:text-brand-300"
              >
                Show all lessons
              </button>
            )}
          </div>
        ) : (
          filtered.map((lesson) => {
            const realIndex = lessons.indexOf(lesson)
            const locked    = isLocked(realIndex)
            return (
              <LessonItem
                key={lesson.id}
                lesson={lesson}
                index={realIndex}
                isActive={activeLesson?.id === lesson.id}
                isCompleted={completedLessons.includes(lesson.id)}
                isBookmarked={bookmarkedLessons.includes(lesson.id)}
                isLocked={locked}
                onClick={() => locked ? onLockedClick?.() : onSelect(lesson)}
              />
            )
          })
        )}
      </div>
    </div>
  )
}