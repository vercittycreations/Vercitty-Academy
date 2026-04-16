// ─────────────────────────────────────────────────────────────────────────────
// ReadingModuleManager.jsx  — Admin: attach reading modules to a lesson
// Usage: <ReadingModuleManager open={bool} onClose={fn} lesson={lesson} />
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, BookOpen, HelpCircle, X, ChevronDown, ChevronUp } from 'lucide-react'
import Modal from './Modal'
import {
  getReadingModulesForLesson,
  createReadingModule,
  updateReadingModule,
  deleteReadingModule,
} from '../../firebase/firestore.batches'

const EMPTY_MODULE = { title: '', content: '', questions: [{ q: '', answer: '' }], order: 1 }

export function ReadingModuleManager({ open, onClose, lesson }) {
  const [modules,  setModules]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [editIdx,  setEditIdx]  = useState(null)
  const [form,     setForm]     = useState(EMPTY_MODULE)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (!open || !lesson?.id) return
    setLoading(true)
    setEditIdx(null)
    getReadingModulesForLesson(lesson.id).then(data => {
      setModules(data)
      setLoading(false)
    })
  }, [open, lesson?.id])

  const startNew = () => {
    setForm({ ...EMPTY_MODULE, order: modules.length + 1 })
    setEditIdx('new')
    setError('')
  }

  const startEdit = (mod) => {
    setForm({
      title:     mod.title     || '',
      content:   mod.content   || '',
      questions: mod.questions?.length ? mod.questions : [{ q: '', answer: '' }],
      order:     mod.order     || 1,
    })
    setEditIdx(mod.id)
    setError('')
  }

  const addQuestion = () =>
    setForm(f => ({ ...f, questions: [...f.questions, { q: '', answer: '' }] }))

  const removeQuestion = (i) =>
    setForm(f => ({ ...f, questions: f.questions.filter((_, idx) => idx !== i) }))

  const updateQuestion = (i, field, val) =>
    setForm(f => ({
      ...f,
      questions: f.questions.map((q, idx) => idx === i ? { ...q, [field]: val } : q)
    }))

  const handleSave = async () => {
    if (!form.title.trim())   return setError('Title required.')
    if (!form.content.trim()) return setError('Content required.')
    const validQs = form.questions.filter(q => q.q?.trim())
    if (validQs.length === 0) return setError('At least 1 question add karo.')
    setSaving(true); setError('')
    try {
      const payload = {
        lessonId:  lesson.id,
        title:     form.title.trim(),
        content:   form.content.trim(),
        questions: validQs,
        order:     Number(form.order) || 1,
      }
      if (editIdx === 'new') {
        const ref = await createReadingModule(payload)
        setModules(m => [...m, { id: ref.id, ...payload }].sort((a, b) => a.order - b.order))
      } else {
        await updateReadingModule(editIdx, payload)
        setModules(m => m.map(x => x.id === editIdx ? { ...x, ...payload } : x))
      }
      setEditIdx(null)
    } catch (err) {
      setError(err.message || 'Kuch galat hua.')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    await deleteReadingModule(id)
    setModules(m => m.filter(x => x.id !== id))
  }

  return (
    <Modal open={open} onClose={onClose}
           title={`Reading Modules — ${lesson?.title || ''}`}
           width="max-w-2xl">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-brand-600/5 border border-brand-600/15">
            <BookOpen size={13} className="text-brand-400 shrink-0"/>
            <p className="text-xs text-dark-300">
              Student padhe aur questions answer kare. Ek lesson me multiple modules ho sakte hain.
            </p>
          </div>

          {modules.map(mod => (
            <div key={mod.id} className="card border border-dark-800 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-display font-600 text-sm">{mod.title}</p>
                  <p className="text-dark-500 text-xs mt-0.5">
                    {mod.questions?.length || 0} question{mod.questions?.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button onClick={() => startEdit(mod)} className="btn-secondary px-3 py-1.5 text-xs">
                  Edit
                </button>
                <button onClick={() => handleDelete(mod.id)} className="btn-danger px-3 py-1.5 text-xs">
                  <Trash2 size={12}/>
                </button>
              </div>
            </div>
          ))}

          {editIdx && (
            <div className="card border border-brand-600/30 p-4 space-y-3">
              {error && (
                <div className="px-3 py-2 rounded-lg bg-red-600/10 border border-red-600/20 text-red-400 text-xs">
                  {error}
                </div>
              )}
              <div>
                <label className="label">Module Title</label>
                <input type="text" className="input" placeholder="e.g. HTML Basics — Notes"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}/>
              </div>
              <div>
                <label className="label">Reading Content</label>
                <textarea rows={8} className="input resize-none font-mono text-xs leading-relaxed"
                  placeholder="Notes content yahan likho... plain text ya basic formatting."
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}/>
                <p className="text-xs text-dark-600 mt-1">Student yahan content padhega, phir questions answer karega.</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Questions</label>
                  <button onClick={addQuestion} className="btn-secondary px-3 py-1 text-xs">
                    <Plus size={11}/> Add
                  </button>
                </div>
                <div className="space-y-3">
                  {form.questions.map((q, i) => (
                    <div key={i} className="space-y-2 p-3 rounded-lg bg-dark-800/50 border border-dark-700">
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-dark-500 font-600 mt-2.5 w-4 shrink-0">{i + 1}.</span>
                        <input type="text" className="input flex-1" placeholder="Question..."
                          value={q.q}
                          onChange={e => updateQuestion(i, 'q', e.target.value)}/>
                        {form.questions.length > 1 && (
                          <button onClick={() => removeQuestion(i)}
                            className="mt-1 text-dark-600 hover:text-red-400 transition-colors shrink-0">
                            <X size={13}/>
                          </button>
                        )}
                      </div>
                      <div className="pl-6">
                        <input type="text" className="input text-xs" placeholder="Expected answer / hint (optional)"
                          value={q.answer}
                          onChange={e => updateQuestion(i, 'answer', e.target.value)}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setEditIdx(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Saving...</>
                    : <><Save size={14}/> Save Module</>
                  }
                </button>
              </div>
            </div>
          )}

          {!editIdx && (
            <button onClick={startNew} className="btn-secondary w-full justify-center">
              <Plus size={14}/> New Reading Module
            </button>
          )}

          <div className="flex justify-end pt-1">
            <button onClick={onClose} className="btn-primary px-6">Done</button>
          </div>
        </div>
      )}
    </Modal>
  )
}