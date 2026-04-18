import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Send, CheckCircle, Clock,
  AlertCircle, ExternalLink, BookOpen,
  Lock, ChevronDown, ChevronUp, Edit3
} from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'
import Spinner     from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useBatch } from '../hooks/useBatch'
import { useLessons } from '../hooks/useLessons'
import { submitAssignment, getMySubmissions } from '../firebase/firestore.batches'

function isValidUrl(str) {
  try { new URL(str); return true } catch { return false }
}

// ── Single assignment card with flip animation ────────────────────────────────
function AssignmentCard({ lesson, dayNumber, submission, userId, batchId, courseId, userName, isToday, isPast }) {
  const [flipped,    setFlipped]    = useState(false)
  const [link,       setLink]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [localSub,   setLocalSub]   = useState(submission)
  const [expanded,   setExpanded]   = useState(isToday) // today auto-expands

  // Sync external submission changes
  useEffect(() => { setLocalSub(submission) }, [submission])

  // Flip to success after submit
  useEffect(() => {
    if (localSub && !flipped) {
      // If just submitted (not pre-existing), trigger flip
    }
  }, [localSub])

  const handleSubmit = async () => {
    if (!link.trim()) return setError('Link paste karo.')
    if (!isValidUrl(link.trim())) return setError('Valid URL chahiye (https://...)')
    setSubmitting(true); setError('')
    try {
      await submitAssignment({
        userId,
        batchId,
        lessonId:  lesson?.id || '',
        dayNumber,
        workLink:  link.trim(),
        courseId,
        userName,
      })
      setLocalSub({ dayNumber, workLink: link.trim(), status: 'pending', feedback: '' })
      setLink('')
      setFlipped(true)
      setTimeout(() => setFlipped(false), 3000) // flip back after 3s
    } catch (err) {
      setError(err.message || 'Kuch galat hua.')
    } finally { setSubmitting(false) }
  }

  const isSubmitted = !!localSub
  const isReviewed  = localSub?.status === 'reviewed'

  return (
    <div className="rounded-2xl overflow-hidden border transition-all duration-300"
         style={{ perspective: '1000px' }}
    >
      {/* Card header — always visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-all
                    ${isToday
                      ? 'bg-brand-600/10 border-b border-brand-600/20'
                      : isPast && !isSubmitted
                        ? 'bg-amber-500/5 border-b border-amber-500/10'
                        : isSubmitted
                          ? 'bg-emerald-500/5 border-b border-emerald-500/10'
                          : 'bg-dark-900 border-b border-dark-800'
                    }`}
      >
        {/* Day badge */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-display font-700 text-sm
                         ${isToday
                           ? 'bg-brand-600 text-white'
                           : isReviewed
                             ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                             : isSubmitted
                               ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                               : isPast
                                 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                 : 'bg-dark-800 text-dark-500 border border-dark-700'
                         }`}>
          {isSubmitted ? <CheckCircle size={16}/> : `D${dayNumber}`}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-display font-600
                           ${isToday ? 'text-white' : isSubmitted ? 'text-dark-200' : 'text-dark-400'}`}>
              {lesson?.assignmentTitle || `Day ${dayNumber} Assignment`}
            </p>
            {isToday && (
              <span className="badge bg-brand-600 text-white text-[10px] px-2 py-0.5">Today</span>
            )}
            {isReviewed && (
              <span className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px]">
                ✓ Reviewed
              </span>
            )}
            {isSubmitted && !isReviewed && (
              <span className="badge bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[10px]">
                Pending review
              </span>
            )}
            {isPast && !isSubmitted && (
              <span className="badge bg-red-600/15 text-red-400 border border-red-600/20 text-[10px]">
                Not submitted
              </span>
            )}
          </div>
          {localSub?.workLink && (
            <a href={localSub.workLink} target="_blank" rel="noopener noreferrer"
               onClick={e => e.stopPropagation()}
               className="text-[11px] text-brand-400 hover:text-brand-300 truncate mt-0.5 flex items-center gap-1">
              {localSub.workLink.slice(0, 50)}{localSub.workLink.length > 50 ? '...' : ''}
              <ExternalLink size={9}/>
            </a>
          )}
        </div>

        {expanded
          ? <ChevronUp size={15} className="text-dark-500 shrink-0"/>
          : <ChevronDown size={15} className="text-dark-500 shrink-0"/>
        }
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className={`relative transition-all duration-500
                         ${isToday ? 'bg-brand-600/5' : 'bg-dark-900/60'}`}>

          {/* ── FLIP OVERLAY — shown for 3s after submit ── */}
          {flipped && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center
                            bg-emerald-500/15 border-t border-emerald-500/20 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40
                              flex items-center justify-center mb-3">
                <CheckCircle size={32} className="text-emerald-400"/>
              </div>
              <p className="text-emerald-300 font-display font-700 text-base">Submitted!</p>
              <p className="text-emerald-500 text-xs mt-1">Admin review karega jaldi</p>
            </div>
          )}

          <div className={`px-5 py-5 space-y-4 transition-all duration-300 ${flipped ? 'opacity-0' : 'opacity-100'}`}>
            {/* Assignment description */}
            {lesson?.assignmentDescription && (
              <p className="text-dark-300 text-sm leading-relaxed">
                {lesson.assignmentDescription}
              </p>
            )}

            {/* Feedback from admin */}
            {isReviewed && localSub?.feedback && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
                <CheckCircle size={14} className="text-emerald-400 shrink-0 mt-0.5"/>
                <div>
                  <p className="text-xs font-display font-600 text-emerald-400 mb-0.5">Admin Feedback</p>
                  <p className="text-sm text-dark-200 leading-relaxed">{localSub.feedback}</p>
                </div>
              </div>
            )}

            {/* Already submitted link */}
            {isSubmitted && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-800 border border-dark-700">
                <div className={`w-2 h-2 rounded-full shrink-0 ${isReviewed ? 'bg-emerald-400' : 'bg-amber-400'}`}/>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-dark-500 mb-0.5">Submitted link</p>
                  <a href={localSub.workLink} target="_blank" rel="noopener noreferrer"
                     className="text-brand-400 text-sm truncate flex items-center gap-1 hover:text-brand-300">
                    {localSub.workLink} <ExternalLink size={10}/>
                  </a>
                </div>
              </div>
            )}

            {/* Submit / re-submit form */}
            <div className="space-y-2.5">
              <label className="label">
                {isSubmitted ? 'Update submission' : 'Submit your work link'}
              </label>
              <input
                type="url"
                className="input"
                placeholder="https://github.com/yourname/project"
                value={link}
                onChange={e => { setLink(e.target.value); setError('') }}
              />
              {error && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={11}/> {error}
                </p>
              )}
              <p className="text-xs text-dark-600">
                GitHub, Netlify, CodePen ya koi bhi public link
              </p>
              <button
                onClick={handleSubmit}
                disabled={submitting || !link.trim()}
                className={`btn-primary ${(!link.trim() || submitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {submitting
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Submitting...</>
                  : isSubmitted
                    ? <><Edit3 size={14}/> Update Submission</>
                    : <><Send size={14}/> Submit Assignment</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AssignmentPage() {
  const navigate              = useNavigate()
  const { user }              = useAuth()
  const { batch, currentDay, loading: batchLoading } = useBatch(user?.uid)
  const courseId              = batch?.courseId
  const { lessons, loading: lessonsLoading } = useLessons(courseId)

  const [submissions, setSubmissions] = useState([])
  const [subLoading,  setSubLoading]  = useState(true)

  useEffect(() => {
    if (!user?.uid || !batch?.id) return
    getMySubmissions(user.uid, batch.id).then(data => {
      setSubmissions(data)
      setSubLoading(false)
    })
  }, [user?.uid, batch?.id])

  // Build day list: all days that have an assignment (lesson with assignmentTitle)
  // Only show days <= currentDay (locked reveal)
  const assignmentLessons = lessons
    .filter(l => l.dayNumber && l.dayNumber <= currentDay)
    .sort((a, b) => b.dayNumber - a.dayNumber) // newest first

  const loading = batchLoading || lessonsLoading || subLoading

  const getSubmissionForDay = (dayNumber) =>
    submissions.find(s => s.dayNumber === dayNumber) || null

  const submittedCount  = submissions.length
  const totalVisible    = assignmentLessons.length
  const pendingCount    = assignmentLessons.filter(l =>
    !getSubmissionForDay(l.dayNumber)
  ).length

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={15}/> Dashboard
        </button>
        <div className="w-px h-5 bg-dark-700"/>
        <h1 className="page-title">Assignments</h1>
      </div>

      {loading ? (
        <Spinner text="Loading assignments..."/>
      ) : !batch ? (
        <div className="card p-8 text-center">
          <BookOpen size={32} className="text-dark-600 mx-auto mb-3"/>
          <p className="text-white font-display font-600">No active batch</p>
          <p className="text-dark-400 text-sm mt-1">Admin ne abhi batch assign nahi ki.</p>
        </div>
      ) : (
        <div className="max-w-2xl space-y-5">

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total',     value: totalVisible,   color: 'text-brand-400'   },
              { label: 'Submitted', value: submittedCount, color: 'text-emerald-400' },
              { label: 'Pending',   value: pendingCount,   color: 'text-amber-400'   },
            ].map(({ label, value, color }) => (
              <div key={label} className="card border border-dark-800 px-4 py-3 text-center">
                <p className={`text-2xl font-display font-700 ${color}`}>{value}</p>
                <p className="text-xs text-dark-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Today's assignment — highlighted at top */}
          {(() => {
            const todayLesson = lessons.find(l => l.dayNumber === currentDay)
            if (!todayLesson) return (
              <div className="card border border-dark-800 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-dark-800 flex items-center justify-center">
                    <Clock size={16} className="text-dark-500"/>
                  </div>
                  <div>
                    <p className="text-sm font-display font-600 text-dark-300">Day {currentDay} — No assignment</p>
                    <p className="text-xs text-dark-500">Admin ne aaj ke liye assignment add nahi kiya.</p>
                  </div>
                </div>
              </div>
            )
            return null // handled in list below
          })()}

          {/* Assignment list — day-locked, newest first */}
          {assignmentLessons.length === 0 ? (
            <div className="card border border-dark-800 p-8 text-center">
              <Lock size={28} className="text-dark-700 mx-auto mb-3"/>
              <p className="text-white font-display font-600">No assignments yet</p>
              <p className="text-dark-400 text-sm mt-1">
                Batch Day {currentDay} — assignments unlock as days progress.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignmentLessons.map(lesson => (
                <div key={lesson.id}
                     className={`rounded-2xl border transition-all duration-200
                                 ${lesson.dayNumber === currentDay
                                   ? 'border-brand-600/30 shadow-lg shadow-brand-600/5'
                                   : 'border-dark-800'
                                 }`}>
                  <AssignmentCard
                    lesson={lesson}
                    dayNumber={lesson.dayNumber}
                    submission={getSubmissionForDay(lesson.dayNumber)}
                    userId={user?.uid}
                    batchId={batch.id}
                    courseId={batch.courseId}
                    userName={user?.displayName || ''}
                    isToday={lesson.dayNumber === currentDay}
                    isPast={lesson.dayNumber < currentDay}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Future days locked hint */}
          {currentDay > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dark-800 bg-dark-900/50">
              <Lock size={13} className="text-dark-700 shrink-0"/>
              <p className="text-xs text-dark-600">
                Future assignments unlock day by day as your batch progresses.
              </p>
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  )
}