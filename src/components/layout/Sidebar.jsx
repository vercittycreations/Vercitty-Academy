import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, Users, GraduationCap,
  UserCheck, LogOut, Shield, Menu, X,
  HelpCircle, TrendingUp, Download, Activity, Clock,
  Megaphone, ClipboardList, Calendar, BookMarked
} from 'lucide-react'
import { useAuth }    from '../../context/AuthContext'
import { logoutUser } from '../../firebase/auth'

const adminLinks = [
  { to: '/admin',               label: 'Overview',       icon: LayoutDashboard },
  { to: '/admin/users',         label: 'Users',          icon: Users           },
  { to: '/admin/courses',       label: 'Courses',        icon: BookOpen        },
  { to: '/admin/batches',       label: 'Batches',        icon: Calendar        },
  { to: '/admin/assign',        label: 'Assign Courses', icon: UserCheck       },
  { to: '/admin/announcements', label: 'Announcements',  icon: Megaphone       },
  { to: '/admin/submissions',   label: 'Submissions',    icon: ClipboardList   },
  { to: '/admin/reading',       label: 'Reading Pages',  icon: BookMarked      },
  { to: '/admin/questions',     label: 'Question Bank',  icon: HelpCircle      },
  { to: '/admin/progress',      label: 'Progress',       icon: TrendingUp      },
  { to: '/admin/activity',      label: 'Activity',       icon: Activity        },
  { to: '/admin/logins',        label: 'Login History',  icon: Clock           },
]

const userLinks = [
  { to: '/dashboard',   label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/reading',     label: 'Reading',         icon: BookMarked      },
  { to: '/assignments', label: 'Assignments',     icon: ClipboardList   },
  { to: '/report',      label: 'Progress Report', icon: Download        },
]

export default function Sidebar() {
  const { profile, isAdmin } = useAuth()
  const navigate             = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const links = isAdmin ? adminLinks : userLinks

  const handleLogout = async () => { await logoutUser(); navigate('/login') }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-dark-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
            <GraduationCap size={16} className="text-white"/>
          </div>
          <div>
            <p className="text-white font-display font-700 text-sm leading-tight">EduCrek</p>
            <p className="text-brand-400 font-display text-[10px]">Academy</p>
          </div>
        </div>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden text-dark-400 hover:text-white">
          <X size={16}/>
        </button>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {isAdmin && (
          <p className="px-3 mb-1.5 text-[10px] font-display font-600 text-dark-600 uppercase tracking-widest">
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
            <Icon size={14}/>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-2 py-3 border-t border-dark-800">
        {isAdmin && (
          <div className="px-3 py-1.5 flex items-center gap-2 mb-1">
            <Shield size={11} className="text-brand-400"/>
            <span className="text-[10px] font-display text-brand-400">Admin Mode</span>
          </div>
        )}
        <div className="px-3 py-2 rounded-lg bg-dark-800 flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 rounded-full bg-brand-600/30 border border-brand-600/40
                          flex items-center justify-center shrink-0">
            <span className="text-brand-400 font-display font-700 text-xs">
              {profile?.name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-display font-600 truncate">{profile?.name || 'User'}</p>
            <p className="text-dark-500 text-[10px] truncate">{profile?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-600/10">
          <LogOut size={14}/>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-60 bg-dark-900
                        border-r border-dark-800 flex-col z-40">
        <SidebarContent/>
      </aside>
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-dark-900 border border-dark-700
                   rounded-lg flex items-center justify-center text-dark-300 hover:text-white
                   hover:border-dark-500 transition-all shadow-lg">
        <Menu size={18}/>
      </button>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}/>
          <aside className="relative w-64 bg-dark-900 border-r border-dark-800 flex flex-col h-full shadow-2xl">
            <SidebarContent/>
          </aside>
        </div>
      )}
    </>
  )
}