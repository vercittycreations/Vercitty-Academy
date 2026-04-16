import { useState, useEffect } from 'react'
import {
  Plus, Pencil, Trash2, Users, Play,
  Pause, Calendar, ChevronDown, ChevronUp,
  Check, Search, X, Award, ExternalLink
} from 'lucide-react'
import PageWrapper   from '../../components/layout/PageWrapper'
import Modal         from '../../components/admin/Modal'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import Spinner       from '../../components/ui/Spinner'
import EmptyState    from '../../components/ui/EmptyState'
import {
  createBatch, updateBatch, deleteBatch, getAllBatches,
  getBatchMembers, addUserToBatch, removeUserFromBatch,
  setCertificateLink, getAllCertificatesForBatch,
} from '../../firebase/firestore.batches'
import { getAllUsers, getAllCourses } from '../../firebase/firestore'

const EMPTY_FORM = { name: '', courseId: '', startDate: '', endDate: '' }

function fmtDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function toInputDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toISOString().split('T')[0]
}

function calcBatchInfo(startDate, endDate) {
  if (!startDate) return { currentDay: 0, totalDays: 0 }
  const start = startDate.toDate ? startDate.toDate() : new Date(startDate)
  const end   = endDate   ? (endDate.toDate ? endDate.toDate() : new Date(endDate)) : null
  const total = end ? Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24))) : 30
  const cur   = Math.max(1, Math.min(
    Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    total
  ))
  return { currentDay: cur, totalDays: total }
}

export default function ManageBatches() {
  const [batches,      setBatches]      = useState([])
  const [courses,      setCourses]      = useState([])
  const [allUsers,     setAllUsers]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [modal,        setModal]        = useState(false)
  const [editBatch,    setEditBatch]    = useState(null)
  const [form,         setForm]         = useState(EMPTY_FORM)
  const [saving,       setSaving]       = useState(false)
  const [deleteId,     setDeleteId]     = useState(null)
  const [deleting,     setDeleting]     = useState(false)
  const [error,        setError]        = useState('')
  const [expanded,     setExpanded]     = useState(null)  // 'members' | 'certs'
  const [expandedId,   setExpandedId]   = useState(null)
  const [members,      setMembers]      = useState({})
  const [memberLoading,setMemberLoading] = useState(null)
  const [toggling,     setToggling]     = useState({})
  const [memberSearch, setMemberSearch] = useState('')
  const [certs,        setCerts]        = useState({})  // batchId -> {userId: link}
  const [certLinks,    setCertLinks]    = useState({})  // temp input state
  const [certSaving,   setCertSaving]   = useState({})

  const load = async () => {
    setLoading(true)
    const [b, c, u] = await Promise.all([getAllBatches(), getAllCourses(), getAllUsers()])
    setBatches(b)
    setCourses(c)
    setAllUsers(u.filter(x => x.role !== 'admin'))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditBatch(null); setForm(EMPTY_FORM); setError(''); setModal(true) }
  const openEdit   = (b) => {
    setEditBatch(b)
    setForm({ name: b.name || '', courseId: b.courseId || '', startDate: toInputDate(b.startDate), endDate: toInputDate(b.endDate) })
    setError(''); setModal(true)
  }
  const closeModal = () => { setModal(false); setError('') }

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Batch name required.')
    if (!form.courseId)    return setError('Course select karo.')
    if (!form.startDate)   return setError('Start date required.')
    if (!form.endDate)     return setError('End date required.')
    if (form.endDate <= form.startDate) return setError('End date start date ke baad honi chahiye.')
    setSaving(true); setError('')
    try {
      const payload = {
        name:      form.name.trim(),
        courseId:  form.courseId,
        startDate: new Date(form.startDate),
        endDate:   new Date(form.endDate),
      }
      if (editBatch) {
        await updateBatch(editBatch.id, payload)
        setBatches(bs => bs.map(b => b.id === editBatch.id ? { ...b, ...payload } : b))
      } else {
        const ref = await createBatch(payload)
        setBatches(bs => [{ id: ref.id, ...payload, status: 'draft' }, ...bs])
      }
      closeModal()
    } catch (err) { setError(err.message || 'Kuch galat hua.') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    await deleteBatch(deleteId)
    setBatches(bs => bs.filter(b => b.id !== deleteId))
    setDeleteId(null); setDeleting(false)
  }

  const handleStatusToggle = async (batch) => {
    const s = batch.status === 'active' ? 'paused' : 'active'
    await updateBatch(batch.id, { status: s })
    setBatches(bs => bs.map(b => b.id === batch.id ? { ...b, status: s } : b))
  }

  const handleExpand = async (batchId, tab) => {
    if (expandedId === batchId && expanded === tab) { setExpanded(null); setExpandedId(null); return }
    setExpandedId(batchId); setExpanded(tab); setMemberSearch('')
    if (tab === 'members' && !members[batchId]) {
      setMemberLoading(batchId)
      const ids = await getBatchMembers(batchId)
      setMembers(m => ({ ...m, [batchId]: ids }))
      setMemberLoading(null)
    }
    if (tab === 'certs' && !certs[batchId]) {
      const list = await getAllCertificatesForBatch(batchId)
      const map  = {}
      list.forEach(c => { map[c.userId] = c.driveLink })
      setCerts(c => ({ ...c, [batchId]: map }))
    }
  }

  const handleToggleMember = async (batchId, userId) => {
    const key     = `${batchId}_${userId}`
    const current = members[batchId] || []
    const has     = current.includes(userId)
    setToggling(t => ({ ...t, [key]: true }))
    if (has) { await removeUserFromBatch(batchId, userId); setMembers(m => ({ ...m, [batchId]: m[batchId].filter(id => id !== userId) })) }
    else     { await addUserToBatch(batchId, userId);     setMembers(m => ({ ...m, [batchId]: [...(m[batchId] || []), userId] })) }
    setToggling(t => ({ ...t, [key]: false }))
  }

  const handleSaveCert = async (batchId, userId) => {
    const key  = `${batchId}_${userId}`
    const link = certLinks[key] || ''
    setCertSaving(s => ({ ...s, [key]: true }))
    await setCertificateLink(batchId, userId, link)
    setCerts(c => ({ ...c, [batchId]: { ...(c[batchId] || {}), [userId]: link } }))
    setCertSaving(s => ({ ...s, [key]: false }))
  }

  const statusColors = {
    draft:  'bg-dark-800 text-dark-400 border-dark-700',
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    paused: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    done:   'bg-brand-600/15 text-brand-400 border-brand-600/25',
  }

  return (
    <PageWrapper>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Manage Batches</h1>
          <p className="text-dark-400 text-sm mt-1">Batches create karo, dates set karo, students assign karo.</p>
        </div>
        <button onClick={openCreate} className="btn-primary shrink-0"><Plus size={16}/> New Batch</button>
      </div>

      {loading ? <Spinner text="Loading batches..."/> : batches.length === 0 ? (
        <EmptyState icon={Calendar} title="No batches yet"
          action={<button onClick={openCreate} className="btn-primary"><Plus size={15}/> New Batch</button>}/>
      ) : (
        <div className="space-y-3">
          {batches.map(batch => {
            const course  = courses.find(c => c.id === batch.courseId)
            const { currentDay, totalDays } = batch.status === 'active'
              ? calcBatchInfo(batch.startDate, batch.endDate)
              : { currentDay: 0, totalDays: calcBatchInfo(batch.startDate, batch.endDate).totalDays }
            const isMemExp  = expandedId === batch.id && expanded === 'members'
            const isCertExp = expandedId === batch.id && expanded === 'certs'
            const batchMems = members[batch.id] || []
            const batchCerts= certs[batch.id]   || {}
            const filteredUsers = allUsers.filter(u =>
              u.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
              u.email?.toLowerCase().includes(memberSearch.toLowerCase())
            )

            return (
              <div key={batch.id} className="card border border-dark-800 overflow-hidden">
                {/* Row */}
                <div className="flex items-center gap-3 px-4 sm:px-5 py-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <p className="text-white font-display font-600 text-sm">{batch.name}</p>
                      <span className={`badge text-xs border ${statusColors[batch.status] || statusColors.draft}`}>
                        {batch.status || 'draft'}
                      </span>
                      {batch.status === 'active' && (
                        <span className="badge bg-brand-600/15 text-brand-400 border border-brand-600/25 text-xs">
                          Day {currentDay}/{totalDays}
                        </span>
                      )}
                    </div>
                    <p className="text-dark-500 text-xs">
                      {course?.title || 'No course'} &nbsp;·&nbsp;
                      {fmtDate(batch.startDate)} → {fmtDate(batch.endDate)} &nbsp;·&nbsp;
                      {totalDays} days &nbsp;·&nbsp;
                      {batchMems.length} student{batchMems.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button onClick={() => handleStatusToggle(batch)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-600 border transition-all
                        ${batch.status === 'active'
                          ? 'bg-amber-500/10 border-amber-500/25 text-amber-400 hover:bg-amber-500/20'
                          : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20'
                        }`}>
                      {batch.status === 'active' ? <><Pause size={11}/> Pause</> : <><Play size={11}/> Activate</>}
                    </button>
                    <button onClick={() => openEdit(batch)} className="btn-secondary px-3 py-1.5 text-xs"><Pencil size={12}/></button>
                    <button onClick={() => setDeleteId(batch.id)} className="btn-danger px-3 py-1.5 text-xs"><Trash2 size={12}/></button>
                    <button onClick={() => handleExpand(batch.id, 'members')}
                      className={`btn-secondary px-3 py-1.5 text-xs ${isMemExp ? 'border-brand-600/40 text-brand-400' : ''}`}>
                      <Users size={12}/> <span className="hidden sm:inline">Students</span>
                      {isMemExp ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}
                    </button>
                    <button onClick={() => handleExpand(batch.id, 'certs')}
                      className={`btn-secondary px-3 py-1.5 text-xs ${isCertExp ? 'border-brand-600/40 text-brand-400' : ''}`}>
                      <Award size={12}/> <span className="hidden sm:inline">Certificates</span>
                      {isCertExp ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}
                    </button>
                  </div>
                </div>

                {/* Members panel */}
                {isMemExp && (
                  <div className="border-t border-dark-800 px-4 sm:px-5 py-4">
                    <p className="text-xs font-display font-700 text-dark-300 mb-3">Assign students</p>
                    <div className="relative mb-3 max-w-xs">
                      <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none"/>
                      <input type="text" placeholder="Search..." value={memberSearch}
                        onChange={e => setMemberSearch(e.target.value)} className="input pl-8 text-sm"/>
                    </div>
                    {memberLoading === batch.id ? (
                      <div className="flex items-center gap-2 py-3 text-dark-500 text-sm">
                        <span className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"/>
                        Loading...
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                        {filteredUsers.map(user => {
                          const inBatch = batchMems.includes(user.id)
                          const key     = `${batch.id}_${user.id}`
                          return (
                            <button key={user.id} onClick={() => handleToggleMember(batch.id, user.id)}
                              disabled={toggling[key]}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all
                                ${inBatch ? 'bg-brand-600/10 border-brand-600/30' : 'bg-dark-800/50 border-dark-700 hover:border-dark-500'}
                                ${toggling[key] ? 'opacity-50' : ''}`}>
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
                                ${inBatch ? 'bg-brand-600 border-brand-500' : 'border-dark-600'}`}>
                                {toggling[key]
                                  ? <span className="w-2.5 h-2.5 border border-white/40 border-t-white rounded-full animate-spin"/>
                                  : inBatch ? <Check size={10} className="text-white"/> : null
                                }
                              </div>
                              <div className="min-w-0">
                                <p className={`text-xs font-600 truncate ${inBatch ? 'text-brand-300' : 'text-white'}`}>{user.name}</p>
                                <p className="text-[10px] text-dark-500 truncate">{user.email}</p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Certificates panel */}
                {isCertExp && (
                  <div className="border-t border-dark-800 px-4 sm:px-5 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Award size={13} className="text-brand-400"/>
                      <p className="text-xs font-display font-700 text-dark-300">
                        Certificate links — har student ka Google Drive link daalo
                      </p>
                    </div>
                    <p className="text-xs text-dark-500 mb-3">
                      Student ko last day pe yeh link dikhega. Drive link public ya "anyone with link" hona chahiye.
                    </p>
                    {batchMems.length === 0 ? (
                      <p className="text-xs text-dark-600 py-2">Pehle students assign karo.</p>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {batchMems.map(uid => {
                          const user     = allUsers.find(u => u.id === uid)
                          const key      = `${batch.id}_${uid}`
                          const existing = batchCerts[uid] || ''
                          const inputVal = certLinks[key] !== undefined ? certLinks[key] : existing
                          return (
                            <div key={uid} className="flex items-center gap-3 p-3 rounded-lg bg-dark-800/50 border border-dark-700">
                              <div className="w-8 h-8 rounded-full bg-brand-600/20 border border-brand-600/30
                                              flex items-center justify-center shrink-0">
                                <span className="text-brand-400 font-700 text-xs">
                                  {user?.name?.[0]?.toUpperCase() || '?'}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-600 text-white truncate">{user?.name || uid}</p>
                                <input
                                  type="url"
                                  className="input mt-1 text-xs py-1.5"
                                  placeholder="https://drive.google.com/..."
                                  value={inputVal}
                                  onChange={e => setCertLinks(l => ({ ...l, [key]: e.target.value }))}
                                />
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {existing && (
                                  <a href={existing} target="_blank" rel="noopener noreferrer"
                                    className="text-brand-400 hover:text-brand-300 transition-colors">
                                    <ExternalLink size={13}/>
                                  </a>
                                )}
                                <button
                                  onClick={() => handleSaveCert(batch.id, uid)}
                                  disabled={certSaving[key]}
                                  className="btn-primary px-3 py-1.5 text-xs"
                                >
                                  {certSaving[key]
                                    ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                                    : <Check size={11}/>
                                  }
                                </button>
                              </div>
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

      <Modal open={modal} onClose={closeModal} title={editBatch ? 'Edit Batch' : 'Create New Batch'}>
        <div className="space-y-4">
          {error && <div className="px-4 py-3 rounded-lg bg-red-600/10 border border-red-600/20 text-red-400 text-sm">{error}</div>}
          <div>
            <label className="label">Batch Name</label>
            <input type="text" className="input" placeholder="e.g. Batch 1 — April 2025"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/>
          </div>
          <div>
            <label className="label">Course</label>
            <select className="input" value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}>
              <option value="">Select course...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date</label>
              <input type="date" className="input" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}/>
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" className="input" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}/>
            </div>
          </div>
          {form.startDate && form.endDate && form.endDate > form.startDate && (
            <p className="text-xs text-brand-400 bg-brand-600/8 border border-brand-600/20 rounded-lg px-3 py-2">
              Batch duration: {Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / (1000*60*60*24))} days
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={closeModal} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Saving...</> : editBatch ? 'Save Changes' : 'Create Batch'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        loading={deleting} title="Delete Batch" message="Batch aur uske sab members delete ho jayenge."/>
    </PageWrapper>
  )
}