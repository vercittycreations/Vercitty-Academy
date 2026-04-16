import { CheckCircle, Lock, Play } from 'lucide-react'

export default function BatchCalendar({
  currentDay = 1,
  completedLessons = [],
  lessons = [],
  onDayClick,
}) {
  const getLessonForDay = (day) =>
    lessons.find(l => l.dayNumber === day)

  const getDayStatus = (day) => {
    if (day > currentDay) return 'locked'
    if (day === currentDay) return 'today'
    const lesson = getLessonForDay(day)
    if (!lesson) return 'past-no-lesson'
    return completedLessons.includes(lesson.id) ? 'done' : 'past-pending'
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-display font-700 text-white">
          30-Day Program
        </h3>
        <span className="text-xs text-brand-400 font-display font-600">
          Day {currentDay} of 30
        </span>
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
        {Array.from({ length: 30 }, (_, i) => {
          const day    = i + 1
          const status = getDayStatus(day)
          const lesson = getLessonForDay(day)

          const baseClass = `
            relative flex flex-col items-center justify-center
            rounded-lg border transition-all duration-150
            text-xs font-display font-600 cursor-pointer
            aspect-square select-none
          `

          const styles = {
            locked:          'bg-dark-900 border-dark-800 text-dark-700 cursor-default',
            today:           'bg-brand-600 border-brand-500 text-white ring-2 ring-brand-400 ring-offset-1 ring-offset-dark-950',
            done:            'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
            'past-pending':  'bg-amber-500/10 border-amber-500/20 text-amber-400',
            'past-no-lesson':'bg-dark-800 border-dark-700 text-dark-500',
          }

          return (
            <button
              key={day}
              onClick={() => {
                if (status === 'locked') return
                if (lesson && onDayClick) onDayClick(lesson)
              }}
              className={`${baseClass} ${styles[status]}`}
              title={lesson ? lesson.title : `Day ${day}`}
            >
              {status === 'locked' && (
                <Lock size={9} className="mb-0.5 opacity-60" />
              )}
              {status === 'done' && (
                <CheckCircle size={9} className="mb-0.5" />
              )}
              {status === 'today' && (
                <Play size={9} className="mb-0.5" />
              )}
              <span className="leading-none">{day}</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-dark-800">
        {[
          { color: 'bg-brand-600', label: 'Today' },
          { color: 'bg-emerald-500/40', label: 'Done' },
          { color: 'bg-amber-500/20', label: 'Pending' },
          { color: 'bg-dark-800', label: 'Locked' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${color} border border-dark-700`} />
            <span className="text-xs text-dark-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}