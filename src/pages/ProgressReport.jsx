import { useState, useEffect } from 'react'
import { useNavigate }         from 'react-router-dom'
import {
  ArrowLeft, Download, CheckCircle, BookOpen, Trophy
} from 'lucide-react'
import { useAuth }   from '../context/AuthContext'
import {
  getCoursesForUser, getCourse,
  getLessonsForCourse, getProgressForUserCourse,
} from '../firebase/firestore'
import PageWrapper from '../components/layout/PageWrapper'
import Spinner     from '../components/ui/Spinner'

export default function ProgressReport() {
  const { user, profile } = useAuth()
  const navigate          = useNavigate()
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const courseIds = await getCoursesForUser(user.uid)
      const items = await Promise.all(
        courseIds.map(async id => {
          const [course, lessons, completedIds] = await Promise.all([
            getCourse(id),
            getLessonsForCourse(id),
            getProgressForUserCourse(user.uid, id),
          ])
          return { course, lessons, completedIds }
        })
      )
      setData(items.filter(d => d.course))
      setLoading(false)
    }
    load()
  }, [user])

  const totalLessons     = data.reduce((a, d) => a + d.lessons.length, 0)
  const totalCompleted   = data.reduce((a, d) => a + d.completedIds.length, 0)
  const completedCourses = data.filter(
    d => d.lessons.length > 0 && d.completedIds.length === d.lessons.length
  ).length
  const overallPct = totalLessons > 0
    ? Math.round((totalCompleted / totalLessons) * 100)
    : 0
  const today = new Date().toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  if (loading) return <PageWrapper><Spinner text="Generating report..." /></PageWrapper>

  return (
    <>
      {/* Print CSS */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: #111 !important; }
          .card { border: 1px solid #e5e7eb !important; background: white !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <PageWrapper>
        {/* Top nav — hidden on print */}
        <div className="no-print flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} /> Dashboard
            </button>
            <div className="w-px h-5 bg-dark-700" />
            <h1 className="page-title">Progress Report</h1>
          </div>
          <button onClick={() => window.print()} className="btn-primary">
            <Download size={16} /> Export PDF
          </button>
        </div>

        {/* ── Report content ─────────────────────────────── */}

        {/* Student header card */}
        <div className="card border border-dark-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-brand-600/20 border border-brand-600/30
                              flex items-center justify-center shrink-0">
                <span className="text-brand-400 font-display font-700 text-xl">
                  {profile?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-display font-700 text-white">{profile?.name}</h2>
                <p className="text-dark-400 text-sm">{profile?.email}</p>
                <p className="text-dark-500 text-xs mt-0.5">Vercitty Academy</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-dark-500 mb-0.5">Report date</p>
              <p className="text-sm font-display font-600 text-white">{today}</p>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Courses Assigned',  value: data.length,       color: 'text-brand-400'   },
              { label: 'Courses Completed', value: completedCourses,  color: 'text-emerald-400' },
              { label: 'Lessons Done',      value: `${totalCompleted}/${totalLessons}`, color: 'text-amber-400' },
              { label: 'Overall Progress',  value: `${overallPct}%`,  color: 'text-brand-400'   },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-dark-800 rounded-xl p-4 text-center">
                <p className={`text-2xl font-display font-700 ${color}`}>{value}</p>
                <p className="text-xs text-dark-500 mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Overall progress bar */}
          <div>
            <div className="flex justify-between text-xs text-dark-400 mb-1.5">
              <span>Overall Progress</span>
              <span className={`font-600 ${overallPct === 100 ? 'text-emerald-400' : 'text-brand-400'}`}>
                {overallPct}%
              </span>
            </div>
            <div className="h-2.5 bg-dark-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700
                             ${overallPct === 100
                               ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                               : 'bg-gradient-to-r from-brand-500 to-brand-400'
                             }`}
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Course breakdown */}
        <div className="space-y-4">
          {data.map(({ course, lessons, completedIds }) => {
            const pct  = lessons.length > 0
              ? Math.round((completedIds.length / lessons.length) * 100)
              : 0
            const done = completedIds.length === lessons.length && lessons.length > 0

            return (
              <div key={course.id} className="card border border-dark-800 overflow-hidden">
                {/* Course header */}
                <div className="flex items-center gap-4 p-5">
                  {course.thumbnail && (
                    <img
                      src={course.thumbnail} alt=""
                      className="w-16 h-10 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-display font-700 text-white">{course.title}</h3>
                      {done && (
                        <span className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs">
                          ✓ Complete
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-dark-500">
                      {completedIds.length} of {lessons.length} lessons completed
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-2xl font-display font-700
                                   ${done ? 'text-emerald-400' : pct > 0 ? 'text-brand-400' : 'text-dark-600'}`}>
                      {pct}%
                    </p>
                  </div>
                </div>

                {/* Course progress bar */}
                <div className="h-1.5 bg-dark-800 mx-5 rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full transition-all
                                 ${done ? 'bg-emerald-500' : 'bg-brand-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Lesson grid */}
                {lessons.length > 0 && (
                  <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {lessons.map((lesson, i) => {
                      const lessonDone = completedIds.includes(lesson.id)
                      return (
                        <div
                          key={lesson.id}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg
                                      ${lessonDone ? 'bg-emerald-500/5' : 'bg-dark-800/50'}`}
                        >
                          {lessonDone ? (
                            <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-dark-600 shrink-0
                                            flex items-center justify-center">
                              <span className="text-[8px] text-dark-600">{i + 1}</span>
                            </div>
                          )}
                          <span className={`text-xs font-body truncate
                                            ${lessonDone ? 'text-dark-300' : 'text-dark-500'}`}>
                            {lesson.title}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Completed banner */}
                {done && (
                  <div className="mx-5 mb-5 flex items-center gap-2 px-4 py-2.5 rounded-lg
                                  bg-emerald-500/10 border border-emerald-500/20">
                    <Trophy size={14} className="text-emerald-400 shrink-0" />
                    <span className="text-xs font-display font-600 text-emerald-400">
                      All {lessons.length} lessons completed
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Report footer */}
        <div className="mt-8 pt-6 border-t border-dark-800 flex items-center justify-between">
          <p className="text-xs text-dark-600">
            Generated by Vercitty Academy · {today}
          </p>
          <p className="text-xs text-dark-600">Confidential</p>
        </div>
      </PageWrapper>
    </>
  )
}