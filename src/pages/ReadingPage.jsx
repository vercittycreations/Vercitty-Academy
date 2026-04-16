import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, BookOpen, ChevronRight, CheckCircle,
  Send, Trophy, RotateCcw
} from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'
import Spinner     from '../components/ui/Spinner'
import EmptyState  from '../components/ui/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useBatch } from '../hooks/useBatch'
import {
  getAllReadingPages,
  saveReadingResponse,
  getMyReadingResponses,
} from '../firebase/firestore.batches'

// Single reading module view — read content, answer questions
function ReadingSection({ page, userId, savedAnswers, onComplete }) {
  const [answers,   setAnswers]   = useState(savedAnswers || {})
  const [submitted, setSubmitted] = useState(!!savedAnswers)
  const [saving,    setSaving]    = useState(false)

  const allAnswered = page.questions.every((_, i) => (answers[i] || '').trim())

  const handleSubmit = async () => {
    if (!allAnswered || saving) return
    setSaving(true)
    await saveReadingResponse(userId, page.id, answers)
    setSubmitted(true)
    setSaving(false)
    onComplete(page.id)
  }

  return (
    <div className="space-y-6">
      {/* Reading content */}
      <div className="card border border-dark-800 p-5 sm:p-7">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={16} className="text-brand-400 shrink-0"/>
          <h2 className="text-lg font-display font-700 text-white">{page.title}</h2>
          {page.dayNumber && (
            <span className="badge bg-brand-600/15 text-brand-400 border border-brand-600/20 text-xs ml-auto shrink-0">
              Day {page.dayNumber}
            </span>
          )}
        </div>
        {page.description && (
          <p className="text-dark-400 text-sm mb-4">{page.description}</p>
        )}
        <div className="prose-reading">
          {page.content.split('\n').map((para, i) =>
            para.trim() ? (
              <p key={i} className="text-dark-200 text-sm leading-relaxed mb-3 last:mb-0">
                {para}
              </p>
            ) : (
              <div key={i} className="h-2"/>
            )
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="card border border-dark-800 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-brand-600/15 flex items-center justify-center shrink-0">
            <span className="text-xs font-display font-700 text-brand-400">Q</span>
          </div>
          <h3 className="text-sm font-display font-700 text-white">Answer these questions</h3>
          {submitted && (
            <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle size={12}/> Completed
            </span>
          )}
        </div>

        <div className="space-y-5">
          {page.questions.map((q, i) => (
            <div key={i}>
              <p className="text-sm font-display font-600 text-white mb-2">
                <span className="text-brand-400 mr-2">{i + 1}.</span>
                {q.q}
              </p>
              <textarea
                rows={3}
                disabled={submitted}
                value={answers[i] || ''}
                onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))}
                placeholder={submitted ? '' : 'Apna jawab yahan likho...'}
                className={`w-full rounded-xl px-4 py-3 text-sm font-body resize-none
                            focus:outline-none focus:ring-2 focus:ring-brand-500
                            focus:border-transparent transition-all leading-relaxed border
                            ${submitted
                              ? 'bg-dark-800/50 border-dark-700 text-dark-300 cursor-default'
                              : (answers[i] || '').trim()
                                ? 'bg-dark-800 border-brand-600/30 text-dark-100'
                                : 'bg-dark-800 border-dark-700 text-dark-100 placeholder-dark-500'
                            }`}
              />
            </div>
          ))}
        </div>

        {!submitted ? (
          <div className="mt-5 flex items-center gap-3">
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
            {!allAnswered && (
              <p className="text-xs text-dark-500">
                {page.questions.filter((_, i) => !(answers[i] || '').trim()).length} question{' '}
                remaining
              </p>
            )}
          </div>
        ) : (
          <div className="mt-5 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle size={15} className="text-emerald-400 shrink-0"/>
            <p className="text-sm font-display font-600 text-emerald-300">
              Answers saved! Ab next section padho.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ReadingPage() {
  const navigate             = useNavigate()
  const { user }             = useAuth()
  const { batch, currentDay } = useBatch(user?.uid)

  const [pages,     setPages]     = useState([])
  const [responses, setResponses] = useState({})
  const [loading,   setLoading]   = useState(true)
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    if (!user?.uid) return
    Promise.all([getAllReadingPages(), getMyReadingResponses(user.uid)])
      .then(([pgs, resps]) => {
        // Filter: show only unlocked pages (based on dayNumber)
        const visible = pgs.filter(p => !p.dayNumber || !currentDay || p.dayNumber <= currentDay)
        setPages(visible)
        setResponses(resps)
        // Auto-jump to first incomplete
        const firstIncomplete = visible.findIndex(p => !resps[p.id])
        if (firstIncomplete !== -1) setActiveIdx(firstIncomplete)
        setLoading(false)
      })
  }, [user?.uid, currentDay])

  const handleComplete = useCallback((pageId) => {
    setResponses(r => ({ ...r, [pageId]: true }))
    // Auto-advance to next
    const next = pages.findIndex(p => p.id === pageId)
    if (next < pages.length - 1) {
      setTimeout(() => setActiveIdx(next + 1), 500)
    }
  }, [pages])

  const completedCount = pages.filter(p => responses[p.id]).length
  const allDone        = completedCount === pages.length && pages.length > 0

  if (loading) return <PageWrapper><Spinner text="Loading reading modules..."/></PageWrapper>

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors text-sm ml-0">
          <ArrowLeft size={15}/> Dashboard
        </button>
        <div className="w-px h-5 bg-dark-700"/>
        <h1 className="page-title">Reading Modules</h1>
        {pages.length > 0 && (
          <span className="ml-auto text-xs text-dark-500 font-body">
            {completedCount}/{pages.length} done
          </span>
        )}
      </div>

      {pages.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No reading modules yet"
          description="Admin ne abhi koi reading content add nahi kiya."
        />
      ) : (
        <div className="max-w-3xl">
          {/* Progress + module tabs */}
          <div className="card border border-dark-800 p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-display font-600 text-dark-300">
                {completedCount} of {pages.length} completed
              </p>
              {allDone && (
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-display font-600">
                  <Trophy size={13}/> All done!
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all duration-700
                            ${allDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-brand-500 to-brand-400'}`}
                style={{ width: `${pages.length > 0 ? Math.round((completedCount / pages.length) * 100) : 0}%` }}
              />
            </div>

            {/* Module selector */}
            <div className="flex flex-wrap gap-2">
              {pages.map((page, i) => {
                const done    = !!responses[page.id]
                const active  = activeIdx === i
                return (
                  <button
                    key={page.id}
                    onClick={() => setActiveIdx(i)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                                font-display font-600 border transition-all
                                ${active
                                  ? 'bg-brand-600 border-brand-500 text-white'
                                  : done
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                    : 'bg-dark-800 border-dark-700 text-dark-400 hover:text-white hover:border-dark-500'
                                }`}
                  >
                    {done && <CheckCircle size={10}/>}
                    {page.title}
                    {page.dayNumber && (
                      <span className="opacity-60 text-[10px]">D{page.dayNumber}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Active reading section */}
          {pages[activeIdx] && (
            <>
              <ReadingSection
                key={pages[activeIdx].id}
                page={pages[activeIdx]}
                userId={user?.uid}
                savedAnswers={responses[pages[activeIdx].id]?.answers || null}
                onComplete={handleComplete}
              />

              {/* Next / Prev navigation */}
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
                  disabled={activeIdx === 0}
                  className="btn-secondary px-4 py-2 text-sm disabled:opacity-30"
                >
                  ← Previous
                </button>
                <span className="text-xs text-dark-500">
                  {activeIdx + 1} / {pages.length}
                </span>
                {activeIdx < pages.length - 1 ? (
                  <button
                    onClick={() => setActiveIdx(i => i + 1)}
                    disabled={!responses[pages[activeIdx].id]}
                    className={`btn-primary px-4 py-2 text-sm
                                ${!responses[pages[activeIdx].id] ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    Next <ChevronRight size={14}/>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/dashboard')}
                    disabled={!allDone}
                    className={`btn-primary px-4 py-2 text-sm
                                ${!allDone ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <Trophy size={14}/> Finish
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </PageWrapper>
  )
}