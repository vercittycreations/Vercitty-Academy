import { useState, useEffect } from 'react'
import { Search, Clock, Shield } from 'lucide-react'
import PageWrapper  from '../../components/layout/PageWrapper'
import Spinner      from '../../components/ui/Spinner'
import EmptyState   from '../../components/ui/EmptyState'
import { getAllLoginHistory, getAllUsers } from '../../firebase/firestore'

function formatDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

function timeAgo(ts) {
  if (!ts) return ''
  const d    = ts.toDate ? ts.toDate() : new Date(ts)
  const secs = Math.floor((Date.now() - d.getTime()) / 1000)
  if (secs < 60)   return `${secs}s ago`
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

export default function StudentLoginHistory() {
  const [history,  setHistory]  = useState([])
  const [users,    setUsers]    = useState({})
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    Promise.all([getAllLoginHistory(100), getAllUsers()]).then(([logs, us]) => {
      const userMap = {}
      us.forEach(u => { userMap[u.id] = u })
      setHistory(logs)
      setUsers(userMap)
      setLoading(false)
    })
  }, [])

  const filtered = history.filter(log => {
    const q   = search.toLowerCase()
    const user = users[log.userId]
    return (
      (user?.name  || '').toLowerCase().includes(q) ||
      (log.email   || '').toLowerCase().includes(q)
    )
  })

  const todayCount = history.filter(log => {
    if (!log.loginAt) return false
    const d = log.loginAt.toDate ? log.loginAt.toDate() : new Date()
    return d.toDateString() === new Date().toDateString()
  }).length

  const uniqueUsers = new Set(history.map(l => l.userId)).size

  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="page-title">Login History</h1>
        <p className="text-dark-400 text-sm mt-1 font-body">
          Track when students access the platform.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Logins today',    value: todayCount,    color: 'brand'   },
          { label: 'Unique students', value: uniqueUsers,   color: 'emerald' },
          { label: 'Total recorded',  value: history.length, color: 'amber'  },
        ].map(({ label, value, color }) => {
          const cls = {
            brand:   'text-brand-400',
            emerald: 'text-emerald-400',
            amber:   'text-amber-400',
          }[color]
          return (
            <div key={label} className="card border border-dark-800 px-5 py-4">
              <p className={`text-3xl font-display font-700 ${cls}`}>{value}</p>
              <p className="text-xs text-dark-400 font-body mt-0.5">{label}</p>
            </div>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
        <input
          type="text" placeholder="Search by name or email..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="input pl-9"
        />
      </div>

      {loading ? (
        <Spinner text="Loading login history..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No login history"
          description="Login events will appear here after students sign in."
        />
      ) : (
        <div className="card border border-dark-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-800 bg-dark-900/60">
                  <th className="text-left px-5 py-3 text-xs font-display font-600
                                 text-dark-400 uppercase tracking-wider">Student</th>
                  <th className="text-left px-5 py-3 text-xs font-display font-600
                                 text-dark-400 uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-display font-600
                                 text-dark-400 uppercase tracking-wider">Login Time</th>
                  <th className="text-left px-5 py-3 text-xs font-display font-600
                                 text-dark-400 uppercase tracking-wider">When</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => {
                  const user = users[log.userId]
                  return (
                    <tr
                      key={log.id}
                      className={`${i < filtered.length - 1 ? 'border-b border-dark-800/50' : ''}
                                   hover:bg-dark-800/30 transition-colors`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-brand-600/20 border border-brand-600/30
                                          flex items-center justify-center shrink-0">
                            <span className="text-brand-400 font-display font-700 text-xs">
                              {(user?.name || log.name || '?')[0]?.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-white font-body font-500">
                            {user?.name || log.name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-dark-400 font-body text-sm">
                        {log.email || user?.email || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-dark-300 font-body text-sm font-mono text-xs">
                        {formatDate(log.loginAt)}
                      </td>
                      <td className="px-5 py-3.5 text-dark-500 font-body text-xs">
                        {timeAgo(log.loginAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}