import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Send, CheckCircle, Clock,
  AlertCircle, ExternalLink, BookOpen
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

export default function AssignmentPage() {
  const navigate           = useNavigate()
  const { user }           = useAuth()
  const { batch, currentDay, loading: batchLoading } = useBatch(user?.uid)
  const courseId           = batch?.courseId
  const { lessons, loading: lessonsLoading } = useLessons(courseId)

  const [submissions, setSubmissions] = useState([])
  const [subLoading,  setSubLoading]  = useState(true)
  const [link,        setLink]        = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [toast,       setToast]       = useState('')
  const [error,       setError]       = useState('')

  const todayLesson = lessons.find(l => l.dayNumber === currentDay)

  useEffect(() => {
    if (!user?.uid || !batch?.id) return
    getMySubmissions(user.uid, batch.id).then(data => {
      setSubmissions(data)
      setSubLoading(false)
    })
  }, [user?.uid, batch?.id])

  const todaySub = submissions.find(s => s.dayNumber === currentDay)

  const handleSubmit = async () => {
    if (!link.trim()) return setError('Link paste karo.')
    if (!isValidUrl(link.trim())) return setError('Valid URL paste karo (https://...)')
    if (!todayLesson || !batch) return setError('Batch ya lesson nahi mila.')
    setSubmitting(true); setError('')
    try {
      await submitAssignment({
        userId:     user.uid,
        batchId:    batch.id,
        lessonId:   todayLesson.id,
        dayNumber:  currentDay,
        workLink:   link.trim(),
        courseId:   batch.courseId,
        userName:   user.displayName || '',
      })
      setSubmissions(prev => {
        const filtered = prev.filter(s => s.dayNumber !== currentDay)
        return [...filtered, {
          dayNumber: currentDay,
          workLink: link.trim(),
          status: 'pending',
          feedback: '',
        }]
      })
      setLink('')
      setToast('Assignment submitted! Admin review karega.')
      setTimeout(() => setToast(''), 3500)
    } catch (err) {
      setError(err.message || 'Kuch galat hua.')
    } finally { setSubmitting(false) }
  }

  const loading = batchLoading || lessonsLoading

  return (
    <PageWrapper>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={15}/> Dashboard
        </button>
        <div className="w-px h-5 bg-dark-700"/>
        <h1 className="page-title">Assignments</h1>
      </div>

      {loading ? (
        <Spinner text="Loading..."/>
      ) : !batch ? (
        <div className="card p-6 text-center">
          <BookOpen size={32} className="text-dark-600 mx-auto mb-3"/>
          <p className="text-white font-display font-600">No active batch</p>
          <p className="text-dark-400 text-sm mt-1">Admin ne abhi batch assign nahi ki.</p>
        </div>
      ) : (
        <div className="max-w-2xl space-y-5">

          {toast && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-slide-up">
              <CheckCircle size={16} className="text-emerald-400 shrink-0"/>
              <p className="text-sm text-emerald-300">{toast}</p>
            </div>
          )}

          <div className="card border border-dark-800 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="badge bg-brand-600/15 text-brand-400 border border-brand-600/20 text-xs">
                Day {currentDay} Assignment
              </span>
              {todaySub && (
                <span className={`badge text-xs border ${
                  todaySub.status === 'reviewed'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                }`}>
                  {todaySub.status === 'reviewed' ? 'Reviewed' : 'Pending review'}
                </span>
              )}
            </div>

            {todayLesson ? (
              <>
                <h2 className="text-lg font-display font-700 text-white mt-2">
                  {todayLesson.assignmentTitle || `Day ${currentDay} Assignment`}
                </h2>
                <p className="text-dark-300 text-sm mt-2 leading-relaxed">
                  {todayLesson.assignmentDescription || todayLesson.description || 'Complete the lesson tasks and submit your work.'}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-display font-700 text-white mt-2">
                  Day {currentDay} Assignment
                </h2>
                <p className="text-dark-400 text-sm mt-1">
                  Admin ne abhi assignment details add nahi ki. Lesson dekho aur kaam karo.
                </p>
              </>
            )}

            <div className="h-px bg-dark-800 my-4"/>

            {todaySub?.status === 'reviewed' && todaySub.feedback && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
                <p className="text-xs font-display font-600 text-emerald-400 mb-1">Admin Feedback</p>
                <p className="text-sm text-dark-200 leading-relaxed">{todaySub.feedback}</p>
              </div>
            )}

            {todaySub?.workLink && (
              <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-800 border border-dark-700">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-dark-500 mb-0.5">Submitted link</p>
                  <a href={todaySub.workLink} target="_blank" rel="noopener noreferrer"
                    className="text-brand-400 text-sm truncate flex items-center gap-1 hover:text-brand-300">
                    {todaySub.workLink} <ExternalLink size={11}/>
                  </a>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="label">
                  {todaySub ? 'Update your submission link' : 'Submit your work link'}
                </label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://github.com/yourname/project OR https://yoursite.netlify.app"
                  value={link}
                  onChange={e => { setLink(e.target.value); setError('') }}
                />
                {error && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={11}/> {error}
                  </p>
                )}
                <p className="text-xs text-dark-600 mt-1">
                  GitHub repo, Netlify link, CodePen, ya koi bhi public link paste karo.
                </p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || !link.trim()}
                className={`btn-primary ${(!link.trim() || submitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {submitting
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Submitting...</>
                  : <><Send size={14}/> {todaySub ? 'Update Submission' : 'Submit Assignment'}</>
                }
              </button>
            </div>
          </div>

          {submissions.length > 0 && (
            <div className="card border border-dark-800 p-5">
              <h3 className="text-sm font-display font-700 text-white mb-4">
                All Submissions
              </h3>
              <div className="space-y-2">
                {[...submissions].sort((a, b) => b.dayNumber - a.dayNumber).map(sub => (
                  <div key={sub.dayNumber}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${
                      sub.status === 'reviewed'
                        ? 'bg-emerald-500/5 border-emerald-500/15'
                        : 'bg-dark-800/50 border-dark-700'
                    }`}
                  >
                    {sub.status === 'reviewed'
                      ? <CheckCircle size={14} className="text-emerald-400 shrink-0"/>
                      : <Clock       size={14} className="text-amber-400 shrink-0"/>
                    }
                    <span className="text-xs font-display font-600 text-dark-300 shrink-0 w-14">
                      Day {sub.dayNumber}
                    </span>
                    <a href={sub.workLink} target="_blank" rel="noopener noreferrer"
                      className="flex-1 text-xs text-brand-400 truncate hover:text-brand-300 flex items-center gap-1">
                      {sub.workLink} <ExternalLink size={9}/>
                    </a>
                    <span className={`text-xs shrink-0 ${
                      sub.status === 'reviewed' ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                      {sub.status === 'reviewed' ? 'Reviewed' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  )
}