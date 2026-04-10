import { useState, useEffect } from 'react'
import {
  HelpCircle, Plus, Pencil, Trash2,
  CheckCircle, Search
} from 'lucide-react'
import PageWrapper   from '../../components/layout/PageWrapper'
import Modal         from '../../components/admin/Modal'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import Spinner       from '../../components/ui/Spinner'
import EmptyState    from '../../components/ui/EmptyState'
import {
  getAllBankQuestions,
  createBankQuestion,
  updateBankQuestion,
  deleteBankQuestion,
} from '../../firebase/firestore'

const EMPTY_FORM = {
  question:     '',
  options:      ['', '', '', ''],
  correctIndex: 0,
  topic:        '',
}

export default function QuestionBank() {
  const [questions, setQuestions] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [modal,     setModal]     = useState(false)
  const [editQ,     setEditQ]     = useState(null)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)
  const [deleteId,  setDeleteId]  = useState(null)
  const [deleting,  setDeleting]  = useState(false)
  const [error,     setError]     = useState('')

  const load = () => {
    setLoading(true)
    getAllBankQuestions().then(data => {
      setQuestions(data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditQ(null)
    setForm(EMPTY_FORM)
    setError('')
    setModal(true)
  }
  const openEdit = (q) => {
    setEditQ(q)
    setForm({
      question:     q.question,
      options:      [...q.options],
      correctIndex: q.correctIndex,
      topic:        q.topic || '',
    })
    setError('')
    setModal(true)
  }
  const closeModal = () => { setModal(false); setError('') }

  const updateOption = (i, val) =>
    setForm(f => {
      const options = [...f.options]
      options[i] = val
      return { ...f, options }
    })

  const handleSave = async () => {
    if (!form.question.trim()) return setError('Question text is required.')
    for (let i = 0; i < 4; i++) {
      if (!form.options[i]?.trim())
        return setError(`Option ${String.fromCharCode(65 + i)} is empty.`)
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        question:     form.question.trim(),
        options:      form.options.map(o => o.trim()),
        correctIndex: form.correctIndex,
        topic:        form.topic.trim(),
      }
      if (editQ) {
        await updateBankQuestion(editQ.id, payload)
        setQuestions(qs => qs.map(q => q.id === editQ.id ? { ...q, ...payload } : q))
      } else {
        const ref = await createBankQuestion(payload)
        setQuestions(qs => [{ id: ref.id, ...payload }, ...qs])
      }
      closeModal()
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    await deleteBankQuestion(deleteId)
    setQuestions(qs => qs.filter(q => q.id !== deleteId))
    setDeleteId(null)
    setDeleting(false)
  }

  const filtered = questions.filter(q =>
    q.question?.toLowerCase().includes(search.toLowerCase()) ||
    q.topic?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PageWrapper>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Question Bank</h1>
          <p className="text-dark-400 text-sm mt-1">
            Create questions here, then attach them to any lesson quiz.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary shrink-0">
          <Plus size={16} /> Add Question
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search questions or topics..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-9"
        />
      </div>

      {/* Stats */}
      {!loading && questions.length > 0 && (
        <div className="flex items-center gap-3 mb-5 text-xs text-dark-500">
          <span className="badge bg-brand-600/15 text-brand-400 border border-brand-600/20">
            {questions.length} total questions
          </span>
          {search && (
            <span className="text-dark-500">
              Showing {filtered.length} results
            </span>
          )}
        </div>
      )}

      {loading ? (
        <Spinner text="Loading question bank..." />
      ) : questions.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="No questions yet"
          description="Add questions to your bank, then attach them to lesson quizzes."
          action={
            <button onClick={openCreate} className="btn-primary">
              <Plus size={15} /> Add Question
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No results"
          description="Try a different search term."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((q, i) => (
            <div
              key={q.id}
              className="card border border-dark-800 p-5 hover:border-dark-700 transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Number */}
                <div className="w-8 h-8 rounded-lg bg-brand-600/10 border border-brand-600/20
                                flex items-center justify-center shrink-0">
                  <span className="text-xs font-display font-700 text-brand-400">
                    {i + 1}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <p className="text-white font-display font-600 text-sm leading-snug">
                      {q.question}
                    </p>
                  </div>

                  {q.topic && (
                    <span className="badge bg-dark-800 text-dark-400 border border-dark-700 text-xs mb-3 inline-block">
                      {q.topic}
                    </span>
                  )}

                  {/* Options grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-3">
                    {q.options.map((opt, oi) => (
                      <div
                        key={oi}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs
                                    ${oi === q.correctIndex
                                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                                      : 'bg-dark-800/50 border border-dark-800'
                                    }`}
                      >
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                                          shrink-0 text-[10px] font-display font-700
                                          ${oi === q.correctIndex
                                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                                            : 'border-dark-600 text-dark-500'
                                          }`}>
                          {oi === q.correctIndex
                            ? <CheckCircle size={10} />
                            : String.fromCharCode(65 + oi)
                          }
                        </span>
                        <span className={oi === q.correctIndex ? 'text-emerald-300' : 'text-dark-400'}>
                          {opt}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(q)}
                    className="btn-secondary px-3 py-1.5 text-xs"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => setDeleteId(q.id)}
                    className="btn-danger px-3 py-1.5 text-xs"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modal}
        onClose={closeModal}
        title={editQ ? 'Edit Question' : 'Add New Question'}
        width="max-w-xl"
      >
        <div className="space-y-5">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-600/10 border border-red-600/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="label">Question</label>
            <textarea
              rows={3}
              className="input resize-none"
              placeholder="e.g. What does CSS stand for?"
              value={form.question}
              onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Topic / Tag (optional)</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. HTML Basics, CSS, JavaScript..."
              value={form.topic}
              onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">
              Options — click circle to mark correct answer
            </label>
            <div className="space-y-2.5">
              {form.options.map((opt, oi) => {
                const isCorrect = form.correctIndex === oi
                return (
                  <div key={oi} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, correctIndex: oi }))}
                      className={`w-9 h-9 rounded-full border-2 flex items-center justify-center
                                  shrink-0 transition-all duration-150
                                  ${isCorrect
                                    ? 'border-emerald-500 bg-emerald-500/15'
                                    : 'border-dark-600 hover:border-dark-400 bg-dark-800'
                                  }`}
                    >
                      {isCorrect ? (
                        <CheckCircle size={16} className="text-emerald-400" />
                      ) : (
                        <span className="text-xs font-display font-700 text-dark-500">
                          {String.fromCharCode(65 + oi)}
                        </span>
                      )}
                    </button>

                    <input
                      type="text"
                      className={`input flex-1 ${isCorrect ? 'border-emerald-500/40 bg-emerald-500/5' : ''}`}
                      placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                      value={opt}
                      onChange={e => updateOption(oi, e.target.value)}
                    />

                    {isCorrect && (
                      <span className="text-xs text-emerald-400 font-600 shrink-0 w-16">
                        ✓ Correct
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={closeModal} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex-1 justify-center"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : editQ ? 'Save Changes' : 'Add to Bank'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Question"
        message="This question will be removed from the bank and any quizzes using it."
      />
    </PageWrapper>
  )
}