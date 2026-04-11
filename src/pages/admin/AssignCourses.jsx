import { useState, useEffect } from 'react'
import { UserCheck, Search, ChevronDown, ChevronUp, Check, X, BookOpen, Users, Zap } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Spinner     from '../../components/ui/Spinner'
import EmptyState  from '../../components/ui/EmptyState'
import {
  getAllUsers, getAllCourses,
  getCoursesForUser, assignCourseToUser, unassignCourseFromUser
} from '../../firebase/firestore'

export default function AssignCourses() {
  const [users,       setUsers]       = useState([])
  const [courses,     setCourses]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [assignments, setAssignments] = useState({}) // userId -> [courseId]
  const [tab,         setTab]         = useState('student') // 'student' | 'bulk'

  // By-student state
  const [search,    setSearch]    = useState('')
  const [expanded,  setExpanded]  = useState(null)
  const [toggling,  setToggling]  = useState({})

  // Bulk assign state
  const [bulkCourseId,  setBulkCourseId]  = useState('')
  const [bulkSelected,  setBulkSelected]  = useState(new Set())
  const [bulkSaving,    setBulkSaving]    = useState(false)
  const [bulkSearch,    setBulkSearch]    = useState('')

  useEffect(() => {
    const load = async () => {
      const [us, cs] = await Promise.all([getAllUsers(), getAllCourses()])
      const students = us.filter(u => u.role !== 'admin')
      setUsers(students)
      setCourses(cs.filter(c => c.status !== 'draft'))
      const entries = await Promise.all(
        students.map(async u => [u.id, await getCoursesForUser(u.id)])
      )
      setAssignments(Object.fromEntries(entries))
      setLoading(false)
    }
    load()
  }, [])

  // ── By Student ────────────────────────────────────────────────
  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const toggleAssign = async (userId, courseId) => {
    const key      = `${userId}_${courseId}`
    const current  = assignments[userId] || []
    const assigned = current.includes(courseId)
    setToggling(t => ({ ...t, [key]: true }))
    if (assigned) {
      await unassignCourseFromUser(userId, courseId)
      setAssignments(a => ({ ...a, [userId]: a[userId].filter(id => id !== courseId) }))
    } else {
      await assignCourseToUser(userId, courseId)
      setAssignments(a => ({ ...a, [userId]: [...(a[userId] || []), courseId] }))
    }
    setToggling(t => ({ ...t, [key]: false }))
  }

  // ── Bulk Assign ───────────────────────────────────────────────
  const bulkFilteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(bulkSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(bulkSearch.toLowerCase())
  )

  const handleBulkToggleStudent = (userId) => {
    // Don't allow selecting if already assigned
    if (bulkCourseId && (assignments[userId] || []).includes(bulkCourseId)) return
    setBulkSelected(prev => {
      const next = new Set(prev)
      next.has(userId) ? next.delete(userId) : next.add(userId)
      return next
    })
  }

  const handleSelectAll = () => {
    const eligible = bulkFilteredUsers.filter(u =>
      !((assignments[u.id] || []).includes(bulkCourseId))
    )
    if (bulkSelected.size === eligible.length) {
      setBulkSelected(new Set())
    } else {
      setBulkSelected(new Set(eligible.map(u => u.id)))
    }
  }

  const handleBulkAssign = async () => {
    if (!bulkCourseId || bulkSelected.size === 0) return
    setBulkSaving(true)
    await Promise.all(
      [...bulkSelected].map(userId => assignCourseToUser(userId, bulkCourseId))
    )
    // Update assignments map
    setBulkSelected(prev => {
      prev.forEach(userId => {
        setAssignments(a => ({
          ...a,
          [userId]: [...new Set([...(a[userId] || []), bulkCourseId])]
        }))
      })
      return new Set()
    })
    setBulkSaving(false)
  }

  if (loading) return <PageWrapper><Spinner text="Loading assignments..." /></PageWrapper>

  const selectedCourse = courses.find(c => c.id === bulkCourseId)

  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="page-title">Assign Courses</h1>
        <p className="text-dark-400 text-sm mt-1">
          Control which courses each student can access.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 p-1 bg-dark-900 border border-dark-800 rounded-xl
                      w-fit mb-8">
        {[
          { key: 'student', label: 'By Student', icon: Users },
          { key: 'bulk',    label: 'Bulk Assign', icon: Zap  },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display
                        font-600 transition-all duration-200
                        ${tab === key
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                          : 'text-dark-400 hover:text-white'
                        }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── By Student tab ─────────────────────────────────────── */}
      {tab === 'student' && (
        <>
          <div className="relative mb-6 max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
            <input
              type="text" placeholder="Search students..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={UserCheck} title="No students found" description="Try a different search." />
          ) : (
            <div className="space-y-3">
              {filtered.map(user => {
                const userCourses   = assignments[user.id] || []
                const isExpanded    = expanded === user.id
                const assignedCount = userCourses.length

                return (
                  <div key={user.id} className="card border border-dark-800 overflow-hidden">
                    <button
                      onClick={() => setExpanded(isExpanded ? null : user.id)}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-dark-800/40 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-brand-600/20 border border-brand-600/30
                                      flex items-center justify-center shrink-0">
                        <span className="text-brand-400 font-display font-700 text-sm">
                          {user.name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-white font-display font-600 text-sm">{user.name}</p>
                        <p className="text-dark-400 text-xs">{user.email}</p>
                      </div>
                      <span className={`badge text-xs shrink-0 ${
                        assignedCount > 0
                          ? 'bg-brand-600/15 text-brand-400 border border-brand-600/20'
                          : 'bg-dark-800 text-dark-500 border border-dark-700'
                      }`}>
                        {assignedCount} course{assignedCount !== 1 ? 's' : ''}
                      </span>
                      {isExpanded
                        ? <ChevronUp size={15} className="text-dark-400 shrink-0" />
                        : <ChevronDown size={15} className="text-dark-400 shrink-0" />
                      }
                    </button>

                    {isExpanded && (
                      <div className="border-t border-dark-800 px-5 py-4">
                        {courses.length === 0 ? (
                          <p className="text-dark-500 text-sm py-4 text-center">No published courses available.</p>
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
                                                : 'bg-dark-800/50 border-dark-700 hover:border-dark-500'
                                              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-dark-800 shrink-0">
                                    {course.thumbnail
                                      ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                                      : <div className="w-full h-full flex items-center justify-center">
                                          <BookOpen size={14} className="text-dark-600" />
                                        </div>
                                    }
                                  </div>
                                  <p className={`flex-1 text-xs font-display font-600 line-clamp-2 leading-snug
                                                 ${isAssigned ? 'text-brand-300' : 'text-dark-300'}`}>
                                    {course.title}
                                  </p>
                                  <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0
                                                   ${isAssigned
                                                     ? 'bg-brand-600 border border-brand-500'
                                                     : 'bg-dark-700 border border-dark-600'
                                                   }`}>
                                    {isLoading
                                      ? <span className="w-2.5 h-2.5 border border-white/30 border-t-white rounded-full animate-spin" />
                                      : isAssigned
                                        ? <Check size={11} className="text-white" />
                                        : null
                                    }
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
        </>
      )}

      {/* ── Bulk Assign tab ────────────────────────────────────── */}
      {tab === 'bulk' && (
        <div className="space-y-6">
          {/* Step 1: Select course */}
          <div className="card border border-dark-700 p-5">
            <p className="text-xs font-display font-700 text-brand-400 uppercase tracking-wider mb-3">
              Step 1 — Select a course
            </p>
            {courses.length === 0 ? (
              <p className="text-dark-500 text-sm">No published courses available.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {courses.map(course => (
                  <button
                    key={course.id}
                    onClick={() => { setBulkCourseId(course.id); setBulkSelected(new Set()) }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all
                                ${bulkCourseId === course.id
                                  ? 'bg-brand-600/15 border-brand-600/40'
                                  : 'bg-dark-800/50 border-dark-700 hover:border-dark-500'
                                }`}
                  >
                    <div className="w-12 h-8 rounded-lg overflow-hidden bg-dark-800 shrink-0">
                      {course.thumbnail
                        ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center">
                            <BookOpen size={13} className="text-dark-600" />
                          </div>
                      }
                    </div>
                    <p className={`flex-1 text-xs font-display font-600 line-clamp-2 leading-snug
                                   ${bulkCourseId === course.id ? 'text-brand-300' : 'text-dark-300'}`}>
                      {course.title}
                    </p>
                    {bulkCourseId === course.id && (
                      <Check size={14} className="text-brand-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Select students */}
          {bulkCourseId && (
            <div className="card border border-dark-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-display font-700 text-brand-400 uppercase tracking-wider">
                  Step 2 — Select students
                </p>
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-brand-400 hover:text-brand-300 font-display"
                >
                  {bulkSelected.size === bulkFilteredUsers.filter(u =>
                    !((assignments[u.id] || []).includes(bulkCourseId))
                  ).length ? 'Deselect all' : 'Select all eligible'}
                </button>
              </div>

              {/* Info */}
              <div className="flex items-center gap-2 mb-4 text-xs text-dark-400">
                <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <Check size={9} className="text-emerald-400" />
                </div>
                <span>Already assigned</span>
                <div className="w-4 h-4 rounded bg-dark-800 border border-dark-700 ml-3" />
                <span>Not assigned</span>
              </div>

              {/* Search */}
              <div className="relative mb-4 max-w-sm">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none" />
                <input
                  type="text" placeholder="Search students..."
                  value={bulkSearch} onChange={e => setBulkSearch(e.target.value)}
                  className="input pl-8 text-sm"
                />
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {bulkFilteredUsers.map(user => {
                  const alreadyAssigned = (assignments[user.id] || []).includes(bulkCourseId)
                  const isSelected      = bulkSelected.has(user.id)

                  return (
                    <button
                      key={user.id}
                      onClick={() => !alreadyAssigned && handleBulkToggleStudent(user.id)}
                      disabled={alreadyAssigned}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border
                                  text-left transition-all
                                  ${alreadyAssigned
                                    ? 'bg-emerald-500/5 border-emerald-500/15 cursor-default'
                                    : isSelected
                                      ? 'bg-brand-600/10 border-brand-600/30'
                                      : 'bg-dark-800/50 border-dark-700 hover:border-dark-500'
                                  }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
                                        transition-all
                                        ${alreadyAssigned
                                          ? 'bg-emerald-500/20 border-emerald-500'
                                          : isSelected
                                            ? 'bg-brand-600 border-brand-500'
                                            : 'border-dark-600 bg-dark-800'
                                        }`}>
                        {(alreadyAssigned || isSelected) && <Check size={11} className="text-white" />}
                      </div>
                      <div className="w-7 h-7 rounded-full bg-brand-600/20 border border-brand-600/30
                                      flex items-center justify-center shrink-0">
                        <span className="text-brand-400 font-700 text-xs">
                          {user.name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-600 ${alreadyAssigned ? 'text-dark-400' : 'text-white'}`}>
                          {user.name}
                        </p>
                        <p className="text-xs text-dark-500 truncate">{user.email}</p>
                      </div>
                      {alreadyAssigned && (
                        <span className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs shrink-0">
                          Assigned
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Assign button */}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-dark-800">
                <p className="text-sm text-dark-400">
                  <span className="text-white font-600">{bulkSelected.size}</span> students selected
                </p>
                <button
                  onClick={handleBulkAssign}
                  disabled={bulkSelected.size === 0 || bulkSaving}
                  className={`btn-primary ${bulkSelected.size === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  {bulkSaving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Zap size={15} />
                      Assign to {bulkSelected.size} student{bulkSelected.size !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  )
}