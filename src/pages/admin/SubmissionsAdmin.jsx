import { useState, useEffect } from 'react'
import {
  CheckCircle, Clock, ExternalLink, Search,
  MessageSquare, RefreshCw, AlertCircle, ClipboardList
} from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Spinner     from '../../components/ui/Spinner'
import EmptyState  from '../../components/ui/EmptyState'
import { getAllBatches, getAllSubmissions, reviewSubmission } from '../../firebase/firestore.batches'
import { getAllUsers } from '../../firebase/firestore'

function fmtDate(ts) {
  if (!ts) return '—'
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return '—' }
}

export default function SubmissionsAdmin() {
  const [batches,     setBatches]     = useState([])
  const [users,       setUsers]       = useState({})
  const [submissions, setSubmissions] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [selBatch,    setSelBatch]    = useState('')
  const [subLoading,  setSubLoading]  = useState(false)
  const [search,      setSearch]      = useState('')
  const [filter,      setFilter]      = useState('all')
  const [feedbackMap, setFeedbackMap] = useState({})
  const [reviewing,   setReviewing]   = useState({})
  const [expanded,    setExpanded]    = useState(null)

  // Load batches + users once
  useEffect(() => {
    setError('')
    Promise.all([getAllBatches(), getAllUsers()])
      .then(([b, u]) => {
        setBatches(b)
        const map = {}
        u.forEach(x => { map[x.id] = x })
        setUsers(map)
        if (b.length > 0) setSelBatch(b[0].id)
        setLoading(false)
      })
      .catch(err => {
        setError('Data load nahi hua: ' + (err.message || 'Unknown error'))
        setLoading(false)
      })
  }, [])

  // Load submissions when batch changes
  useEffect(() => {
    if (!selBatch) { setSubmissions([]); return }
    setSubLoading(true)
    setError('')
    setSubmissions([])
    getAllSubmissions(selBatch)
      .then(data => {
        setSubmissions(data)
        setSubLoading(false)
      })
      .catch(err => {
        setError('Submissions load nahi hue. Firestore index check karo.')
        setSubLoading(false)
        console.error('Submissions fetch error:', err)
      })
  }, [selBatch])

  const handleReview = async (sub) => {
    const key = sub.id
    setReviewing(r => ({ ...r, [key]: true }))
    try {
      await reviewSubmission(sub.id, feedbackMap[key] || '')
      setSubmissions(prev =>
        prev.map(s => s.id === sub.id
          ? { ...s, status: 'reviewed', feedback: feedbackMap[key] || '' }
          : s
        )
      )
      setExpanded(null)
    } catch (err) {
      console.error('Review error:', err)
    } finally {
      setReviewing(r => ({ ...r, [key]: false }))
    }
  }

  const filtered = submissions.filter(sub => {
    const user = users[sub.userId]
    const q    = search.toLowerCase()
    const matchSearch = !q ||
      (user?.name  || '').toLowerCase().includes(q) ||
      (user?.email || '').toLowerCase().includes(q) ||
      String(sub.dayNumber).includes(q)
    const matchFilter = filter === 'all' || sub.status === filter
    return matchSearch && matchFilter
  })

  const pendingCount  = submissions.filter(s => s.status !== 'reviewed').length
  const reviewedCount = submissions.filter(s => s.status === 'reviewed').length

  if (loading) return <PageWrapper><Spinner text="Loading submissions panel..."/></PageWrapper>

  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="page-title">Assignment Submissions</h1>
        <p className="text-dark-400 text-sm mt-1">
          Student submissions review karo, feedback do.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-600/10 border border-red-600/20 mb-6">
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5"/>
          <div>
            <p className="text-sm text-red-400 font-display font-600">{error}</p>
            <p className="text-xs text-red-500/70 mt-0.5">
              Firestore Console → Indexes → Create composite index on submissions (batchId ASC + submittedAt DESC)
            </p>
          </div>
        </div>
      )}

      {/* No batches */}
      {batches.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No batches found"
          description="Pehle admin panel mein ek batch create karo, phir submissions yahan dikhenge."
        />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total',    value: submissions.length, color: 'text-brand-400'   },
              { label: 'Pending',  value: pendingCount,       color: 'text-amber-400'   },
              { label: 'Reviewed', value: reviewedCount,      color: 'text-emerald-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card border border-dark-800 px-5 py-4">
                <p className={`text-2xl font-display font-700 ${color}`}>{value}</p>
                <p className="text-xs text-dark-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5 flex-wrap">
            <select
              className="input max-w-xs"
              value={selBatch}
              onChange={e => setSelBatch(e.target.value)}
            >
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            <div className="flex gap-2 flex-wrap">
              {['all', 'pending', 'reviewed'].map(f => (
                <button key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-xs font-display font-600 border
                              transition-all capitalize
                              ${filter === f
                                ? 'bg-brand-600 text-white border-brand-600'
                                : 'bg-dark-800 border-dark-700 text-dark-400 hover:text-white'
                              }`}
                >
                  {f}
                  {f === 'pending'  && pendingCount  > 0 && (
                    <span className="ml-1.5 bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded text-[10px]">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none"/>
              <input type="text" className="input pl-8"
                placeholder="Name, email, day no..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <button
              onClick={() => {
                setSubLoading(true)
                getAllSubmissions(selBatch).then(d => {
                  setSubmissions(d); setSubLoading(false)
                })
              }}
              className="btn-secondary px-3 py-2 text-xs shrink-0"
              title="Refresh"
            >
              <RefreshCw size={13}/>
            </button>
          </div>

          {/* Submissions list */}
          {subLoading ? (
            <Spinner text="Submissions load ho rahi hain..."/>
          ) : submissions.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Is batch mein koi submission nahi"
              description="Jab students assignment submit karenge, yahan dikhega."
            />
          ) : filtered.length === 0 ? (
            <div className="card border border-dark-800 p-8 text-center">
              <p className="text-dark-400 text-sm">No results for current filter/search.</p>
            </div>
          ) : (
            <div className="card border border-dark-800 overflow-hidden">
              {filtered.map((sub, i) => {
                const user  = users[sub.userId]
                const isExp = expanded === sub.id
                return (
                  <div key={sub.id}
                    className={`${i < filtered.length - 1 ? 'border-b border-dark-800/60' : ''}`}>

                    {/* Row */}
                    <div className="flex items-center gap-3 px-4 sm:px-5 py-4">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-brand-600/20 border border-brand-600/30
                                      flex items-center justify-center shrink-0">
                        <span className="text-brand-400 font-display font-700 text-xs">
                          {(user?.name || sub.userName || '?')[0]?.toUpperCase()}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white font-display font-600 text-sm">
                            {user?.name || sub.userName || 'Unknown Student'}
                          </p>
                          <span className="badge bg-brand-600/15 text-brand-400 border border-brand-600/20 text-xs">
                            Day {sub.dayNumber || '?'}
                          </span>
                          <span className={`badge text-xs border ${
                            sub.status === 'reviewed'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                          }`}>
                            {sub.status === 'reviewed'
                              ? <><CheckCircle size={9} className="inline mr-1"/>Reviewed</>
                              : <><Clock size={9} className="inline mr-1"/>Pending</>
                            }
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {sub.workLink ? (
                            <a href={sub.workLink} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-brand-400 hover:text-brand-300
                                         flex items-center gap-1 truncate max-w-xs">
                              {sub.workLink.length > 45
                                ? sub.workLink.slice(0, 45) + '...'
                                : sub.workLink
                              }
                              <ExternalLink size={9} className="shrink-0"/>
                            </a>
                          ) : (
                            <span className="text-xs text-dark-600">No link submitted</span>
                          )}
                          <span className="text-xs text-dark-600 shrink-0">
                            {fmtDate(sub.submittedAt)}
                          </span>
                        </div>

                        {/* Existing feedback */}
                        {sub.feedback && sub.status === 'reviewed' && (
                          <p className="text-xs text-dark-400 mt-0.5 italic">
                            "{sub.feedback}"
                          </p>
                        )}
                      </div>

                      {/* Review button */}
                      <button
                        onClick={() => setExpanded(isExp ? null : sub.id)}
                        className={`btn-secondary px-3 py-1.5 text-xs shrink-0 ${
                          sub.status !== 'reviewed'
                            ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                            : ''
                        }`}
                      >
                        <MessageSquare size={12}/>
                        <span className="hidden sm:inline ml-1">
                          {sub.status === 'reviewed' ? 'Edit' : 'Review'}
                        </span>
                      </button>
                    </div>

                    {/* Expanded review panel */}
                    {isExp && (
                      <div className="px-4 sm:px-5 pb-4 pt-3 border-t border-dark-800/60
                                      bg-dark-900/40">
                        <label className="label mb-2">
                          Feedback for {user?.name || 'student'} (optional)
                        </label>
                        <textarea
                          rows={3}
                          className="input resize-none mb-3"
                          placeholder="Student ko feedback do... ya blank chhod ke sirf mark reviewed karo"
                          value={feedbackMap[sub.id] !== undefined
                            ? feedbackMap[sub.id]
                            : (sub.feedback || '')
                          }
                          onChange={e => setFeedbackMap(m => ({ ...m, [sub.id]: e.target.value }))}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setExpanded(null)}
                            className="btn-secondary px-4 py-2 text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleReview(sub)}
                            disabled={reviewing[sub.id]}
                            className="btn-primary px-5 py-2 text-xs"
                          >
                            {reviewing[sub.id] ? (
                              <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Saving...</>
                            ) : (
                              <><CheckCircle size={12}/> Mark as Reviewed</>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </PageWrapper>
  )
}