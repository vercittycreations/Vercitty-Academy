import { useState, useEffect } from 'react'
import { Activity, CheckCircle, Trophy, Users, RefreshCw } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Spinner     from '../../components/ui/Spinner'
import {
  subscribeToActivityFeed,
  getAllUsers,
  getAllCourses,
  getLessonsForCourse,
} from '../../firebase/firestore'

function timeAgo(ts) {
  if (!ts) return 'Just now'
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  const secs  = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secs < 60)  return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

export default function ActivityFeed() {
  const [events,  setEvents]  = useState([])
  const [users,   setUsers]   = useState({}) // id -> user
  const [courses, setCourses] = useState({}) // id -> course
  const [lessons, setLessons] = useState({}) // id -> lesson
  const [loading, setLoading] = useState(true)
  const [live,    setLive]    = useState(true)
  const [tick,    setTick]    = useState(0) // force re-render for timeAgo

  // Load reference data once
  useEffect(() => {
    Promise.all([getAllUsers(), getAllCourses()]).then(async ([us, cs]) => {
      const userMap   = {}
      const courseMap = {}
      us.forEach(u  => { userMap[u.id]   = u })
      cs.forEach(c  => { courseMap[c.id] = c })
      setUsers(userMap)
      setCourses(courseMap)

      // Fetch all lessons for all courses
      const lessonMap = {}
      await Promise.all(
        cs.map(async c => {
          const ls = await getLessonsForCourse(c.id)
          ls.forEach(l => { lessonMap[l.id] = l })
        })
      )
      setLessons(lessonMap)
      setLoading(false)
    })
  }, [])

  // Real-time listener
  useEffect(() => {
    if (!live) return
    const unsub = subscribeToActivityFeed(data => {
      setEvents(data)
    }, 30)
    return unsub
  }, [live])

  // Tick every 30s to refresh timeAgo display
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(interval)
  }, [])

  const totalToday = events.filter(e => {
    if (!e.completedAt) return false
    const date = e.completedAt.toDate ? e.completedAt.toDate() : new Date()
    return date.toDateString() === new Date().toDateString()
  }).length

  const uniqueStudents = new Set(events.map(e => e.userId)).size

  return (
    <PageWrapper>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {live && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-display font-600">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            )}
          </div>
          <h1 className="page-title">Activity Feed</h1>
          <p className="text-dark-400 text-sm mt-1 font-body">
            Real-time student completions and activity.
          </p>
        </div>
        <button
          onClick={() => setLive(l => !l)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm
                      font-display font-600 border transition-all
                      ${live
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20'
                        : 'btn-secondary'
                      }`}
        >
          <RefreshCw size={14} className={live ? 'animate-spin' : ''} />
          {live ? 'Pause feed' : 'Resume feed'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: CheckCircle, label: 'Completions today',   value: totalToday,      color: 'emerald' },
          { icon: Users,       label: 'Active students',     value: uniqueStudents,  color: 'brand'   },
          { icon: Activity,    label: 'Events in feed',      value: events.length,   color: 'amber'   },
        ].map(({ icon: Icon, label, value, color }) => {
          const cls = {
            brand:   'bg-brand-600/10 border-brand-600/20 text-brand-400',
            emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
            amber:   'bg-amber-500/10 border-amber-500/20 text-amber-400',
          }[color]
          return (
            <div key={label} className={`card border flex items-center gap-4 px-5 py-4 ${cls}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cls}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-2xl font-display font-700 text-white">{value}</p>
                <p className="text-xs text-dark-400 font-body">{label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Feed */}
      {loading ? (
        <Spinner text="Loading activity..." />
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <Activity size={32} className="text-dark-600 mb-4" />
          <p className="text-white font-display font-600">No activity yet</p>
          <p className="text-dark-500 text-sm font-body mt-1">
            Student completions will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="space-y-0 card border border-dark-800 overflow-hidden">
          {events.map((event, i) => {
            const user   = users[event.userId]
            const course = courses[event.courseId]
            const lesson = lessons[event.lessonId]

            return (
              <div
                key={event.id}
                className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-dark-800/40
                             ${i < events.length - 1 ? 'border-b border-dark-800/60' : ''}`}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-brand-600/20 border border-brand-600/30
                                flex items-center justify-center shrink-0">
                  <span className="text-brand-400 font-display font-700 text-sm">
                    {user?.name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-body leading-snug">
                    <span className="font-600">{user?.name || 'Unknown'}</span>
                    <span className="text-dark-400"> completed </span>
                    <span className="text-brand-300">
                      {lesson?.title || 'a lesson'}
                    </span>
                    {course && (
                      <span className="text-dark-500"> in {course.title}</span>
                    )}
                  </p>
                </div>

                {/* Status + time */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <CheckCircle size={13} className="text-emerald-400" />
                  </div>
                  <span className="text-xs text-dark-500 font-body w-16 text-right">
                    {timeAgo(event.completedAt)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PageWrapper>
  )
}