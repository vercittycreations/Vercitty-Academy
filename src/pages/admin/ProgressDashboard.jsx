import { useState, useEffect } from 'react'
import {
  Users, BookOpen, TrendingUp,
  ChevronDown, ChevronUp, Search, Trophy
} from 'lucide-react'
import PageWrapper  from '../../components/layout/PageWrapper'
import ProgressBar  from '../../components/ui/ProgressBar'
import Spinner      from '../../components/ui/Spinner'
import EmptyState   from '../../components/ui/EmptyState'
import {
  getAllUsers, getAllCourses,
  getAllUserCoursesFlat,
  getProgressForUserCourse,
  getLessonsForCourse,
} from '../../firebase/firestore'

export default function ProgressDashboard() {
  const [students,      setStudents]      = useState([])
  const [courses,       setCourses]       = useState([])
  const [courseMap,     setCourseMap]     = useState({}) // userId -> courseIds[]
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [expanded,      setExpanded]      = useState(null)
  const [expandData,    setExpandData]    = useState({}) // userId -> [{course, lessons, completedIds}]
  const [expandLoading, setExpandLoading] = useState(null)

  useEffect(() => {
    const load = async () => {
      const [users, allCourses, allUserCourses] = await Promise.all([
        getAllUsers(),
        getAllCourses(),
        getAllUserCoursesFlat(),
      ])
      const studs = users.filter(u => u.role !== 'admin')

      // Build userId -> courseIds map
      const map = {}
      allUserCourses.forEach(uc => {
        if (!map[uc.userId]) map[uc.userId] = []
        map[uc.userId].push(uc.courseId)
      })

      setStudents(studs)
      setCourses(allCourses)
      setCourseMap(map)
      setLoading(false)
    }
    load()
  }, [])

  const handleExpand = async (userId) => {
    if (expanded === userId) { setExpanded(null); return }
    setExpanded(userId)
    if (expandData[userId]) return
    setExpandLoading(userId)
    const courseIds = courseMap[userId] || []
    const items = await Promise.all(
      courseIds.map(async courseId => {
        const course = courses.find(c => c.id === courseId)
        if (!course) return null
        const [lessons, completedIds] = await Promise.all([
          getLessonsForCourse(courseId),
          getProgressForUserCourse(userId, courseId),
        ])
        return { course, lessons, completedIds }
      })
    )
    setExpandData(prev => ({ ...prev, [userId]: items.filter(Boolean) }))
    setExpandLoading(null)
  }

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  )

  const totalAssignments = Object.values(courseMap).reduce((a, ids) => a + ids.length, 0)
  const avgCourses = students.length > 0
    ? Math.round(totalAssignments / students.length)
    : 0

  if (loading) return <PageWrapper><Spinner text="Loading progress data..." /></PageWrapper>

  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="page-title">Progress Dashboard</h1>
        <p className="text-dark-400 text-sm mt-1">
          Monitor every student's progress across all courses.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Users,      label: 'Total students',      value: students.length, accent: 'brand'   },
          { icon: BookOpen,   label: 'Total courses',       value: courses.length,  accent: 'emerald' },
          { icon: TrendingUp, label: 'Avg courses / student', value: avgCourses,    accent: 'amber'   },
        ].map(({ icon: Icon, label, value, accent }) => {
          const map = {
            brand:   { card: 'border-brand-600/20 bg-brand-600/5',     icon: 'bg-brand-600/20 text-brand-400'   },
            emerald: { card: 'border-emerald-500/20 bg-emerald-500/5', icon: 'bg-emerald-500/20 text-emerald-400' },
            amber:   { card: 'border-amber-500/20 bg-amber-500/5',     icon: 'bg-amber-500/20 text-amber-400'   },
          }
          return (
            <div key={label} className={`card border p-5 flex items-center gap-4 ${map[accent].card}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${map[accent].icon}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-2xl font-display font-700 text-white">{value}</p>
                <p className="text-xs text-dark-400">{label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-9"
        />
      </div>

      {/* Students */}
      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No students found" description="No students match your search." />
      ) : (
        <div className="space-y-3">
          {filtered.map(student => {
            const courseIds     = courseMap[student.id] || []
            const isExpanded    = expanded === student.id
            const isLoadingExp  = expandLoading === student.id

            return (
              <div key={student.id} className="card border border-dark-800 overflow-hidden">
                {/* Student row */}
                <button
                  onClick={() => handleExpand(student.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-dark-800/40 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-brand-600/20 border border-brand-600/30
                                  flex items-center justify-center shrink-0">
                    <span className="text-brand-400 font-display font-700 text-sm">
                      {student.name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-white font-display font-600 text-sm">{student.name}</p>
                    <p className="text-dark-400 text-xs truncate">{student.email}</p>
                  </div>
                  <span className={`badge text-xs shrink-0
                                    ${courseIds.length > 0
                                      ? 'bg-brand-600/15 text-brand-400 border border-brand-600/20'
                                      : 'bg-dark-800 text-dark-500 border border-dark-700'
                                    }`}>
                    {courseIds.length} course{courseIds.length !== 1 ? 's' : ''}
                  </span>
                  {isExpanded
                    ? <ChevronUp size={15} className="text-dark-400 shrink-0" />
                    : <ChevronDown size={15} className="text-dark-400 shrink-0" />
                  }
                </button>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-dark-800 px-5 py-5">
                    {isLoadingExp ? (
                      <div className="flex items-center gap-2 py-2 text-dark-400 text-sm">
                        <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                        Loading progress...
                      </div>
                    ) : !expandData[student.id] || expandData[student.id].length === 0 ? (
                      <p className="text-dark-500 text-sm py-2">No courses assigned yet.</p>
                    ) : (
                      <div className="space-y-5">
                        {expandData[student.id].map(({ course, lessons, completedIds }) => {
                          const pct  = lessons.length > 0
                            ? Math.round((completedIds.length / lessons.length) * 100)
                            : 0
                          const done = pct === 100

                          return (
                            <div key={course.id}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {course.thumbnail && (
                                    <img
                                      src={course.thumbnail} alt=""
                                      className="w-10 h-6 rounded object-cover shrink-0"
                                    />
                                  )}
                                  <span className="text-sm font-display font-600 text-white truncate">
                                    {course.title}
                                  </span>
                                  {done && (
                                    <Trophy size={13} className="text-emerald-400 shrink-0" />
                                  )}
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-3">
                                  <span className="text-xs text-dark-500">
                                    {completedIds.length}/{lessons.length}
                                  </span>
                                  <span className={`text-sm font-display font-600 w-10 text-right
                                                    ${done
                                                      ? 'text-emerald-400'
                                                      : pct > 0
                                                        ? 'text-brand-400'
                                                        : 'text-dark-600'
                                                    }`}>
                                    {pct}%
                                  </span>
                                </div>
                              </div>
                              <ProgressBar
                                percent={pct}
                                showLabel={false}
                                size="sm"
                                color={done ? 'emerald' : 'brand'}
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </PageWrapper>
  )
}