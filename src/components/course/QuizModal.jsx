import { useState } from 'react'
import { X, Trophy, XCircle, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react'

export default function QuizModal({
  questions, lessonTitle, previousAttempts = 0,
  onSubmit, onPass, onClose,
}) {
  const [answers,    setAnswers]    = useState(() => Array(questions.length).fill(null))
  const [submitted,  setSubmitted]  = useState(false)
  const [result,     setResult]     = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const answeredCount = answers.filter(a => a !== null).length
  const allAnswered   = answeredCount === questions.length
  const passNeeded    = Math.ceil(questions.length * 0.8)

  const handleSelect = (qi, oi) => {
    if (submitted) return
    setAnswers(prev => { const n = [...prev]; n[qi] = oi; return n })
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

  // ── Review section — shown after submission ────────────────────
  const ReviewSection = () => (
    <div className="mt-6 pt-6 border-t border-dark-800">
      <p className="text-xs font-display font-700 text-dark-300 uppercase tracking-wider mb-4">
        Answer Review
      </p>
      <div className="space-y-5">
        {questions.map((q, qi) => {
          const studentAns   = answers[qi]
          const isCorrect    = studentAns === q.correctIndex
          return (
            <div key={qi}>
              {/* Question */}
              <div className="flex items-start gap-2 mb-2.5">
                <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-700 mt-0.5
                                  ${isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-600/20 text-red-400'}`}>
                  {isCorrect ? '✓' : '✗'}
                </span>
                <p className="text-sm text-white font-body leading-snug">
                  <span className="text-brand-400 font-600 mr-1">Q{qi + 1}.</span>
                  {q.question}
                </p>
              </div>
              {/* Options */}
              <div className="space-y-1.5 pl-7">
                {q.options.map((opt, oi) => {
                  const isStudentChoice  = oi === studentAns
                  const isCorrectAnswer  = oi === q.correctIndex
                  const isWrongChoice    = isStudentChoice && !isCorrectAnswer

                  return (
                    <div
                      key={oi}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs border transition-none
                                  ${isCorrectAnswer
                                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                                    : isWrongChoice
                                      ? 'bg-red-600/10 border-red-600/25 text-red-400'
                                      : 'bg-dark-800/50 border-dark-800 text-dark-500'
                                  }`}
                    >
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                                        shrink-0 text-[10px] font-display font-700
                                        ${isCorrectAnswer
                                          ? 'border-emerald-500 text-emerald-400'
                                          : isWrongChoice
                                            ? 'border-red-500 text-red-400'
                                            : 'border-dark-600 text-dark-600'
                                        }`}>
                        {isCorrectAnswer ? '✓' : isWrongChoice ? '✗' : String.fromCharCode(65 + oi)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isCorrectAnswer && !isStudentChoice && (
                        <span className="text-[10px] text-emerald-500 shrink-0 font-600">correct answer</span>
                      )}
                      {isStudentChoice && isCorrect && (
                        <span className="text-[10px] text-emerald-500 shrink-0 font-600">your answer</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  // ── Result screen ──────────────────────────────────────────────
  if (submitted && result) {
    const pct = Math.round((result.score / result.total) * 100)
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
        <div className="absolute inset-0 bg-dark-950/85 backdrop-blur-sm" />
        <div className="relative w-full max-w-xl card border border-dark-700 shadow-2xl my-6 animate-slide-up">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-dark-800">
            <h2 className="text-base font-display font-700 text-white">
              {result.passed ? 'Quiz Passed!' : 'Quiz Result'}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-dark-800 hover:bg-dark-700 flex items-center
                         justify-center text-dark-400 hover:text-white transition-all"
            >
              <X size={15} />
            </button>
          </div>

          <div className="px-6 py-6 overflow-y-auto max-h-[78vh]">
            {/* Result summary */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border-2
                               ${result.passed
                                 ? 'bg-emerald-500/15 border-emerald-500/30'
                                 : 'bg-red-600/10 border-red-600/20'
                               }`}>
                {result.passed
                  ? <Trophy size={30} className="text-emerald-400" />
                  : <XCircle size={30} className="text-red-400" />
                }
              </div>
              <p className={`text-3xl font-display font-700 mb-1
                             ${result.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                {result.score}/{result.total}
              </p>
              <p className="text-dark-400 text-sm">
                {pct}% — need {passNeeded}/{result.total} to pass (80%)
              </p>

              {/* Score bar */}
              <div className="w-full max-w-xs h-2 bg-dark-800 rounded-full overflow-hidden mt-4">
                <div
                  className={`h-full rounded-full transition-all duration-700
                               ${result.passed ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Pass: auto complete notice */}
            {result.passed && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl
                              bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                <p className="text-sm font-display font-600 text-emerald-400">
                  Lesson marked as complete automatically
                </p>
              </div>
            )}

            {/* Fail: hint */}
            {!result.passed && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl
                              bg-amber-500/10 border border-amber-500/20 mb-4">
                <AlertCircle size={15} className="text-amber-400 shrink-0" />
                <p className="text-sm text-amber-300">
                  Rewatch the video, then try again. Review your mistakes below.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 mb-2">
              {result.passed ? (
                <button
                  onClick={() => { onPass(); onClose() }}
                  className="btn-primary flex-1 justify-center py-3"
                >
                  Continue Learning
                </button>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    className="btn-secondary flex-1 justify-center"
                  >
                    <RotateCcw size={14} /> Rewatch Video
                  </button>
                  <button onClick={handleRetry} className="btn-primary flex-1 justify-center">
                    Try Again
                  </button>
                </>
              )}
            </div>

            {/* Review */}
            <ReviewSection />
          </div>
        </div>
      </div>
    )
  }

  // ── Questions screen ───────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-dark-950/85 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl card border border-dark-700 shadow-2xl my-6 animate-slide-up">

        <div className="flex items-center justify-between px-6 py-5 border-b border-dark-800">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-display font-700 text-white">Lesson Quiz</h2>
            <p className="text-xs text-dark-400 mt-0.5 truncate">{lessonTitle}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-dark-500">{answeredCount}/{questions.length} answered</span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-dark-800 hover:bg-dark-700 flex items-center
                         justify-center text-dark-400 hover:text-white transition-all"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-dark-800">
          <div
            className="h-full bg-brand-500 transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>

        {/* Questions */}
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

        <div className="px-6 py-4 border-t border-dark-800 flex items-center justify-between gap-4">
          <p className="text-xs text-dark-500">
            Pass: {passNeeded}/{questions.length} correct (80%)
            {previousAttempts > 0 && (
              <span className="ml-2 text-dark-600">· Attempt {previousAttempts + 1}</span>
            )}
          </p>
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className={`btn-primary shrink-0 ${!allAnswered || submitting ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : allAnswered ? 'Submit Quiz' : `${questions.length - answeredCount} left`}
          </button>
        </div>
      </div>
    </div>
  )
}