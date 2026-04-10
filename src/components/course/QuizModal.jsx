import { useState } from 'react'
import { X, Trophy, XCircle, RotateCcw } from 'lucide-react'

export default function QuizModal({
  questions,
  lessonTitle,
  previousAttempts = 0,
  onSubmit,
  onPass,
  onClose,
}) {
  const [answers,   setAnswers]   = useState(() => Array(questions.length).fill(null))
  const [submitted, setSubmitted] = useState(false)
  const [result,    setResult]    = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const answeredCount = answers.filter(a => a !== null).length
  const allAnswered   = answeredCount === questions.length
  const passNeeded    = Math.ceil(questions.length * 0.8)

  const handleSelect = (qi, oi) => {
    if (submitted) return
    setAnswers(prev => {
      const next = [...prev]
      next[qi] = oi
      return next
    })
  }

  const handleSubmit = async () => {
    if (!allAnswered || submitting) return
    setSubmitting(true)
    const res = await onSubmit(answers)
    setResult(res)
    setSubmitted(true)
    setSubmitting(false)
  }

  const handleRetry = () => {
    setAnswers(Array(questions.length).fill(null))
    setSubmitted(false)
    setResult(null)
  }

  // ── Result screen ──────────────────────────────────────────────
  if (submitted && result) {
    const pct = Math.round((result.score / result.total) * 100)
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-dark-950/85 backdrop-blur-sm" />
        <div className="relative w-full max-w-md card border border-dark-700 shadow-2xl p-8
                        flex flex-col items-center text-center gap-5 animate-slide-up">
          {result.passed ? (
            <>
              <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30
                              flex items-center justify-center">
                <Trophy size={36} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-700 text-white mb-1">Quiz Passed!</h2>
                <p className="text-dark-400 text-sm">
                  You scored <span className="text-emerald-400 font-600">{result.score}/{result.total}</span> ({pct}%)
                </p>
              </div>
              <div className="w-full bg-dark-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10
                              border border-emerald-500/20 w-full justify-center">
                <span className="text-sm font-display font-600 text-emerald-400">
                  ✓ Lesson marked as complete
                </span>
              </div>
              <button
                onClick={() => { onPass(); onClose() }}
                className="btn-primary w-full justify-center py-3"
              >
                Continue Learning
              </button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-red-600/10 border-2 border-red-600/20
                              flex items-center justify-center">
                <XCircle size={36} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-display font-700 text-white mb-1">Not Quite</h2>
                <p className="text-dark-400 text-sm">
                  You scored <span className="text-red-400 font-600">{result.score}/{result.total}</span> ({pct}%)
                </p>
                <p className="text-dark-500 text-xs mt-1">
                  Need {passNeeded}/{result.total} to pass. Rewatch the video and try again.
                </p>
              </div>
              <div className="w-full bg-dark-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex flex-col gap-2.5 w-full">
                <button
                  onClick={onClose}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5
                             rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700
                             text-dark-100 font-display font-600 text-sm transition-all"
                >
                  <RotateCcw size={15} /> Rewatch Video
                </button>
                <button onClick={handleRetry} className="btn-primary w-full justify-center">
                  Try Again
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Questions screen ───────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-dark-950/85 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl card border border-dark-700 shadow-2xl my-6 animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-dark-800">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-display font-700 text-white">Lesson Quiz</h2>
            <p className="text-xs text-dark-400 mt-0.5 truncate">{lessonTitle}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-dark-500 font-body">
              {answeredCount}/{questions.length} answered
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-dark-800 hover:bg-dark-700 flex items-center
                         justify-center text-dark-400 hover:text-white transition-all"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Answer progress bar */}
        <div className="h-1 bg-dark-800">
          <div
            className="h-full bg-brand-500 transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>

        {/* Questions list */}
        <div className="px-6 py-6 space-y-8 max-h-[58vh] overflow-y-auto">
          {questions.map((q, qi) => (
            <div key={qi}>
              <p className="text-white font-display font-600 text-sm mb-3 leading-relaxed">
                <span className="text-brand-400 mr-2 font-700">Q{qi + 1}.</span>
                {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const selected = answers[qi] === oi
                  return (
                    <button
                      key={oi}
                      onClick={() => handleSelect(qi, oi)}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg
                                  border text-sm transition-all duration-150
                                  ${selected
                                    ? 'bg-brand-600/15 border-brand-600/40 text-brand-200'
                                    : 'bg-dark-800/50 border-dark-700 text-dark-300 hover:border-dark-500 hover:text-white'
                                  }`}
                    >
                      <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                        shrink-0 text-[10px] font-display font-700 transition-all
                                        ${selected
                                          ? 'border-brand-500 bg-brand-600 text-white'
                                          : 'border-dark-600 text-dark-500'
                                        }`}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="flex-1 leading-snug">{opt}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-dark-800 flex items-center justify-between gap-4">
          <div className="text-xs text-dark-500 leading-snug">
            <span className="text-dark-400">Pass:</span> {passNeeded}/{questions.length} correct (80%)
            {previousAttempts > 0 && (
              <span className="ml-2 text-dark-600">· Attempt {previousAttempts + 1}</span>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className={`btn-primary shrink-0 transition-all
                        ${!allAnswered || submitting ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : allAnswered ? (
              'Submit Quiz'
            ) : (
              `${questions.length - answeredCount} left`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}