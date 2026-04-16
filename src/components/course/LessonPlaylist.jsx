import { useState } from 'react'
import LessonItem   from './LessonItem'
import BatchCalendar from '../batch/BatchCalendar'
import { ListVideo, Search, Bookmark, Calendar, ChevronDown, ChevronUp } from 'lucide-react'

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
  const [showCalendar,  setShowCalendar]  = useState(true)

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

  // Lock logic
  const isLocked = (index) => {
    const lesson = lessons[index]
    if (!lesson) return true
    if (lesson.dayNumber && hasBatch) return lesson.dayNumber > currentDay
    if (index === 0) return false
    return !completedLessons.includes(lessons[index - 1].id)
  }

  // Group by dayNumber for display
  const hasDayNumbers = lessons.some(l => l.dayNumber)

  // Filter
  const filteredLessons = lessons.filter(l => {
    const matchSearch = l.title.toLowerCase().includes(query.toLowerCase())
    const matchBm     = showBookmarks ? bookmarkedLessons.includes(l.id) : true
    return matchSearch && matchBm
  })

  // Build day groups if dayNumbers exist
  const buildDayGroups = () => {
    const groups = {}
    filteredLessons.forEach(lesson => {
      const d = lesson.dayNumber || 0
      if (!groups[d]) groups[d] = []
      groups[d].push(lesson)
    })
    return groups
  }

  const dayGroups = hasDayNumbers ? buildDayGroups() : null
  const groupKeys = dayGroups
    ? Object.keys(dayGroups).map(Number).sort((a, b) => a - b)
    : null

  return (
    <div className="flex flex-col h-full">

      {/* ── Calendar (collapsible, top) ───────────── */}
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

      {/* ── Header ────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-dark-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-display font-700 text-white">Lessons</h3>
          <span className="text-xs text-dark-400">{completedCount}/{totalCount}</span>
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

        {/* Bookmark filter */}
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

      {/* ── Lesson list ───────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredLessons.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2">
            <p className="text-dark-500 text-xs">
              {showBookmarks ? 'No saved lessons.' : 'No lessons match.'}
            </p>
            {showBookmarks && (
              <button onClick={() => setShowBookmarks(false)} className="text-brand-400 text-xs hover:text-brand-300">
                Show all
              </button>
            )}
          </div>
        ) : hasDayNumbers && dayGroups ? (
          // ── Day-grouped view ──
          <div className="space-y-1">
            {groupKeys.map(dayNum => {
              const dayLessons  = dayGroups[dayNum]
              const isToday     = dayNum === currentDay
              const isDayLocked = hasBatch && dayNum > currentDay
              const isDayDone   = dayLessons.every(l => completedLessons.includes(l.id))
              return (
                <div key={dayNum}>
                  {/* Day header */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg mb-0.5
                                    ${isToday ? 'bg-brand-600/15' : ''}`}>
                    <span className={`text-[10px] font-display font-700 uppercase tracking-wider
                                      ${isToday    ? 'text-brand-400'
                                      : isDayLocked ? 'text-dark-700'
                                      : isDayDone  ? 'text-emerald-500'
                                      : 'text-dark-500'}`}>
                      {dayNum === 0 ? 'No day set' : `Day ${dayNum}`}
                    </span>
                    {dayLessons.length > 1 && (
                      <span className="text-[10px] text-dark-600">
                        {dayLessons.length} videos
                      </span>
                    )}
                    {isToday && (
                      <span className="ml-auto text-[10px] bg-brand-600/20 text-brand-400
                                       px-1.5 py-0.5 rounded-full font-600">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Videos for this day */}
                  {dayLessons.map(lesson => {
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
              )
            })}
          </div>
        ) : (
          // ── Sequential view (no dayNumbers) ──
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
                  onClick={() => locked ? onLockedClick?.() : onSelect(lesson)}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}