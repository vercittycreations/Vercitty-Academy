import { useState } from 'react'
import LessonItem   from './LessonItem'
import BatchCalendar from '../batch/BatchCalendar'
import { ListVideo, Search, Bookmark, Calendar, ChevronDown, ChevronUp, Lock } from 'lucide-react'

export default function LessonPlaylist({
  lessons,
  activeLesson,
  completedLessons,
  bookmarkedLessons = [],
  onSelect,
  onLockedClick,
  currentDay  = 0,
  totalDays   = 30,
  hasBatch    = false,
}) {
  const [query,         setQuery]         = useState('')
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [showCalendar,  setShowCalendar]  = useState(false)

  if (!lessons || lessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <ListVideo size={28} className="text-dark-600"/>
        <p className="text-dark-500 text-sm">No lessons yet.</p>
      </div>
    )
  }

  const completedCount = completedLessons.length
  const totalCount     = lessons.length
  const percent        = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Lock logic — strict: only currentDay unlocked for batch users
  const isLocked = (index) => {
    const lesson = lessons[index]
    if (!lesson) return true
    if (lesson.dayNumber && hasBatch) return lesson.dayNumber > currentDay
    if (index === 0) return false
    return !completedLessons.includes(lessons[index - 1].id)
  }

  const hasDayNumbers = lessons.some(l => l.dayNumber)

  // KEY FIX: When batch + dayNumbers exist, sidebar shows ONLY today's lessons
  const sidebarLessons = (hasBatch && hasDayNumbers)
    ? lessons.filter(l => l.dayNumber === currentDay)
    : lessons

  // Filter by search / bookmarks
  const filteredLessons = sidebarLessons.filter(l => {
    const matchSearch = l.title.toLowerCase().includes(query.toLowerCase())
    const matchBm     = showBookmarks ? bookmarkedLessons.includes(l.id) : true
    return matchSearch && matchBm
  })

  return (
    <div className="flex flex-col h-full">

      {/* Calendar toggle */}
      {hasBatch && currentDay > 0 && (
        <div className="border-b border-dark-800">
          <button
            onClick={() => setShowCalendar(c => !c)}
            className="w-full flex items-center gap-2 px-4 py-3 hover:bg-dark-800/40 transition-colors"
          >
            <Calendar size={13} className="text-brand-400 shrink-0"/>
            <span className="text-xs font-display font-600 text-brand-400 flex-1 text-left">
              Day {currentDay}/{totalDays} Calendar
            </span>
            {showCalendar
              ? <ChevronUp   size={13} className="text-dark-500"/>
              : <ChevronDown size={13} className="text-dark-500"/>
            }
          </button>
          {showCalendar && (
            <div className="px-3 pb-3">
              <BatchCalendar
                currentDay={currentDay}
                totalDays={totalDays}
                completedLessons={completedLessons}
                lessons={lessons}
                onDayClick={(lesson) => onSelect?.(lesson)}
              />
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 border-b border-dark-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-display font-700 text-white">
              {hasBatch && hasDayNumbers ? `Day ${currentDay} Lessons` : 'Lessons'}
            </h3>
            {hasBatch && hasDayNumbers && (
              <p className="text-[10px] text-dark-500 mt-0.5">Only today's content shown</p>
            )}
          </div>
          <span className="text-xs text-dark-400">{completedCount}/{totalCount}</span>
        </div>

        <div className="w-full h-1 bg-dark-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-700"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none"/>
          <input
            type="text"
            placeholder="Search lessons..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-dark-800 border border-dark-700 rounded-lg pl-8 pr-3 py-1.5
                       text-dark-100 placeholder-dark-500 text-xs font-body
                       focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
          />
        </div>

        <button
          onClick={() => setShowBookmarks(b => !b)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-display
                      transition-all w-full
                      ${showBookmarks
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                        : 'bg-dark-800 text-dark-400 border border-dark-700 hover:border-dark-600'
                      }`}
        >
          <Bookmark size={11} className={showBookmarks ? 'fill-amber-400' : ''}/>
          {showBookmarks ? 'Showing saved' : 'Saved only'}
          {bookmarkedLessons.length > 0 && (
            <span className="ml-auto bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded text-[10px]">
              {bookmarkedLessons.length}
            </span>
          )}
        </button>
      </div>

      {/* Lesson list — only today's for batch users */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredLessons.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2 text-center">
            <Lock size={18} className="text-dark-700"/>
            <p className="text-dark-500 text-xs px-3">
              {showBookmarks
                ? 'No saved lessons.'
                : hasBatch && hasDayNumbers
                  ? `No lessons for Day ${currentDay}.`
                  : 'No lessons match.'
              }
            </p>
            {showBookmarks && (
              <button onClick={() => setShowBookmarks(false)} className="text-brand-400 text-xs hover:text-brand-300">
                Show all
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLessons.map(lesson => {
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
                  dayNumber={lesson.dayNumber}
                  onClick={() => locked ? onLockedClick?.() : onSelect(lesson)}
                />
              )
            })}
          </div>
        )}

        {/* Next day teaser */}
        {hasBatch && hasDayNumbers && !query && !showBookmarks && currentDay < totalDays && (
          <div className="mt-4 px-3 py-3 rounded-lg border border-dark-800 bg-dark-900/50 text-center">
            <Lock size={12} className="text-dark-700 mx-auto mb-1"/>
            <p className="text-[10px] text-dark-600">Day {currentDay + 1}+ unlocks tomorrow</p>
          </div>
        )}
      </div>
    </div>
  )
}