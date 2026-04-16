import { useState, useEffect } from 'react'
import { CheckCircle, BookOpen, ChevronRight, Send } from 'lucide-react'
import {
  getReadingModulesForLesson,
  saveReadingResponse,
  getReadingResponse,
} from '../../firebase/firestore.batches'

function ReadingModule({ mod, userId, onComplete }) {
  const [answers,   setAnswers]   = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!userId || !mod?.id) return
    getReadingResponse(userId, mod.id).then(prev => {
      if (prev) {
        setAnswers(prev.answers || {})
        setSubmitted(true)
      }
      setLoading(false)
    })
  }, [userId, mod?.id])

  const allAnswered = mod.questions.every((_, i) => answers[i]?.trim())

  const handleSubmit = async () => {
    if (!allAnswered || saving) return
    setSaving(true)
    await saveReadingResponse(userId, mod.id, answers)
    setSubmitted(true)
    setSaving(false)
    onComplete?.(mod.id)
  }

  if (loading) return (
    <div className="flex items-center gap-2 py-4 text-dark-500 text-sm">
      <span className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"/>
      Loading...
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Reading content */}
      <div className="bg-dark-800/60 border border-dark-700 rounded-xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={14} className="text-brand-400 shrink-0"/>
          <h3 className="text-sm font-display font-700 text-white">{mod.title}</h3>
          {submitted && <CheckCircle size={13} className="text-emerald-400 ml-auto shrink-0"/>}
        </div>
        <div className="prose-sm text-dark-200 leading-relaxed text-sm whitespace-pre-wrap font-body">
          {mod.content}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <p className="text-xs font-display font-700 text-dark-400 uppercase tracking-wider">
          Answer these questions
        </p>
        {mod.questions.map((q, i) => (
          <div key={i} className="space-y-2">
            <p className="text-sm font-display font-600 text-white">
              <span className="text-brand-400 mr-2">Q{i + 1}.</span>
              {q.q}
            </p>
            <textarea
              rows={3}
              disabled={submitted}
              value={answers[i] || ''}
              onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))}
              placeholder={submitted ? '' : 'Apna jawab yahan likho...'}
              className={`w-full bg-dark-800 border rounded-lg px-4 py-3
                          text-dark-100 placeholder-dark-500 text-sm font-body resize-none
                          focus:outline-none focus:ring-2 focus:ring-brand-500
                          focus:border-transparent transition-all leading-relaxed
                          ${submitted
                            ? 'border-dark-700 opacity-70 cursor-default'
                            : answers[i]?.trim()
                              ? 'border-brand-600/40'
                              : 'border-dark-700'
                          }`}
            />
          </div>
        ))}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || saving}
          className={`btn-primary ${(!allAnswered || saving) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {saving
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Saving...</>
            : <><Send size={14}/> Submit Answers</>
          }
        </button>
      ) : (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle size={15} className="text-emerald-400 shrink-0"/>
          <p className="text-sm font-display font-600 text-emerald-300">
            Completed! Answers saved.
          </p>
        </div>
      )}
    </div>
  )
}

export default function ReadingModuleViewer({ lessonId, userId }) {
  const [modules,   setModules]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [expanded,  setExpanded]  = useState(null)
  const [completed, setCompleted] = useState(new Set())

  useEffect(() => {
    if (!lessonId) return
    getReadingModulesForLesson(lessonId).then(data => {
      setModules(data)
      if (data.length > 0) setExpanded(data[0].id)
      setLoading(false)
    })
  }, [lessonId])

  const handleComplete = (modId) => {
    setCompleted(c => new Set([...c, modId]))
    const idx  = modules.findIndex(m => m.id === modId)
    const next = modules[idx + 1]
    if (next) setExpanded(next.id)
  }

  if (loading) return null
  if (modules.length === 0) return null

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <BookOpen size={15} className="text-brand-400 shrink-0"/>
        <h3 className="text-sm font-display font-700 text-white">Reading Modules</h3>
        <span className="text-xs text-dark-500 ml-auto">
          {completed.size}/{modules.length} complete
        </span>
      </div>

      {modules.map(mod => {
        const isExpanded  = expanded === mod.id
        const isDone      = completed.has(mod.id)
        return (
          <div key={mod.id}
            className={`border rounded-xl overflow-hidden transition-all ${
              isDone ? 'border-emerald-500/20' : 'border-dark-800'
            }`}>
            <button
              onClick={() => setExpanded(isExpanded ? null : mod.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-dark-800/40 transition-colors"
            >
              {isDone
                ? <CheckCircle size={15} className="text-emerald-400 shrink-0"/>
                : <BookOpen    size={15} className="text-dark-500 shrink-0"/>
              }
              <span className={`flex-1 text-sm font-display font-600 ${isDone ? 'text-dark-300' : 'text-white'}`}>
                {mod.title}
              </span>
              <span className="text-xs text-dark-600 shrink-0 mr-1">
                {mod.questions?.length} Q
              </span>
              {isExpanded
                ? <ChevronRight size={13} className="text-dark-500 shrink-0 rotate-90 transition-transform"/>
                : <ChevronRight size={13} className="text-dark-500 shrink-0 transition-transform"/>
              }
            </button>
            {isExpanded && (
              <div className="px-4 pb-5 pt-2 border-t border-dark-800">
                <ReadingModule
                  mod={mod}
                  userId={userId}
                  onComplete={handleComplete}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}