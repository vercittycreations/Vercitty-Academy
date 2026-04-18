import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle, BookOpen,
  ChevronLeft, ChevronRight, Menu, X,
  Layers, Trophy, Bookmark, FileText,
  HelpCircle, Lock, Download, Calendar,
  ClipboardList
} from 'lucide-react'
import CourseFeedbackModal from '../components/course/CourseFeedbackModal'
import { saveCourseFeedback, getCourseFeedback } from '../firebase/firestore'
import Sidebar from '../components/layout/Sidebar'
import VideoPlayer from '../components/course/VideoPlayer'
import LessonPlaylist from '../components/course/LessonPlaylist'
import ResourceButton from '../components/course/ResourceButton'
import ProgressBar from '../components/ui/ProgressBar'
import ProgressRing from '../components/ui/ProgressRing'
import ProgressToast from '../components/progress/ProgressToast'
import QuizModal from '../components/course/QuizModal'
import BatchCalendar from '../components/batch/BatchCalendar'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useLessons } from '../hooks/useLessons'
import { useProgress } from '../hooks/useProgress'
import { useBookmarks } from '../hooks/useBookmarks'
import { useNotes } from '../hooks/useNotes'
import { useLastLesson } from '../hooks/useLastLesson'
import { useQuiz } from '../hooks/useQuiz'
import { useBatch } from '../hooks/useBatch'
import { getCourse } from '../firebase/firestore'
import { downloadNotes } from '../utils/notes'
import CertificateButton from '../components/batch/CertificateButton'

export default function CoursePage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [course, setCourse] = useState(null)
  const [courseLoading, setCourseLoading] = useState(true)
  const [activeLesson, setActiveLesson] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [marking, setMarking] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  // ── Watch timer — must watch MIN_WATCH_SECONDS before Mark Complete unlocks ──
  const MIN_WATCH_SECONDS = 1800 // 3 minutes
  const [watchedSeconds, setWatchedSeconds] = useState(0)
  const timerRef = useRef(null)

  const { lessons, loading: lessonsLoading } = useLessons(courseId)

  const {
    completedLessons, markComplete, getPercent, isCompleted, justCompleted,
  } = useProgress(user?.uid, courseId)

  const { bookmarkedLessons, toggle: toggleBookmark, isBookmarked } =
    useBookmarks(user?.uid, courseId)

  const {
    text: noteText, handleChange: handleNoteChange,
    saving: noteSaving, saved: noteSaved,
  } = useNotes(user?.uid, activeLesson?.id)
  const percent = getPercent(lessons.length)
  const { save: saveLastLesson, getLast } = useLastLesson(user?.uid, courseId)

  const {
    questions, quizPassed, hasQuiz, quizLoading, submitQuiz, quizResult,
  } = useQuiz(user?.uid, activeLesson?.id, courseId)

  const {
    batch, currentDay, isLessonUnlocked,
    certificateStatus, daysRemaining,totalDays,
  } = useBatch(user?.uid)

  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  useEffect(() => {
    getCourse(courseId).then(data => {
      setCourse(data)
      setCourseLoading(false)
    })
  }, [courseId])

  // Batch-aware locking: use dayNumber if available, else fall back to sequential
  const isLessonLocked = useCallback((index) => {
    const lesson = lessons[index]
    if (!lesson) return true
    // If lesson has dayNumber AND user has a batch — use day-based locking
    if (lesson.dayNumber && batch) {
      return !isLessonUnlocked(lesson.dayNumber)
    }
    // Fallback: sequential (previous lesson must be completed)
    if (index === 0) return false
    const prev = lessons[index - 1]
    return !completedLessons.includes(prev.id)
  }, [lessons, completedLessons, batch, isLessonUnlocked])

  useEffect(() => {
    if (percent !== 100 || feedbackSubmitted || !user || !courseId) return
    getCourseFeedback(user.uid, courseId).then(existing => {
      if (!existing) {
        setTimeout(() => setShowFeedback(true), 2000)
      } else {
        setFeedbackSubmitted(true)
      }
    })
  }, [percent, user, courseId, feedbackSubmitted])

  useEffect(() => {
    if (lessons.length === 0 || activeLesson) return
    const resume = async () => {
      const lastId = await getLast()
      if (lastId) {
        const found = lessons.find(l => l.id === lastId)
        const foundIndex = lessons.findIndex(l => l.id === lastId)
        if (found && !isLessonLocked(foundIndex)) {
          setActiveLesson(found)
          return
        }
      }
      const firstUnlocked = lessons.find((l, i) => !isLessonLocked(i) && !completedLessons.includes(l.id))
      setActiveLesson(firstUnlocked || lessons[0])
    }
    resume()
  }, [lessons, completedLessons])

  useEffect(() => {
    if (activeLesson?.id) saveLastLesson(activeLesson.id)
  }, [activeLesson?.id])

  // Reset and start timer when lesson changes
  useEffect(() => {
    setShowQuiz(false)
    setWatchedSeconds(0)
    clearInterval(timerRef.current)
    if (activeLesson?.id) {
      // Start counting — simulates watch time (increments every second)
      timerRef.current = setInterval(() => {
        setWatchedSeconds(s => s + 1)
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [activeLesson?.id])

  useEffect(() => {
    if (!justCompleted) return
    const lesson = lessons.find(l => l.id === justCompleted)
    const msg = `"${lesson?.title}" marked complete! 🎉`
    setToast({ show: true, message: msg, type: 'success' })
  }, [justCompleted])

  const handleFeedbackSubmit = async (data) => {
    await saveCourseFeedback(user.uid, courseId, data)
    setFeedbackSubmitted(true)
    setShowFeedback(false)
    setToast({ show: true, message: 'Thank you for your feedback!', type: 'success' })
  }


  const currentIndex = lessons.findIndex(l => l.id === activeLesson?.id)
  const lessonDone = activeLesson ? isCompleted(activeLesson.id) : false
  const lessonBm = activeLesson ? isBookmarked(activeLesson.id) : false

  const prevLesson = (() => {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (!isLessonLocked(i)) return lessons[i]
    }
    return null
  })()

  const nextLesson = (() => {
    for (let i = currentIndex + 1; i < lessons.length; i++) {
      if (!isLessonLocked(i)) return lessons[i]
    }
    return null
  })()

  const handleLockedClick = () => {
    const msg = batch
      ? `Yeh lesson Day ${activeLesson?.dayNumber || '?'} pe unlock hoga.`
      : 'Complete the previous lesson first to unlock this one.'
    setToast({ show: true, message: msg, type: 'warning' })
  }

  const handleMarkComplete = async () => {
    if (!activeLesson || lessonDone || marking) return
    // Timer guard — must have watched minimum time
    if (watchedSeconds < MIN_WATCH_SECONDS) {
      const remaining = MIN_WATCH_SECONDS - watchedSeconds
      const mins = Math.ceil(remaining / 60)
      setToast({
        show: true,
        message: `Pehle video dekho! ${mins} min${mins > 1 ? 's' : ''} aur baaki hain.`,
        type: 'warning',
      })
      return
    }
    setMarking(true)
    await markComplete(activeLesson.id)
    setMarking(false)
    // NO auto-advance to next lesson — user must manually pick next
  }

  const handleQuizPass = async () => {
    if (!activeLesson || lessonDone) return
    await markComplete(activeLesson.id)
    // NO auto-advance — stay on same lesson, just show completed state
  }

  const handleSelectLesson = useCallback((lesson) => {
    setActiveLesson(lesson)
    setSidebarOpen(false)
  }, [])

  const handleDownloadNotes = () => {
    if (!noteText?.trim()) {
      setToast({ show: true, message: 'No notes to download for this lesson.', type: 'warning' })
      return
    }
    downloadNotes(noteText, activeLesson?.title || 'Lesson')
  }

  const loading = courseLoading || lessonsLoading

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 lg:ml-64 flex items-center justify-center pt-16 lg:pt-0">
          <Spinner text="Loading course..." />
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 lg:ml-64 flex items-center justify-center pt-16 lg:pt-0">
          <EmptyState
            icon={BookOpen}
            title="Course not found"
            description="This course doesn't exist or you don't have access."
            action={
              <button className="btn-primary" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen overflow-hidden">

        {/* ── Top bar ─────────────────────────────────────────────── */}
        <div className="sticky top-0 z-30 bg-dark-950/95 backdrop-blur-md border-b border-dark-800
                        px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors
                         text-sm shrink-0 ml-10 lg:ml-0"
            >
              <ArrowLeft size={15} />
              <span className="hidden sm:inline text-xs">Dashboard</span>
            </button>

            <div className="w-px h-5 bg-dark-700 shrink-0" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-white font-display font-700 text-sm truncate">
                  {course.title}
                </h1>
                {percent === 100 && (
                  <span className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs shrink-0">
                    🎓 Complete
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex-1 max-w-xs h-1 bg-dark-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r transition-all duration-700
                                ${percent === 100
                        ? 'from-emerald-500 to-emerald-400'
                        : 'from-brand-500 to-brand-400'
                      }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className={`text-xs font-display font-600 whitespace-nowrap
                                  ${percent === 100 ? 'text-emerald-400' : 'text-brand-400'}`}>
                  {percent}%
                </span>
                {batch && (
                  <span className="text-xs text-dark-500 whitespace-nowrap hidden sm:inline">
                    Day {currentDay}/30
                  </span>
                )}
              </div>
            </div>

            {batch && (
              <button
                onClick={() => setShowCalendar(c => !c)}
                className={`btn-secondary px-2.5 py-2 shrink-0 ${showCalendar ? 'border-brand-600/40 text-brand-400' : ''}`}
                title="30-day calendar"
              >
                <Calendar size={15} />
              </button>
            )}

            <div className="hidden md:block shrink-0">
              <ProgressRing percent={percent} size={44} stroke={3} />
            </div>

            <button
              className="lg:hidden btn-secondary px-2.5 py-2 shrink-0"
              onClick={() => setSidebarOpen(o => !o)}
            >
              {sidebarOpen ? <X size={15} /> : <Menu size={15} />}
            </button>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

              {/* Calendar panel */}
              {showCalendar && batch && (
                <BatchCalendar
                  currentDay={currentDay}
                  completedLessons={completedLessons}
                  lessons={lessons}
                  onDayClick={(lesson) => {
                    setActiveLesson(lesson)
                    setShowCalendar(false)
                  }}
                />
              )}

              {lessons.length === 0 ? (
                <EmptyState icon={Layers} title="No lessons yet" description="Check back later." />
              ) : !activeLesson ? (
                <Spinner text="Loading lesson..." />
              ) : (
                <>
                  <VideoPlayer youtubeUrl={activeLesson.youtubeUrl} title={activeLesson.title} />

                  {/* Prev / Next */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => prevLesson && setActiveLesson(prevLesson)}
                      disabled={!prevLesson}
                      className="btn-secondary px-3 sm:px-4 py-2 text-xs
                                 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={13} /> Previous
                    </button>
                    <span className="text-xs text-dark-500 font-body">
                      {currentIndex + 1} / {lessons.length}
                    </span>
                    <button
                      onClick={() => {
                        if (!nextLesson) return
                        if (!lessonDone) {
                          setToast({
                            show: true,
                            message: 'Complete this lesson first before moving to the next.',
                            type: 'warning',
                          })
                          return
                        }
                        setActiveLesson(nextLesson)
                      }}
                      disabled={!nextLesson}
                      className="btn-secondary px-3 sm:px-4 py-2 text-xs
                                 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Next <ChevronRight size={13} />
                    </button>
                  </div>

                  {/* ── Lesson info card ─────────────────────────────── */}
                  <div className="card p-4 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="badge bg-brand-600/15 text-brand-400 border border-brand-600/20 text-xs">
                        {activeLesson.dayNumber ? `Day ${activeLesson.dayNumber}` : `Lesson ${currentIndex + 1}`}
                      </span>
                      {lessonDone && (
                        <span className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs">
                          ✓ Completed
                        </span>
                      )}
                      {lessonBm && (
                        <span className="badge bg-amber-500/15 text-amber-400 border border-amber-500/20 text-xs">
                          Saved
                        </span>
                      )}
                      {hasQuiz && !lessonDone && (
                        <span className="badge bg-purple-500/15 text-purple-400 border border-purple-500/20 text-xs">
                          Quiz required
                        </span>
                      )}
                    </div>

                    <h2 className="text-lg sm:text-xl font-display font-700 text-white leading-tight">
                      {activeLesson.title}
                    </h2>

                    {activeLesson.description && (
                      <p className="text-dark-300 text-sm leading-relaxed mt-3">
                        {activeLesson.description}
                      </p>
                    )}

                    {/* Assignment for this lesson */}
                    {activeLesson.assignmentTitle && (
                      <div className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl
                                      bg-purple-500/8 border border-purple-500/15">
                        <ClipboardList size={16} className="text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-display font-600 text-purple-300">
                            Assignment: {activeLesson.assignmentTitle}
                          </p>
                          {activeLesson.assignmentDescription && (
                            <p className="text-xs text-purple-400/70 mt-0.5 leading-relaxed">
                              {activeLesson.assignmentDescription}
                            </p>
                          )}
                          <button
                            onClick={() => navigate('/assignments')}
                            className="mt-2 inline-flex items-center gap-1.5 text-xs text-purple-400
                                       hover:text-purple-300 transition-colors font-display font-600"
                          >
                            Submit assignment →
                          </button>
                        </div>
                      </div>
                    )}

                    {hasQuiz && !lessonDone && quizResult && !quizResult.passed && (
                      <div className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl
                                      bg-amber-500/10 border border-amber-500/20">
                        <HelpCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-display font-600 text-amber-300">
                            Last attempt: {quizResult.score}/{quizResult.total} — need{' '}
                            {Math.ceil(quizResult.total * 0.8)}/{quizResult.total} to pass
                          </p>
                          <p className="text-xs text-amber-500 mt-0.5">
                            Rewatch the video carefully, then try the quiz again.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="h-px bg-dark-800 my-5" />

                    {/* ── Action buttons ──────────────────────────────── */}
                    <div className="flex flex-wrap items-center gap-3">
                      <ResourceButton resourceLink={activeLesson.resourceLink} resources={activeLesson.resources || []} />

                      <button
                        onClick={() => toggleBookmark(activeLesson.id)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm
                                    font-display font-600 transition-all duration-200 border
                                    ${lessonBm
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/25'
                            : 'bg-dark-800 text-dark-300 border-dark-700 hover:border-dark-500 hover:text-white'
                          }`}
                      >
                        <Bookmark size={15} className={lessonBm ? 'fill-amber-400' : ''} />
                        {lessonBm ? 'Saved' : 'Save'}
                      </button>

                      <button
                        onClick={() => setShowNotes(n => !n)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm
                                    font-display font-600 transition-all duration-200 border
                                    ${showNotes
                            ? 'bg-brand-600/15 text-brand-400 border-brand-600/25'
                            : 'bg-dark-800 text-dark-300 border-dark-700 hover:border-dark-500 hover:text-white'
                          }`}
                      >
                        <FileText size={15} />
                        Notes
                        {noteText?.trim() && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 ml-0.5" />
                        )}
                      </button>

                      {lessonDone ? (
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
                                        bg-emerald-500/10 border border-emerald-500/20 text-emerald-400
                                        text-sm font-display font-600">
                          <CheckCircle size={16} /> Completed
                        </div>
                      ) : quizLoading ? (
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
                                        bg-dark-800 border border-dark-700 text-dark-500
                                        text-sm font-display font-600 cursor-wait">
                          <span className="w-4 h-4 border-2 border-dark-600 border-t-dark-400
                                           rounded-full animate-spin" />
                          Loading...
                        </div>
                      ) : hasQuiz ? (
                        <button
                          onClick={() => setShowQuiz(true)}
                          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-lg
                                     text-sm font-display font-600 transition-all duration-200
                                     bg-purple-600 hover:bg-purple-500 text-white
                                     shadow-lg shadow-purple-600/25 hover:scale-[1.02]"
                        >
                          <HelpCircle size={16} />
                          {quizResult ? 'Retake Quiz' : 'Take Quiz'}
                        </button>
                      ) : (
                        // ── Timer-gated Mark Complete ──────────────────────
                        <div className="flex flex-col gap-1.5">
                          {watchedSeconds < MIN_WATCH_SECONDS && (
                            <div className="flex items-center gap-2">
                              {/* Timer progress bar */}
                              <div className="w-28 h-1.5 bg-dark-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                                  style={{ width: `${Math.min(100, (watchedSeconds / MIN_WATCH_SECONDS) * 100)}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-dark-500 font-mono">
                                {Math.ceil((MIN_WATCH_SECONDS - watchedSeconds) / 60)}m left
                              </span>
                            </div>
                          )}
                          <button
                            onClick={handleMarkComplete}
                            disabled={marking || watchedSeconds < MIN_WATCH_SECONDS}
                            title={watchedSeconds < MIN_WATCH_SECONDS ? 'Pehle video dekho!' : 'Mark lesson complete'}
                            className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-lg
                                        text-sm font-display font-600 transition-all duration-200
                                        ${marking
                                ? 'bg-brand-600/20 text-brand-400 cursor-not-allowed'
                                : watchedSeconds < MIN_WATCH_SECONDS
                                  ? 'bg-dark-800 text-dark-600 border border-dark-700 cursor-not-allowed'
                                  : 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/25 hover:scale-[1.02]'
                              }`}
                          >
                            {marking ? (
                              <>
                                <span className="w-4 h-4 border-2 border-brand-300/40 border-t-brand-300
                                                 rounded-full animate-spin" />
                                Saving...
                              </>
                            ) : watchedSeconds < MIN_WATCH_SECONDS ? (
                              <><Lock size={14} /> Watch First</>
                            ) : (
                              <><CheckCircle size={16} /> Mark Complete</>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ── Notes panel ──────────────────────────────────── */}
                    {showNotes && (
                      <div className="mt-5 pt-5 border-t border-dark-800">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-display font-700 text-white flex items-center gap-2">
                            <FileText size={14} className="text-brand-400" />
                            My Notes
                          </h3>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-dark-500">
                              {noteSaving ? 'Saving...' : noteSaved ? '✓ Saved' : 'Auto-saves as you type'}
                            </span>
                            <button
                              onClick={handleDownloadNotes}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                          text-xs font-display font-600 transition-all border
                                          ${noteText?.trim()
                                  ? 'bg-brand-600/10 border-brand-600/25 text-brand-400 hover:bg-brand-600/20'
                                  : 'bg-dark-800 border-dark-700 text-dark-600 cursor-not-allowed'
                                }`}
                            >
                              <Download size={12} />
                              Download
                            </button>
                          </div>
                        </div>
                        <textarea
                          value={noteText}
                          onChange={e => handleNoteChange(e.target.value)}
                          placeholder="Write your notes for this lesson... (auto-saved)"
                          rows={6}
                          className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3
                                     text-dark-100 placeholder-dark-500 text-sm font-body resize-none
                                     focus:outline-none focus:ring-2 focus:ring-brand-500
                                     focus:border-transparent transition-all duration-200 leading-relaxed"
                        />
                      </div>
                    )}
                  </div>

                  {/* ── Progress card ─────────────────────────────────── */}
                  <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-display font-700 text-white">Course Progress</h3>
                        <p className="text-xs text-dark-500 mt-0.5">
                          {completedLessons.length} of {lessons.length} lessons completed
                        </p>
                      </div>
                      <ProgressRing percent={percent} size={52} stroke={4} />
                    </div>
                    <ProgressBar percent={percent} size="lg" color={percent === 100 ? 'emerald' : 'brand'} />

                    {/* Certificate button */}
                    <div className="mt-4">
                      <CertificateButton
                        status={certificateStatus}
                        currentDay={currentDay}
                        totalDays={totalDays}        // ✅ added
                        batchId={batch?.id || ''}    // ✅ added
                        userId={user?.uid || ''}     // ✅ added

                        studentName={user?.displayName || ''}
                        courseName={course?.title || ''}
                        batchName={batch?.name || ''}
                      />
                    </div>

                    {percent === 100 && (
                      <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl
                                      bg-emerald-500/10 border border-emerald-500/20">
                        <Trophy size={20} className="text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-sm font-display font-700 text-emerald-300">
                            Course Complete! 🎓
                          </p>
                          <p className="text-xs text-emerald-500 mt-0.5">
                            All {lessons.length} lessons completed.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Lesson checklist ─────────────────────────────── */}
                  <div className="card p-5">
                    <h3 className="text-sm font-display font-700 text-white mb-4">
                      Lesson Checklist
                    </h3>
                    <div className="space-y-2">
                      {lessons.map((lesson, i) => {
                        const locked = isLessonLocked(i)
                        const done = isCompleted(lesson.id)
                        const active = activeLesson?.id === lesson.id
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => {
                              if (locked) { handleLockedClick(); return }
                              setActiveLesson(lesson)
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border
                                        text-left transition-all duration-200
                                        ${locked
                                ? 'opacity-40 cursor-not-allowed bg-dark-900 border-dark-800'
                                : active
                                  ? 'bg-brand-600/10 border-brand-600/25 cursor-pointer'
                                  : done
                                    ? 'bg-emerald-500/5 border-emerald-500/15 hover:border-emerald-500/25 cursor-pointer'
                                    : 'bg-dark-900 border-dark-800 hover:border-dark-700 cursor-pointer'
                              }`}
                          >
                            {locked ? (
                              <Lock size={14} className="text-dark-700 shrink-0" />
                            ) : done ? (
                              <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                            ) : (
                              <div className={`w-4 h-4 rounded-full border-2 shrink-0
                                               flex items-center justify-center
                                               ${active ? 'border-brand-500' : 'border-dark-600'}`}>
                                <span className="text-[8px] font-display font-700 text-dark-500">
                                  {i + 1}
                                </span>
                              </div>
                            )}
                            <span className={`flex-1 text-sm font-body truncate
                                              ${locked
                                ? 'text-dark-700'
                                : active ? 'text-white font-500'
                                  : done ? 'text-dark-300'
                                    : 'text-dark-400'
                              }`}>
                              {lesson.title}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {lesson.dayNumber && (
                                <span className="text-[10px] text-dark-600">D{lesson.dayNumber}</span>
                              )}
                              {isBookmarked(lesson.id) && !locked && (
                                <Bookmark size={11} className="text-amber-400 fill-amber-400" />
                              )}
                              {active && !locked && (
                                <span className="badge bg-brand-600/20 text-brand-400
                                                 border border-brand-600/30 text-[10px]">
                                  Playing
                                </span>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Desktop playlist ──────────────────────────────────────── */}
          <div className="hidden lg:flex flex-col w-80 xl:w-96 border-l border-dark-800
                          bg-dark-900/40 overflow-hidden shrink-0">
            <LessonPlaylist
              lessons={lessons}
              activeLesson={activeLesson}
              completedLessons={completedLessons}
              bookmarkedLessons={bookmarkedLessons}
              onSelect={handleSelectLesson}
              onLockedClick={handleLockedClick}
              currentDay={currentDay}
              hasBatch={!!batch}
            />
          </div>

          {/* ── Mobile playlist ───────────────────────────────────────── */}
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div
                className="flex-1 bg-dark-950/80 backdrop-blur-sm"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="w-80 bg-dark-900 border-l border-dark-800 flex flex-col
                              h-full overflow-hidden">
                <div className="flex items-center justify-between px-4 py-4
                                border-b border-dark-800 shrink-0">
                  <h3 className="text-sm font-display font-700 text-white">Lessons</h3>
                  <button onClick={() => setSidebarOpen(false)} className="text-dark-400 hover:text-white">
                    <X size={15} />
                  </button>
                </div>
                <LessonPlaylist
                  lessons={lessons}
                  activeLesson={activeLesson}
                  completedLessons={completedLessons}
                  bookmarkedLessons={bookmarkedLessons}
                  onSelect={handleSelectLesson}
                  onLockedClick={handleLockedClick}
                  currentDay={currentDay}
                  hasBatch={!!batch}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {showQuiz && activeLesson && questions.length > 0 && (
        <QuizModal
          questions={questions}
          lessonTitle={activeLesson.title}
          previousAttempts={quizResult?.attempts || 0}
          onSubmit={submitQuiz}
          onPass={handleQuizPass}
          onClose={() => setShowQuiz(false)}
        />
      )}

      <ProgressToast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(t => ({ ...t, show: false }))}
      />

      {showFeedback && (
        <CourseFeedbackModal
          course={course}
          onSubmit={handleFeedbackSubmit}
          onSkip={() => { setShowFeedback(false); setFeedbackSubmitted(true) }}
        />
      )}
    </div>
  )
}