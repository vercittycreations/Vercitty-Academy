import { useState, useEffect } from 'react'
import { UserCheck, Search, ChevronDown, ChevronUp, Check, X, BookOpen } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import {
  getAllUsers, getAllCourses,
  getCoursesForUser, assignCourseToUser, unassignCourseFromUser
} from '../../firebase/firestore'

export default function AssignCourses() {
  const [users,      setUsers]      = useState([])
  const [courses,    setCourses]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [expanded,   setExpanded]   = useState(null)
  const [assignments, setAssignments] = useState({})   // userId -> [courseId]
  const [toggling,   setToggling]   = useState({})     // `${userId}_${courseId}` -> bool

  useEffect(() => {
    const load = async () => {
      const [us, cs] = await Promise.all([getAllUsers(), getAllCourses()])
      const students = us.filter(u => u.role !== 'admin')
      setUsers(students)
      setCourses(cs)
      // Load all assignments in parallel
      const entries = await Promise.all(
        students.map(async u => [u.id, await getCoursesForUser(u.id)])
      )
      setAssignments(Object.fromEntries(entries))
      setLoading(false)
    }
    load()
  }, [])

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const toggleAssign = async (userId, courseId) => {
    const key = `${userId}_${courseId}`
    setToggling(t => ({ ...t, [key]: true }))
    const current = assignments[userId] || []
    const isAssigned = current.includes(courseId)
    if (isAssigned) {
      await unassignCourseFromUser(userId, courseId)
      setAssignments(a => ({ ...a, [userId]: a[userId].filter(id => id !== courseId) }))
    } else {
      await assignCourseToUser(userId, courseId)
      setAssignments(a => ({ ...a, [userId]: [...(a[userId] || []), courseId] }))
    }
    setToggling(t => ({ ...t, [key]: false }))
  }

  if (loading) return <PageWrapper><Spinner text="Loading assignments..." /></PageWrapper>

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">Assign Courses</h1>
        <p className="text-dark-400 text-sm mt-1">
          Control which courses each student can access.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
        <input
          type="text" placeholder="Search students..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="input pl-9"
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-5">
        <div className="flex items-center gap-2 text-xs text-dark-400">
          <div className="w-4 h-4 rounded bg-brand-600/20 border border-brand-600/40 flex items-center justify-center">
            <Check size={9} className="text-brand-400" />
          </div>
          Assigned
        </div>
        <div className="flex items-center gap-2 text-xs text-dark-400">
          <div className="w-4 h-4 rounded bg-dark-800 border border-dark-700" />
          Not assigned
        </div>
      </div>

      {/* Users list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No students found"
          description="Create student accounts first before assigning courses."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(user => {
            const userCourses  = assignments[user.id] || []
            const isExpanded   = expanded === user.id
            const assignedCount = userCourses.length

            return (
              <div key={user.id} className="card border border-dark-800 overflow-hidden">
                {/* User row — click to expand */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : user.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-dark-800/40 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-brand-600/20 border border-brand-600/30 flex items-center justify-center shrink-0">
                    <span className="text-brand-400 font-display font-700 text-sm">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-white font-display font-600 text-sm">{user.name}</p>
                    <p className="text-dark-400 text-xs">{user.email}</p>
                  </div>

                  {/* Assignment count */}
                  <div className="flex items-center gap-3">
                    <span className={`badge text-xs ${
                      assignedCount > 0
                        ? 'bg-brand-600/15 text-brand-400 border border-brand-600/20'
                        : 'bg-dark-800 text-dark-500 border border-dark-700'
                    }`}>
                      {assignedCount} course{assignedCount !== 1 ? 's' : ''}
                    </span>
                    {isExpanded
                      ? <ChevronUp size={15} className="text-dark-400" />
                      : <ChevronDown size={15} className="text-dark-400" />
                    }
                  </div>
                </button>

                {/* Expanded course grid */}
                {isExpanded && (
                  <div className="border-t border-dark-800 px-5 py-4">
                    {courses.length === 0 ? (
                      <p className="text-dark-500 text-sm py-4 text-center">No courses available to assign.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {courses.map(course => {
                          const isAssigned = userCourses.includes(course.id)
                          const key        = `${user.id}_${course.id}`
                          const isLoading  = toggling[key]

                          return (
                            <button
                              key={course.id}
                              onClick={() => toggleAssign(user.id, course.id)}
                              disabled={isLoading}
                              className={`flex items-center gap-3 p-3 rounded-lg border text-left
                                          transition-all duration-200 w-full
                                          ${isAssigned
                                            ? 'bg-brand-600/10 border-brand-600/30 hover:bg-brand-600/15'
                                            : 'bg-dark-800/50 border-dark-700 hover:border-dark-500 hover:bg-dark-800'
                                          }
                                          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {/* Course thumbnail mini */}
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-dark-800 shrink-0">
                                {course.thumbnail
                                  ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                                  : <div className="w-full h-full flex items-center justify-center"><BookOpen size={14} className="text-dark-600" /></div>
                                }
                              </div>

                              {/* Title */}
                              <p className={`flex-1 text-xs font-display font-600 line-clamp-2 leading-snug
                                             ${isAssigned ? 'text-brand-300' : 'text-dark-300'}`}>
                                {course.title}
                              </p>

                              {/* Toggle indicator */}
                              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0
                                               ${isAssigned
                                                 ? 'bg-brand-600 border border-brand-500'
                                                 : 'bg-dark-700 border border-dark-600'
                                               }`}>
                                {isLoading ? (
                                  <span className="w-2.5 h-2.5 border border-white/30 border-t-white rounded-full animate-spin" />
                                ) : isAssigned ? (
                                  <Check size={11} className="text-white" />
                                ) : null}
                              </div>
                            </button>
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
