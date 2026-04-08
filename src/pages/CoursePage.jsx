import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate }           from 'react-router-dom'
import {
  ArrowLeft, CheckCircle, BookOpen,
  ChevronLeft, ChevronRight, Menu, X,
  Layers, Trophy, Bookmark, FileText
} from 'lucide-react'
import Sidebar          from '../components/layout/Sidebar'
import VideoPlayer      from '../components/course/VideoPlayer'
import LessonPlaylist   from '../components/course/LessonPlaylist'
import ResourceButton   from '../components/course/ResourceButton'
import ProgressBar      from '../components/ui/ProgressBar'
import ProgressRing     from '../components/ui/ProgressRing'
import ProgressToast    from '../components/progress/ProgressToast'
import Spinner          from '../components/ui/Spinner'
import EmptyState       from '../components/ui/EmptyState'
import { LessonItemSkeleton } from '../components/ui/Skeleton'
import { useAuth }      from '../context/AuthContext'
import { useLessons }   from '../hooks/useLessons'
import { useProgress }  from '../hooks/useProgress'
import { useBookmarks } from '../hooks/useBookmarks'
import { useNotes }     from '../hooks/useNotes'
import { useLastLesson } from '../hooks/useLastLesson'
import { getCourse }    from '../firebase/firestore'

export default function CoursePage() {
  const { courseId }   = useParams()
  const navigate       = useNavigate()
  const { user }       = useAuth()

  const [course,        setCourse]        = useState(null)
  const [courseLoading, setCourseLoading] = useState(true)
  const [activeLesson,  setActiveLesson]  = useState(null)
  const [sidebarOpen,   setSidebarOpen]   = useState(false)
  const [marking,       setMarking]       = useState(false)
  const [toast,         setToast]         = useState({ show: false, message: '' })
  const [showNotes,     setShowNotes]     = useState(false)

  const { lessons, loading: lessonsLoading }      = useLessons(courseId)
  const { completedLessons, markComplete, getPercent, isCompleted, justCompleted } =
    useProgress(user?.uid, courseId)
  const { bookmarkedLessons, toggle: toggleBookmark, isBookmarked } =
    useBookmarks(user?.uid, courseId)
  const { text: noteText, handleChange: handleNoteChange, saving: noteSaving, saved: noteSaved } =
    useNotes(user?.uid, activeLesson?.id)
  const { save: saveLastLesson, getLast } =
    useLastLesson(user?.uid, courseId)

  useEffect(() => {
    getCourse(courseId).then(data => {
      setCourse(data)
      setCourseLoading(false)
    })
  }, [courseId])

  /* ── auto-select: resume last lesson OR first incomplete ── */
  useEffect(() => {
    if (lessons.length === 0 || activeLesson) return
    const resume = async () => {
      const lastId = await getLast()
      if (lastId) {
        const found = lessons.find(l => l.id === lastId)
        if (found) { setActiveLesson(found); return }
      }
      const firstIncomplete = lessons.find(l => !completedLessons.includes(l.id))
      setActiveLesson(firstIncomplete || lessons[0])
    }
    resume()
  }, [lessons, completedLessons])

  useEffect(() => {
    if (!justCompleted) return
    const lesson = lessons.find(l => l.id === justCompleted)
    setToast({ show: true, message: `"${lesson?.title || 'Lesson'}" marked as complete!` })
  }, [justCompleted])

  /* ── save last lesson whenever active changes ─────────── */
  useEffect(() => {
    if (activeLesson?.id) saveLastLesson(activeLesson.id)
  }, [activeLesson?.id])

  const percent      = getPercent(lessons.length)
  const currentIndex = lessons.findIndex(l => l.id === activeLesson?.id)
  const hasPrev      = currentIndex > 0
  const hasNext      = currentIndex < lessons.length - 1
  const lessonDone   = activeLesson ? isCompleted(activeLesson.id) : false
  const lessonBm     = activeLesson ? isBookmarked(activeLesson.id) : false

  const handleMarkComplete = async () => {
    if (!activeLesson || lessonDone || marking) return
    setMarking(true)
    await markComplete(activeLesson.id)
    setMarking(false)
    if (hasNext) setTimeout(() => setActiveLesson(lessons[currentIndex + 1]), 1000)
  }

  const handleSelectLesson = useCallback((lesson) => {
    setActiveLesson(lesson)
    setSidebarOpen(false)
  }, [])

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
            action={<button className="btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen overflow-hidden">

        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-dark-950/95 backdrop-blur-md border-b border-dark-800 px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Back button — offset on mobile for hamburger */}
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors text-sm shrink-0 ml-10 lg:ml-0"
            >
              <ArrowLeft size={15} />
              <span className="hidden sm:inline text-xs">Dashboard</span>
            </button>

            <div className="w-px h-5 bg-dark-700 shrink-0" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-white font-display font-700 text-sm truncate">{course.title}</h1>
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
                                ${percent === 100 ? 'from-emerald-500 to-emerald-400' : 'from-brand-500 to-brand-400'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className={`text-xs font-display font-600 whitespace-nowrap
                                  ${percent === 100 ? 'text-emerald-400' : 'text-brand-400'}`}>
                  {percent}%
                </span>
                <span className="text-xs text-dark-600 whitespace-nowrap hidden sm:inline">
                  {completedLessons.length}/{lessons.length}
                </span>
              </div>
            </div>

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

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

              {lessons.length === 0 ? (
                <EmptyState icon={Layers} title="No lessons yet" description="Check back later." />
              ) : !activeLesson ? (
                <div className="space-y-3">
                  {[0,1,2,3].map(i => <LessonItemSkeleton key={i} />)}
                </div>
              ) : (
                <>
                  <VideoPlayer youtubeUrl={activeLesson.youtubeUrl} title={activeLesson.title} />

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => hasPrev && setActiveLesson(lessons[currentIndex - 1])}
                      disabled={!hasPrev}
                      className="btn-secondary px-3 sm:px-4 py-2 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={13} /> Previous
                    </button>
                    <span className="text-xs text-dark-500 font-body">{currentIndex + 1} / {lessons.length}</span>
                    <button
                      onClick={() => hasNext && setActiveLesson(lessons[currentIndex + 1])}
                      disabled={!hasNext}
                      className="btn-secondary px-3 sm:px-4 py-2 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Next <ChevronRight size={13} />
                    </button>
                  </div>

                  {/* Lesson info card */}
                  <div className="card p-4 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="badge bg-brand-600/15 text-brand-400 border border-brand-600/20 text-xs">
                        Lesson {currentIndex + 1}
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
                    </div>
                    <h2 className="text-lg sm:text-xl font-display font-700 text-white leading-tight">
                      {activeLesson.title}
                    </h2>
                    {activeLesson.description && (
                      <p className="text-dark-300 text-sm leading-relaxed mt-3">{activeLesson.description}</p>
                    )}

                    <div className="h-px bg-dark-800 my-5" />

                    <div className="flex flex-wrap items-center gap-3">
                      <ResourceButton resourceLink={activeLesson.resourceLink} />

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

                      {!lessonDone ? (
                        <button
                          onClick={handleMarkComplete}
                          disabled={marking}
                          className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-lg
                                      text-sm font-display font-600 transition-all duration-200
                                      ${marking
                                        ? 'bg-brand-600/20 text-brand-400 cursor-not-allowed'
                                        : 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/25 hover:scale-[1.02]'
                                      }`}
                        >
                          {marking ? (
                            <>
                              <span className="w-4 h-4 border-2 border-brand-300/40 border-t-brand-300 rounded-full animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <><CheckCircle size={16} /> Mark Complete</>
                          )}
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
                                        bg-emerald-500/10 border border-emerald-500/20 text-emerald-400
                                        text-sm font-display font-600">
                          <CheckCircle size={16} /> Completed
                        </div>
                      )}
                    </div>

                    {/* Notes panel */}
                    {showNotes && (
                      <div className="mt-5 pt-5 border-t border-dark-800">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-display font-700 text-white flex items-center gap-2">
                            <FileText size={14} className="text-brand-400" />
                            My Notes
                          </h3>
                          <span className="text-xs text-dark-500">
                            {noteSaving ? 'Saving...' : noteSaved ? '✓ Saved' : 'Auto-saves as you type'}
                          </span>
                        </div>
                        <textarea
                          value={noteText}
                          onChange={e => handleNoteChange(e.target.value)}
                          placeholder="Write your notes for this lesson... (auto-saved)"
                          rows={5}
                          className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3
                                     text-dark-100 placeholder-dark-500 text-sm font-body resize-none
                                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                                     transition-all duration-200 leading-relaxed"
                        />
                      </div>
                    )}
                  </div>

                  {/* Progress card */}
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
                    {percent === 100 && (
                      <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl
                                      bg-emerald-500/10 border border-emerald-500/20">
                        <Trophy size={20} className="text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-sm font-display font-700 text-emerald-300">Course Complete! 🎓</p>
                          <p className="text-xs text-emerald-500 mt-0.5">
                            You've completed all {lessons.length} lessons.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lesson checklist */}
                  <div className="card p-5">
                    <h3 className="text-sm font-display font-700 text-white mb-4">Lesson Checklist</h3>
                    <div className="space-y-2">
                      {lessons.map((lesson, i) => (
                        <button
                          key={lesson.id}
                          onClick={() => setActiveLesson(lesson)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border
                                      text-left transition-all duration-200
                                      ${activeLesson?.id === lesson.id
                                        ? 'bg-brand-600/10 border-brand-600/25'
                                        : isCompleted(lesson.id)
                                          ? 'bg-emerald-500/5 border-emerald-500/15 hover:border-emerald-500/25'
                                          : 'bg-dark-900 border-dark-800 hover:border-dark-700'
                                      }`}
                        >
                          {isCompleted(lesson.id)
                            ? <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                            : (
                              <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center
                                               ${activeLesson?.id === lesson.id ? 'border-brand-500' : 'border-dark-600'}`}>
                                <span className="text-[8px] font-display font-700 text-dark-500">{i + 1}</span>
                              </div>
                            )
                          }
                          <span className={`flex-1 text-sm font-body truncate
                                            ${activeLesson?.id === lesson.id
                                              ? 'text-white font-500'
                                              : isCompleted(lesson.id) ? 'text-dark-300' : 'text-dark-400'
                                            }`}>
                            {lesson.title}
                          </span>
                          {isBookmarked(lesson.id) && (
                            <Bookmark size={12} className="text-amber-400 fill-amber-400 shrink-0" />
                          )}
                          {activeLesson?.id === lesson.id && (
                            <span className="badge bg-brand-600/20 text-brand-400 border border-brand-600/30 text-[10px] shrink-0">
                              Playing
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right playlist — desktop */}
          <div className="hidden lg:flex flex-col w-80 xl:w-96 border-l border-dark-800 bg-dark-900/40 overflow-hidden shrink-0">
            <LessonPlaylist
              lessons={lessons}
              activeLesson={activeLesson}
              completedLessons={completedLessons}
              bookmarkedLessons={bookmarkedLessons}
              onSelect={handleSelectLesson}
            />
          </div>

          {/* Mobile playlist */}
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div className="flex-1 bg-dark-950/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
              <div className="w-80 bg-dark-900 border-l border-dark-800 flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between px-4 py-4 border-b border-dark-800 shrink-0">
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
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <ProgressToast
        show={toast.show}
        message={toast.message}
        onClose={() => setToast({ show: false, message: '' })}
      />
    </div>
  )
}