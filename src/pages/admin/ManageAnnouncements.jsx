import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Megaphone, Pin } from 'lucide-react'
import PageWrapper   from '../../components/layout/PageWrapper'
import Modal         from '../../components/admin/Modal'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import Spinner       from '../../components/ui/Spinner'
import EmptyState    from '../../components/ui/EmptyState'
import {
  createAnnouncement, updateAnnouncement, deleteAnnouncement, getAllAnnouncements
} from '../../firebase/firestore.batches'
import { getAllBatches } from '../../firebase/firestore.batches'

const EMPTY_FORM = { title: '', body: '', batchId: '', pinned: false }

function timeAgo(ts) {
  if (!ts) return ''
  const d    = ts.toDate ? ts.toDate() : new Date(ts)
  const secs = Math.floor((Date.now() - d.getTime()) / 1000)
  if (secs < 60)   return `${secs}s ago`
  if (secs < 3600)  return `${Math.floor(secs/60)}m ago`
  if (secs < 86400) return `${Math.floor(secs/3600)}h ago`
  return `${Math.floor(secs/86400)}d ago`
}

export default function ManageAnnouncements() {
  const [items,     setItems]     = useState([])
  const [batches,   setBatches]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [editItem,  setEditItem]  = useState(null)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)
  const [deleteId,  setDeleteId]  = useState(null)
  const [deleting,  setDeleting]  = useState(false)
  const [error,     setError]     = useState('')

  const load = async () => {
    setLoading(true)
    const [a, b] = await Promise.all([getAllAnnouncements(), getAllBatches()])
    setItems(a)
    setBatches(b)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditItem(null); setForm(EMPTY_FORM); setError(''); setModal(true) }
  const openEdit   = (a) => {
    setEditItem(a)
    setForm({ title: a.title, body: a.body || '', batchId: a.batchId || '', pinned: !!a.pinned })
    setError(''); setModal(true)
  }
  const closeModal = () => { setModal(false); setError('') }

  const handleSave = async () => {
    if (!form.title.trim()) return setError('Title required.')
    if (!form.body.trim())  return setError('Message body required.')
    setSaving(true); setError('')
    try {
      const payload = {
        title:   form.title.trim(),
        body:    form.body.trim(),
        batchId: form.batchId || null,
        pinned:  form.pinned,
      }
      if (editItem) {
        await updateAnnouncement(editItem.id, payload)
        setItems(items.map(a => a.id === editItem.id ? { ...a, ...payload } : a))
      } else {
        const ref = await createAnnouncement(payload)
        setItems([{ id: ref.id, ...payload, createdAt: null }, ...items])
      }
      closeModal()
    } catch (err) {
      setError(err.message || 'Kuch galat hua.')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    await deleteAnnouncement(deleteId)
    setItems(items.filter(a => a.id !== deleteId))
    setDeleteId(null); setDeleting(false)
  }

  const getBatchName = (batchId) => {
    if (!batchId) return 'All students'
    return batches.find(b => b.id === batchId)?.name || 'Unknown batch'
  }

  return (
    <PageWrapper>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="text-dark-400 text-sm mt-1">
            Students ko notices aur updates bhejo.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary shrink-0">
          <Plus size={16}/> New Announcement
        </button>
      </div>

      {loading ? (
        <Spinner text="Loading announcements..."/>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          description="Apna pehla announcement likho."
          action={<button onClick={openCreate} className="btn-primary"><Plus size={15}/> New</button>}
        />
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className={`card border overflow-hidden ${
              item.pinned ? 'border-brand-600/30' : 'border-dark-800'
            }`}>
              <div className="flex items-start gap-3 p-4 sm:p-5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  item.pinned
                    ? 'bg-brand-600/15 border border-brand-600/25'
                    : 'bg-dark-800 border border-dark-700'
                }`}>
                  {item.pinned
                    ? <Pin size={14} className="text-brand-400"/>
                    : <Megaphone size={14} className="text-dark-400"/>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-white font-display font-600 text-sm">{item.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-dark-500">{getBatchName(item.batchId)}</span>
                        <span className="text-dark-700">·</span>
                        <span className="text-xs text-dark-600">{timeAgo(item.createdAt)}</span>
                        {item.pinned && (
                          <span className="badge bg-brand-600/10 text-brand-400 border border-brand-600/20 text-xs">
                            Pinned
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => openEdit(item)} className="btn-secondary px-3 py-1.5 text-xs">
                        <Pencil size={12}/>
                      </button>
                      <button onClick={() => setDeleteId(item.id)} className="btn-danger px-3 py-1.5 text-xs">
                        <Trash2 size={12}/>
                      </button>
                    </div>
                  </div>
                  <p className="text-dark-300 text-sm mt-2 leading-relaxed">{item.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={closeModal}
             title={editItem ? 'Edit Announcement' : 'New Announcement'}>
        <div className="space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-600/10 border border-red-600/20 text-red-400 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="label">Title</label>
            <input type="text" className="input" placeholder="e.g. Assignment deadline extended"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}/>
          </div>
          <div>
            <label className="label">Message</label>
            <textarea rows={4} className="input resize-none" placeholder="Pura message likho..."
              value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}/>
          </div>
          <div>
            <label className="label">Batch (optional)</label>
            <select className="input" value={form.batchId}
              onChange={e => setForm(f => ({ ...f, batchId: e.target.value }))}>
              <option value="">All students</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <p className="text-xs text-dark-600 mt-1">Blank = sab students ko dikhe</p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.pinned}
              onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))}
              className="w-4 h-4 rounded"/>
            <span className="text-sm text-dark-300">Pin this announcement (top pe dikhega)</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={closeModal} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Saving...</>
                : editItem ? 'Save Changes' : 'Post Announcement'
              }
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Announcement"
        message="Yeh announcement permanently delete ho jayega."
      />
    </PageWrapper>
  )
}