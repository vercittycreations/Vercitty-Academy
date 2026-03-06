import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, BookOpen, UserCheck, Layers,
  TrendingUp, ArrowRight, GraduationCap, Activity
} from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Spinner from '../../components/ui/Spinner'
import { getAllUsers, getAllCourses } from '../../firebase/firestore'

function StatCard({ icon: Icon, label, value, sub, accent, onClick }) {
  const accents = {
    brand:   'border-brand-600/25   bg-brand-600/5   text-brand-400',
    emerald: 'border-emerald-500/25 bg-emerald-500/5 text-emerald-400',
    amber:   'border-amber-500/25   bg-amber-500/5   text-amber-400',
    purple:  'border-purple-500/25  bg-purple-500/5  text-purple-400',
  }
  return (
    <div
      onClick={onClick}
      className={`card border p-6 flex flex-col gap-4 transition-all duration-200
                  ${accents[accent]}
                  ${onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accents[accent]}`}>
          <Icon size={20} />
        </div>
        {onClick && <ArrowRight size={14} className="text-dark-600" />}
      </div>
      <div>
        <p className="text-3xl font-display font-800 text-white">{value}</p>
        <p className="text-sm text-dark-400 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-dark-600 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

function QuickAction({ icon: Icon, label, description, onClick, accent }) {
  const accents = {
    brand:   'hover:border-brand-600/40   hover:bg-brand-600/5',
    emerald: 'hover:border-emerald-500/40 hover:bg-emerald-500/5',
    amber:   'hover:border-amber-500/40   hover:bg-amber-500/5',
  }
  return (
    <button
      onClick={onClick}
      className={`card w-full text-left p-4 flex items-center gap-4
                  border border-dark-800 transition-all duration-200 ${accents[accent]}`}
    >
      <div className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-dark-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-display font-600 text-white">{label}</p>
        <p className="text-xs text-dark-500 mt-0.5 truncate">{description}</p>
      </div>
      <ArrowRight size={14} className="text-dark-600 shrink-0" />
    </button>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [users,   setUsers]   = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAllUsers(), getAllCourses()]).then(([u, c]) => {
      setUsers(u.filter(x => x.role !== 'admin'))
      setCourses(c)
      setLoading(false)
    })
  }, [])

  if (loading) return <PageWrapper><Spinner text="Loading overview..." /></PageWrapper>

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Activity size={14} className="text-brand-400" />
          <span className="text-xs font-display text-brand-400 uppercase tracking-widest">Admin Panel</span>
        </div>
        <h1 className="page-title">Academy Overview</h1>
        <p className="text-dark-400 text-sm mt-1">
          Manage users, courses, and assignments from here.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          icon={Users}      label="Total Students"   value={users.length}
          sub="Active accounts"  accent="brand"
          onClick={() => navigate('/admin/users')}
        />
        <StatCard
          icon={BookOpen}   label="Total Courses"    value={courses.length}
          sub="Published courses" accent="emerald"
          onClick={() => navigate('/admin/courses')}
        />
        <StatCard
          icon={Layers}     label="Total Lessons"    value="—"
          sub="Across all courses" accent="amber"
        />
        <StatCard
          icon={UserCheck}  label="Assignments"      value="—"
          sub="Course enrollments" accent="purple"
          onClick={() => navigate('/admin/assign')}
        />
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="section-title">Quick Actions</h2>
          <div className="flex-1 h-px bg-dark-800" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickAction
            icon={Users}    label="Manage Users"
            description="Create, edit or remove student accounts"
            onClick={() => navigate('/admin/users')}  accent="brand"
          />
          <QuickAction
            icon={BookOpen} label="Manage Courses"
            description="Add or edit course content and lessons"
            onClick={() => navigate('/admin/courses')} accent="emerald"
          />
          <QuickAction
            icon={UserCheck} label="Assign Courses"
            description="Assign specific courses to students"
            onClick={() => navigate('/admin/assign')}  accent="amber"
          />
        </div>
      </div>

      {/* Recent users */}
      {users.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Recent Students</h2>
            <button
              onClick={() => navigate('/admin/users')}
              className="text-xs text-brand-400 hover:text-brand-300 font-display flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-800">
                  <th className="text-left px-5 py-3 text-xs font-display font-600 text-dark-400 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-display font-600 text-dark-400 uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-display font-600 text-dark-400 uppercase tracking-wider">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 5).map((u, i) => (
                  <tr key={u.id} className={`${i < users.slice(0,5).length - 1 ? 'border-b border-dark-800/50' : ''} hover:bg-dark-800/40 transition-colors`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-brand-600/20 border border-brand-600/30 flex items-center justify-center">
                          <span className="text-brand-400 font-display font-700 text-xs">
                            {u.name?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <span className="text-white font-body">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-dark-400 font-body">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className="badge bg-brand-600/15 text-brand-400 border border-brand-600/20">
                        {u.role || 'user'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}