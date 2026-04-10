import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Pencil, Trash2,
  PlayCircle, FileText, Link2, HelpCircle
} from 'lucide-react'
import PageWrapper   from '../../components/layout/PageWrapper'
import Modal         from '../../components/admin/Modal'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import QuizManager   from '../../components/admin/QuizManager'
import Spinner       from '../../components/ui/Spinner'
import EmptyState    from '../../components/ui/EmptyState'
import { useLessons }  from '../../hooks/useLessons'
import {
  createLesson, updateLesson, deleteLesson
} from '../../firebase/firestore'
import { extractYouTubeId } from '../../utils/youtube'

const EMPTY_FORM = {
  title: '', description: '', youtubeUrl: '',
  resourceLink: '', order: 0,
}

export default function ManageLessons() {
  const { courseId } = useParams()
  const navigate     = useNavigate()
  const { lessons, setLessons, loading } = useLessons(courseId)

  const [modal,      setModal]      = useState(false)
  const [editLesson, setEditLesson] = useState(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)
  const [deleteId,   setDeleteId]   = useState(null)
  const [deleting,   setDeleting]   = useState(false)
  const [error,      setError]      = useState('')

  // Quiz manager state
  const [quizLesson, setQuizLesson] = useState(null)

  const openCreate = () => {
    setEditLesson(null)
    setForm({ ...EMPTY_FORM, order: lessons.length + 1 })
    setError('')
    setModal(true)
  }
  const openEdit = (l) => {
    setEditLesson(l)
    setForm({
      title:        l.title,
      description:  l.description  || '',
      youtubeUrl:   l.youtubeUrl   || '',
      resourceLink: l.resourceLink || '',
      order:        l.order        || 0,
    })
    setError('')
    setModal(true)
  }
  const closeModal = () => { setModal(false); setError('') }

  const handleSave = async () => {
    if (!form.title.trim()) return setError('Lesson title is required.')
    setSaving(true)
    setError('')
    try {
      const payload = {
        courseId,
        title:        form.title.trim(),
        description:  form.description.trim(),
        youtubeUrl:   form.youtubeUrl.trim(),
        resourceLink: form.resourceLink.trim(),
        order:        Number(form.order) || lessons.length + 1,
      }
      if (editLesson) {
        await updateLesson(editLesson.id, payload)
        setLessons(ls =>
          ls.map(l => l.id === editLesson.id ? { ...l, ...payload } : l)
            .sort((a, b) => a.order - b.order)
        )
      } else {
        const ref = await createLesson(payload)
        setLessons(ls =>
          [...ls, { id: ref.id, ...payload }].sort((a, b) => a.order - b.order)
        )
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
    await deleteLesson(deleteId)
    setLessons(ls => ls.filter(l => l.id !== deleteId))
    setDeleteId(null)
    setDeleting(false)
  }

  const getYtThumb = (url) => {
    const id = extractYouTubeId(url)
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null
  }

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={() => navigate('/admin/courses')}
          className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Back to Courses
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Manage Lessons</h1>
          <p className="text-dark-400 text-sm mt-1">Add lessons and manage quizzes.</p>
        </div>
        <button onClick={openCreate} className="btn-primary shrink-0">
          <Plus size={16} /> Add Lesson
        </button>
      </div>

      {/* Lessons list */}
      {loading ? (
        <Spinner text="Loading lessons..." />
      ) : lessons.length === 0 ? (
        <EmptyState
          icon={PlayCircle}
          title="No lessons yet"
          description="Add your first lesson to this course."
          action={
            <button onClick={openCreate} className="btn-primary">
              <Plus size={15} /> Add Lesson
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, i) => {
            const thumb = getYtThumb(lesson.youtubeUrl)
            return (
              <div
                key={lesson.id}
                className="card border border-dark-800 p-4 flex items-center gap-4
                           hover:border-dark-700 transition-all"
              >
                {/* Order */}
                <div className="w-8 h-8 rounded-lg bg-dark-800 flex items-center justify-center shrink-0">
                  <span className="text-xs font-display font-700 text-dark-400">
                    {lesson.order || i + 1}
                  </span>
                </div>

                {/* Thumbnail */}
                <div className="w-24 h-14 rounded-lg overflow-hidden bg-dark-800 shrink-0">
                  {thumb ? (
                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PlayCircle size={18} className="text-dark-600" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-display font-600 text-sm truncate">
                    {lesson.title}
                  </p>
                  {lesson.description && (
                    <p className="text-dark-500 text-xs mt-0.5 line-clamp-1">
                      {lesson.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    {lesson.youtubeUrl && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                        <PlayCircle size={9} /> Video
                      </span>
                    )}
                    {lesson.resourceLink && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
                        <FileText size={9} /> Resource
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {/* Quiz button */}
                  <button
                    onClick={() => setQuizLesson(lesson)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                               font-display font-600 bg-brand-600/10 border border-brand-600/25
                               text-brand-400 hover:bg-brand-600/20 transition-all"
                  >
                    <HelpCircle size={12} /> Quiz
                  </button>
                  <button
                    onClick={() => openEdit(lesson)}
                    className="btn-secondary px-3 py-1.5 text-xs"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteId(lesson.id)}
                    className="btn-danger px-3 py-1.5 text-xs"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modal}
        onClose={closeModal}
        title={editLesson ? 'Edit Lesson' : 'Add New Lesson'}
        width="max-w-xl"
      >
        <div className="space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-600/10 border border-red-600/20 text-red-400 text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Lesson Title</label>
              <input
                type="text" className="input"
                placeholder="e.g. Introduction to HTML"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea
                rows={2} className="input resize-none"
                placeholder="What will students learn?"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <label className="label">YouTube Video URL</label>
              <div className="relative">
                <PlayCircle size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                <input
                  type="url" className="input pl-9"
                  placeholder="https://youtube.com/watch?v=..."
                  value={form.youtubeUrl}
                  onChange={e => setForm(f => ({ ...f, youtubeUrl: e.target.value }))}
                />
              </div>
              {form.youtubeUrl && extractYouTubeId(form.youtubeUrl) && (
                <div className="mt-2 w-full aspect-video rounded-lg overflow-hidden bg-dark-800">
                  <img
                    src={`https://img.youtube.com/vi/${extractYouTubeId(form.youtubeUrl)}/mqdefault.jpg`}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            <div className="col-span-2">
              <label className="label">Resource Link (Google Drive)</label>
              <div className="relative">
                <Link2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                <input
                  type="url" className="input pl-9"
                  placeholder="https://drive.google.com/..."
                  value={form.resourceLink}
                  onChange={e => setForm(f => ({ ...f, resourceLink: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="label">Lesson Order</label>
              <input
                type="number" min="1" className="input"
                value={form.order}
                onChange={e => setForm(f => ({ ...f, order: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
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
              ) : editLesson ? 'Save Changes' : 'Add Lesson'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Quiz Manager Modal */}
      <QuizManager
        open={!!quizLesson}
        onClose={() => setQuizLesson(null)}
        lesson={quizLesson}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Lesson"
        message="This will permanently delete this lesson, its quiz, and all student progress for it."
      />
    </PageWrapper>
  )
}