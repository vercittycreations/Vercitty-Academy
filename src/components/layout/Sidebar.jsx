import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, Users,
  GraduationCap, UserCheck, LogOut,
  Shield, Menu, X, HelpCircle, Download
} from 'lucide-react'
import { useAuth }    from '../../context/AuthContext'
import { logoutUser } from '../../firebase/auth'

const userLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard', icon: BookOpen,        label: 'My Courses' },
  { to: '/report',    icon: Download,        label: 'Progress Report' },
]

const adminLinks = [
  { to: '/admin',            icon: LayoutDashboard, label: 'Overview'       },
  { to: '/admin/users',      icon: Users,           label: 'Users'          },
  { to: '/admin/courses',    icon: BookOpen,        label: 'Courses'        },
  { to: '/admin/assign',     icon: UserCheck,       label: 'Assign Courses' },
  { to: '/admin/questions',  icon: HelpCircle,      label: 'Question Bank'  },
]

export default function Sidebar() {
  const { profile, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const links = isAdmin ? adminLinks : userLinks

  const handleLogout = async () => {
    await logoutUser()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-dark-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
            <GraduationCap size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-display font-700 text-sm leading-tight">Vercitty</p>
            <p className="text-brand-400 font-display text-xs">Academy</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-dark-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
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
            key={to + label}
            to={to}
            end={to === '/admin' || to === '/dashboard'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
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
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-600/10"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-dark-900 border-r border-dark-800 flex-col z-40">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-dark-900 border border-dark-700
                   rounded-lg flex items-center justify-center text-dark-300 hover:text-white
                   hover:border-dark-500 transition-all shadow-lg"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 bg-dark-900 border-r border-dark-800 flex flex-col h-full shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}