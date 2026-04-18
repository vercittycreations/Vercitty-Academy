import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, BookOpen, HelpCircle, X, GripVertical } from 'lucide-react'
import PageWrapper   from '../../components/layout/PageWrapper'
import Modal         from '../../components/admin/Modal'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import Spinner       from '../../components/ui/Spinner'
import EmptyState    from '../../components/ui/EmptyState'
import {
  getAllReadingPages,
  createStandaloneModule,
  updateStandaloneModule,
  deleteStandaloneModule,
} from '../../firebase/firestore.batches'

const EMPTY_FORM = {
  title:       '',
  description: '',
  content:     '',
  questions:   [{ q: '', hint: '' }, { q: '', hint: '' }, { q: '', hint: '' }],
  order:       1,
  dayNumber:   '',
}

export default function ManageReadingPages() {
  const [pages,    setPages]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [editPage, setEditPage] = useState(null)
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [saving,   setSaving]   = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    getAllReadingPages().then(data => { setPages(data); setLoading(false) })
  }, [])

  const openCreate = () => {
    setEditPage(null)
    setForm({ ...EMPTY_FORM, order: pages.length + 1 })
    setError(''); setModal(true)
  }
  const openEdit = (p) => {
    setEditPage(p)
    setForm({
      title:       p.title       || '',
      description: p.description || '',
      content:     p.content     || '',
      questions:   p.questions?.length ? p.questions : EMPTY_FORM.questions,
      order:       p.order       || 1,
      dayNumber:   p.dayNumber   || '',
    })
    setError(''); setModal(true)
  }
  const closeModal = () => { setModal(false); setError('') }

  const addQuestion = () =>
    setForm(f => ({ ...f, questions: [...f.questions, { q: '', hint: '' }] }))

  const removeQuestion = (i) =>
    setForm(f => ({ ...f, questions: f.questions.filter((_, idx) => idx !== i) }))

  const updateQuestion = (i, field, val) =>
    setForm(f => ({
      ...f,
      questions: f.questions.map((q, idx) => idx === i ? { ...q, [field]: val } : q)
    }))

  const handleSave = async () => {
    if (!form.title.trim())   return setError('Title required.')
    if (!form.content.trim()) return setError('Reading content required.')
    const validQs = form.questions.filter(q => q.q?.trim())
    if (validQs.length === 0) return setError('Kam se kam 1 question add karo.')
    setSaving(true); setError('')
    try {
      const payload = {
        title:       form.title.trim(),
        description: form.description.trim(),
        content:     form.content.trim(),
        questions:   validQs,
        order:       Number(form.order) || pages.length + 1,
        dayNumber:   form.dayNumber ? Number(form.dayNumber) : null,
      }
      if (editPage) {
        await updateStandaloneModule(editPage.id, payload)
        setPages(ps => ps.map(p => p.id === editPage.id ? { ...p, ...payload } : p)
          .sort((a, b) => (a.order || 0) - (b.order || 0)))
      } else {
        const ref = await createStandaloneModule(payload)
        setPages(ps => [...ps, { id: ref.id, ...payload }]
          .sort((a, b) => (a.order || 0) - (b.order || 0)))
      }
      closeModal()
    } catch (err) { setError(err.message || 'Kuch galat hua.') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    await deleteStandaloneModule(deleteId)
    setPages(ps => ps.filter(p => p.id !== deleteId))
    setDeleteId(null); setDeleting(false)
  }

  return (
    <PageWrapper>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Reading Pages</h1>
          <p className="text-dark-400 text-sm mt-1">
            Students ke liye reading content aur questions add karo.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary shrink-0">
          <Plus size={16}/> New Reading Page
        </button>
      </div>

      {loading ? <Spinner text="Loading reading pages..."/> :
       pages.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No reading pages yet"
          description="Reading content create karo — student padhega aur questions answer karega."
          action={<button onClick={openCreate} className="btn-primary"><Plus size={15}/> Create Page</button>}
        />
      ) : (
        <div className="space-y-3">
          {pages.map(page => (
            <div key={page.id} className="card border border-dark-800 p-4 sm:p-5
                                          hover:border-dark-700 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-600/15 border border-brand-600/20
                                flex items-center justify-center shrink-0">
                  <BookOpen size={18} className="text-brand-400"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-white font-display font-600 text-sm">{page.title}</h3>
                    {page.dayNumber && (
                      <span className="badge bg-brand-600/15 text-brand-400 border border-brand-600/20 text-xs">
                        Day {page.dayNumber}
                      </span>
                    )}
                    <span className="badge bg-dark-800 text-dark-400 border border-dark-700 text-xs">
                      {page.questions?.length || 0} Q
                    </span>
                  </div>
                  {page.description && (
                    <p className="text-dark-400 text-xs">{page.description}</p>
                  )}
                  <p className="text-dark-600 text-xs mt-1 line-clamp-2">
                    {page.content?.slice(0, 120)}{page.content?.length > 120 ? '...' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(page)} className="btn-secondary px-3 py-1.5 text-xs">
                    <Pencil size={12}/> Edit
                  </button>
                  <button onClick={() => setDeleteId(page.id)} className="btn-danger px-3 py-1.5 text-xs">
                    <Trash2 size={12}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={modal} onClose={closeModal}
             title={editPage ? 'Edit Reading Page' : 'New Reading Page'}
             width="max-w-2xl">
        <div className="space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-600/10 border border-red-600/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Page Title</label>
              <input type="text" className="input"
                placeholder="e.g. HTML Basics"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}/>
            </div>
            <div>
              <label className="label">Day Number (optional)</label>
              <input type="number" min="1" className="input"
                placeholder="e.g. 2"
                value={form.dayNumber}
                onChange={e => setForm(f => ({ ...f, dayNumber: e.target.value }))}/>
            </div>
          </div>

          <div>
            <label className="label">Short Description (optional)</label>
            <input type="text" className="input"
              placeholder="Brief intro student ko dikhega"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}/>
          </div>

          <div>
            <label className="label">
              Reading Content
              <span className="ml-2 text-dark-600 font-body normal-case tracking-normal">
                — student yeh padhega
              </span>
            </label>
            <textarea
              rows={10}
              className="input resize-none leading-relaxed"
              placeholder={`Yahan pura reading content likho...\n\nExample:\nHTML stands for HyperText Markup Language. It is the standard language used to create web pages.\n\nHTML uses elements called tags to define different types of content. For example, <h1> is used for headings and <p> is used for paragraphs.`}
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            />
            <p className="text-xs text-dark-600 mt-1">
              Plain text likho. Student is content ko padhega, phir neeche questions answer karega.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0 flex items-center gap-2">
                <HelpCircle size={12} className="text-brand-400"/>
                Questions ({form.questions.filter(q => q.q?.trim()).length} active)
              </label>
              <button onClick={addQuestion} className="btn-secondary px-3 py-1 text-xs">
                <Plus size={11}/> Add
              </button>
            </div>

            <div className="space-y-3">
              {form.questions.map((q, i) => (
                <div key={i} className="p-3 rounded-xl bg-dark-800/60 border border-dark-700 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-display font-700 text-brand-400 mt-2.5 w-6 shrink-0 text-center">
                      Q{i + 1}
                    </span>
                    <input
                      type="text"
                      className="input flex-1"
                      placeholder={`Question ${i + 1}...`}
                      value={q.q}
                      onChange={e => updateQuestion(i, 'q', e.target.value)}
                    />
                    {form.questions.length > 1 && (
                      <button onClick={() => removeQuestion(i)}
                        className="mt-1 text-dark-600 hover:text-red-400 transition-colors shrink-0">
                        <X size={13}/>
                      </button>
                    )}
                  </div>
                  <div className="pl-8">
                    <input
                      type="text"
                      className="input text-xs"
                      placeholder="Expected answer / hint (optional — student ko show nahi hoga)"
                      value={q.hint || ''}
                      onChange={e => updateQuestion(i, 'hint', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-dark-600 mt-2">
              Student ko open-ended jawab dena hoga. Hint sirf admin reference ke liye hai.
            </p>
          </div>

          <div>
            <label className="label">Display Order</label>
            <input type="number" min="1" className="input" style={{ maxWidth: '100px' }}
              value={form.order}
              onChange={e => setForm(f => ({ ...f, order: e.target.value }))}/>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={closeModal} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Saving...</>
                : editPage ? 'Save Changes' : 'Create Page'
              }
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Reading Page"
        message="Yeh reading page aur students ke sab answers delete ho jayenge."
      />
    </PageWrapper>
  )
}
