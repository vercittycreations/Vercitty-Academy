import { CheckCircle, Lock, Play } from 'lucide-react'

export default function BatchCalendar({
  currentDay = 1,
  totalDays  = 30,
  completedLessons = [],
  lessons = [],
  onDayClick,
}) {
  // Group lessons by dayNumber
  const lessonsByDay = {}
  lessons.forEach(l => {
    if (l.dayNumber) {
      if (!lessonsByDay[l.dayNumber]) lessonsByDay[l.dayNumber] = []
      lessonsByDay[l.dayNumber].push(l)
    }
  })

  const getDayStatus = (day) => {
    if (day > currentDay) return 'locked'
    if (day === currentDay) return 'today'
    const dayLessons = lessonsByDay[day] || []
    if (dayLessons.length === 0) return 'past-no-lesson'
    const allDone = dayLessons.every(l => completedLessons.includes(l.id))
    return allDone ? 'done' : 'past-pending'
  }

  const cols = totalDays <= 10 ? totalDays
    : totalDays <= 20 ? 5
    : totalDays <= 30 ? 6
    : totalDays <= 42 ? 7
    : 7

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-display font-700 text-white">
          {totalDays}-Day Program
        </h3>
        <span className="text-xs text-brand-400 font-display font-600">
          Day {currentDay} / {totalDays}
        </span>
      </div>

      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: totalDays }, (_, i) => {
          const day     = i + 1
          const status  = getDayStatus(day)
          const lessons = lessonsByDay[day] || []

          const styles = {
            locked:           'bg-dark-900 border-dark-800 text-dark-700 cursor-default',
            today:            'bg-brand-600 border-brand-500 text-white ring-2 ring-brand-400 ring-offset-1 ring-offset-dark-950',
            done:             'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
            'past-pending':   'bg-amber-500/10 border-amber-500/20 text-amber-400',
            'past-no-lesson': 'bg-dark-800 border-dark-700 text-dark-500',
          }

          return (
            <button
              key={day}
              onClick={() => {
                if (status === 'locked') return
                const firstLesson = lessons[0]
                if (firstLesson && onDayClick) onDayClick(firstLesson)
              }}
              className={`relative flex flex-col items-center justify-center rounded-lg border
                          text-xs font-display font-600 aspect-square select-none transition-all
                          ${styles[status]}
                          ${status !== 'locked' && lessons.length > 0 ? 'hover:scale-105' : ''}`}
              title={lessons.length > 0 ? lessons.map(l => l.title).join(', ') : `Day ${day}`}
            >
              {status === 'locked' && <Lock size={8} className="mb-0.5 opacity-60"/>}
              {status === 'done'   && <CheckCircle size={8} className="mb-0.5"/>}
              {status === 'today'  && <Play size={8} className="mb-0.5"/>}
              <span className="leading-none">{day}</span>
              {/* Multiple videos dot indicator */}
              {lessons.length > 1 && status !== 'locked' && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-current opacity-60"/>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-dark-800">
        {[
          { color: 'bg-brand-600',     label: 'Today'   },
          { color: 'bg-emerald-500/40',label: 'Done'    },
          { color: 'bg-amber-500/20',  label: 'Pending' },
          { color: 'bg-dark-800',      label: 'Locked'  },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded ${color} border border-dark-700`}/>
            <span className="text-[10px] text-dark-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}