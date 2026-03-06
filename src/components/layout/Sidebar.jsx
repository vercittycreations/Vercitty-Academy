import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, Users, GraduationCap,
  ListVideo, UserCheck, LogOut, ChevronRight, Shield
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { logoutUser } from '../../firebase/auth'

const userLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
]

const adminLinks = [
  { to: '/admin',           icon: LayoutDashboard, label: 'Overview'       },
  { to: '/admin/users',     icon: Users,           label: 'Users'          },
  { to: '/admin/courses',   icon: BookOpen,        label: 'Courses'        },
  { to: '/admin/assign',    icon: UserCheck,       label: 'Assign Courses' },
]

export default function Sidebar() {
  const { profile, isAdmin } = useAuth()
  const navigate = useNavigate()
  const links = isAdmin ? adminLinks : userLinks

  const handleLogout = async () => {
    await logoutUser()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-dark-900 border-r border-dark-800 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-dark-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
            <GraduationCap size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-display font-700 text-sm leading-tight">Vercitty</p>
            <p className="text-brand-400 font-display text-xs">Academy</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {isAdmin && (
          <p className="px-4 mb-2 text-xs font-display font-600 text-dark-500 uppercase tracking-widest">
            Admin
          </p>
        )}
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin' || to === '/dashboard'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}

        {!isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-display font-600 text-dark-500 uppercase tracking-widest">
                My Learning
              </p>
            </div>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <BookOpen size={16} />
              <span>My Courses</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-dark-800 space-y-1">
        {isAdmin && (
          <div className="px-4 py-2 flex items-center gap-2 mb-1">
            <Shield size={12} className="text-brand-400" />
            <span className="text-xs font-display text-brand-400">Admin Mode</span>
          </div>
        )}
        <div className="px-4 py-2 rounded-lg bg-dark-800 flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-brand-600/30 border border-brand-600/40 flex items-center justify-center">
            <span className="text-brand-400 font-display font-700 text-xs">
              {profile?.name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-display font-600 truncate">{profile?.name || 'User'}</p>
            <p className="text-dark-400 text-xs truncate">{profile?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-600/10">
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}