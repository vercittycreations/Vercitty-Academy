import { useState, useEffect } from 'react'
import { Search, Check, HelpCircle, Save, X, Plus } from 'lucide-react'
import Modal from './Modal'
import {
  getAllBankQuestions,
  getLessonQuizIds,
  setLessonQuiz,
} from '../../firebase/firestore'

export default function QuizManager({ open, onClose, lesson }) {
  const [allQuestions,  setAllQuestions]  = useState([])
  const [selectedIds,   setSelectedIds]   = useState([])
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [search,        setSearch]        = useState('')

  useEffect(() => {
    if (!open || !lesson?.id) return
    setLoading(true)
    setSearch('')
    Promise.all([
      getAllBankQuestions(),
      getLessonQuizIds(lesson.id),
    ]).then(([questions, ids]) => {
      setAllQuestions(questions)
      setSelectedIds(ids)
      setLoading(false)
    })
  }, [open, lesson?.id])

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    await setLessonQuiz(lesson.id, selectedIds)
    setSaving(false)
    onClose()
  }

  const filtered = allQuestions.filter(q =>
    q.question?.toLowerCase().includes(search.toLowerCase()) ||
    q.topic?.toLowerCase().includes(search.toLowerCase())
  )

  const passNeeded = Math.ceil(selectedIds.length * 0.8)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Attach Quiz — ${lesson?.title || ''}`}
      width="max-w-2xl"
    >
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">

          {/* Info */}
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-brand-600/5 border border-brand-600/15">
            <HelpCircle size={13} className="text-brand-400 shrink-0" />
            <p className="text-xs text-dark-300">
              Select questions from your bank. Students need{' '}
              <span className="text-brand-300 font-600">80%</span> to pass.
              {selectedIds.length > 0 && (
                <span className="text-dark-400"> → {passNeeded}/{selectedIds.length} correct to pass.</span>
              )}
            </p>
          </div>

          {/* No questions in bank */}
          {allQuestions.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-dark-800 border border-dark-700 flex items-center justify-center">
                <HelpCircle size={24} className="text-dark-500" />
              </div>
              <div>
                <p className="text-white font-display font-600 text-sm">Question bank is empty</p>
                <p className="text-dark-400 text-xs mt-1">
                  Go to Question Bank page to add questions first.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Selected count */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-dark-400">
                  <span className="text-white font-600">{selectedIds.length}</span> questions selected
                </span>
                {selectedIds.length > 0 && (
                  <button
                    onClick={() => setSelectedIds([])}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <X size={11} /> Clear all
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search questions or topics..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input pl-8 text-sm"
                />
              </div>

              {/* Questions list */}
              <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
                {filtered.length === 0 ? (
                  <p className="text-center text-dark-500 text-sm py-6">No questions match.</p>
                ) : (
                  filtered.map((q) => {
                    const selected = selectedIds.includes(q.id)
                    return (
                      <button
                        key={q.id}
                        onClick={() => toggleSelect(q.id)}
                        className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border
                                    transition-all duration-150
                                    ${selected
                                      ? 'bg-brand-600/10 border-brand-600/30'
                                      : 'bg-dark-800/40 border-dark-700 hover:border-dark-500'
                                    }`}
                      >
                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center
                                          shrink-0 mt-0.5 transition-all
                                          ${selected
                                            ? 'bg-brand-600 border-brand-500'
                                            : 'border-dark-600 bg-dark-800'
                                          }`}>
                          {selected && <Check size={11} className="text-white" />}
                        </div>

                        {/* Question content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-body leading-snug
                                         ${selected ? 'text-white' : 'text-dark-300'}`}>
                            {q.question}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {q.topic && (
                              <span className="badge bg-dark-700 text-dark-400 border border-dark-600 text-[10px]">
                                {q.topic}
                              </span>
                            )}
                            <span className="text-[10px] text-dark-600">
                              ✓ {q.options?.[q.correctIndex]}
                            </span>
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </>
          )}

          {/* Footer */}
          <div className="flex gap-3 pt-2 border-t border-dark-800">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">
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
              ) : (
                <><Save size={15} /> Save Quiz ({selectedIds.length} questions)</>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}