import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Pencil, Trash2,
  PlayCircle, FileText, Link2, HelpCircle, X,
  BookOpen, ClipboardList
} from 'lucide-react'
import PageWrapper   from '../../components/layout/PageWrapper'
import Modal         from '../../components/admin/Modal'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import QuizManager   from '../../components/admin/QuizManager'
import Spinner       from '../../components/ui/Spinner'
import EmptyState    from '../../components/ui/EmptyState'
import { useLessons } from '../../hooks/useLessons'
import { createLesson, updateLesson, deleteLesson } from '../../firebase/firestore'
import { extractYouTubeId } from '../../utils/youtube'

const RESOURCE_TYPES = [
  { value: 'video',   label: 'Video'   },
  { value: 'article', label: 'Article' },
  { value: 'pdf',     label: 'PDF'     },
  { value: 'github',  label: 'GitHub'  },
  { value: 'other',   label: 'Other'   },
]

const EMPTY_FORM = {
  title: '', description: '', youtubeUrl: '',
  order: 0, dayNumber: '', resources: [],
  assignmentTitle: '', assignmentDescription: '',
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
  const [quizLesson, setQuizLesson] = useState(null)

  const openCreate = () => {
    setEditLesson(null)
    setForm({ ...EMPTY_FORM, order: lessons.length + 1 })
    setError('')
    setModal(true)
  }

  const openEdit = (l) => {
    setEditLesson(l)
    let resources = l.resources || []
    if (resources.length === 0 && l.resourceLink) {
      resources = [{ label: 'Resource', url: l.resourceLink, type: 'other' }]
    }
    setForm({
      title:                 l.title,
      description:           l.description           || '',
      youtubeUrl:            l.youtubeUrl            || '',
      order:                 l.order                 || 0,
      dayNumber:             l.dayNumber             || '',
      resources,
      assignmentTitle:       l.assignmentTitle       || '',
      assignmentDescription: l.assignmentDescription || '',
    })
    setError('')
    setModal(true)
  }

  const closeModal = () => { setModal(false); setError('') }

  const addResource = () =>
    setForm(f => ({ ...f, resources: [...f.resources, { label: '', url: '', type: 'other' }] }))

  const removeResource = (i) =>
    setForm(f => ({ ...f, resources: f.resources.filter((_, idx) => idx !== i) }))

  const updateResource = (i, field, value) =>
    setForm(f => ({
      ...f,
      resources: f.resources.map((r, idx) => idx === i ? { ...r, [field]: value } : r)
    }))

  const handleSave = async () => {
    if (!form.title.trim()) return setError('Lesson title is required.')
    if (form.dayNumber && (isNaN(form.dayNumber) || form.dayNumber < 1 || form.dayNumber > 30)) {
      return setError('Day number 1 aur 30 ke beech hona chahiye.')
    }
    setSaving(true)
    setError('')
    try {
      const validResources = form.resources.filter(r => r.url?.trim())
      const payload = {
        courseId,
        title:                 form.title.trim(),
        description:           form.description.trim(),
        youtubeUrl:            form.youtubeUrl.trim(),
        order:                 Number(form.order) || lessons.length + 1,
        dayNumber:             form.dayNumber ? Number(form.dayNumber) : null,
        resources:             validResources,
        resourceLink:          validResources[0]?.url || '',
        assignmentTitle:       form.assignmentTitle.trim(),
        assignmentDescription: form.assignmentDescription.trim(),
      }
      if (editLesson) {
        await updateLesson(editLesson.id, payload)
        setLessons(ls =>
          ls.map(l => l.id === editLesson.id ? { ...l, ...payload } : l)
            .sort((a, b) => (a.dayNumber || a.order) - (b.dayNumber || b.order))
        )
      } else {
        const ref = await createLesson(payload)
        setLessons(ls =>
          [...ls, { id: ref.id, ...payload }]
            .sort((a, b) => (a.dayNumber || a.order) - (b.dayNumber || b.order))
        )
      }
      closeModal()
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally { setSaving(false) }
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
          <p className="text-dark-400 text-sm mt-1">Lessons, resources, quizzes aur assignments manage karo.</p>
        </div>
        <button onClick={openCreate} className="btn-primary shrink-0">
          <Plus size={16} /> Add Lesson
        </button>
      </div>

      {loading ? (
        <Spinner text="Loading lessons..." />
      ) : lessons.length === 0 ? (
        <EmptyState
          icon={PlayCircle}
          title="No lessons yet"
          description="Add your first lesson."
          action={<button onClick={openCreate} className="btn-primary"><Plus size={15} /> Add Lesson</button>}
        />
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, i) => {
            const thumb     = getYtThumb(lesson.youtubeUrl)
            const resources = lesson.resources?.length > 0
              ? lesson.resources
              : lesson.resourceLink
                ? [{ label: 'Resource', url: lesson.resourceLink, type: 'other' }]
                : []

            return (
              <div key={lesson.id}
                   className="card border border-dark-800 p-4 flex items-center gap-4 hover:border-dark-700 transition-all">
                <div className="w-8 h-8 rounded-lg bg-dark-800 flex items-center justify-center shrink-0">
                  <span className="text-xs font-display font-700 text-dark-400">{lesson.order || i + 1}</span>
                </div>

                {lesson.dayNumber && (
                  <div className="w-14 h-8 rounded-lg bg-brand-600/15 border border-brand-600/25
                                  flex items-center justify-center shrink-0">
                    <span className="text-xs font-display font-700 text-brand-400">
                      Day {lesson.dayNumber}
                    </span>
                  </div>
                )}

                <div className="w-24 h-14 rounded-lg overflow-hidden bg-dark-800 shrink-0">
                  {thumb
                    ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <PlayCircle size={18} className="text-dark-600" />
                      </div>
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white font-display font-600 text-sm truncate">{lesson.title}</p>
                  {lesson.description && (
                    <p className="text-dark-500 text-xs mt-0.5 line-clamp-1">{lesson.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {lesson.youtubeUrl && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                        <PlayCircle size={9} /> Video
                      </span>
                    )}
                    {resources.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
                        <FileText size={9} /> {resources.length} resource{resources.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {lesson.assignmentTitle && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-purple-400">
                        <ClipboardList size={9} /> Assignment
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <button
                    onClick={() => setQuizLesson(lesson)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                               font-display font-600 bg-brand-600/10 border border-brand-600/25
                               text-brand-400 hover:bg-brand-600/20 transition-all"
                  >
                    <HelpCircle size={12} /> Quiz
                  </button>
                  <button onClick={() => openEdit(lesson)} className="btn-secondary px-3 py-1.5 text-xs">
                    <Pencil size={12} /> Edit
                  </button>
                  <button onClick={() => setDeleteId(lesson.id)} className="btn-danger px-3 py-1.5 text-xs">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modal} onClose={closeModal}
             title={editLesson ? 'Edit Lesson' : 'Add New Lesson'}
             width="max-w-xl">
        <div className="space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-600/10 border border-red-600/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Lesson Title</label>
              <input type="text" className="input" placeholder="e.g. Introduction to HTML"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="label">Day Number (1–30)</label>
              <input type="number" min="1" max="30" className="input"
                placeholder="e.g. 1"
                value={form.dayNumber}
                onChange={e => setForm(f => ({ ...f, dayNumber: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea rows={2} className="input resize-none"
              placeholder="What will students learn?"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div>
            <label className="label">YouTube Video URL</label>
            <div className="relative">
              <PlayCircle size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
              <input type="url" className="input pl-9" placeholder="https://youtube.com/watch?v=..."
                value={form.youtubeUrl}
                onChange={e => setForm(f => ({ ...f, youtubeUrl: e.target.value }))} />
            </div>
            {form.youtubeUrl && extractYouTubeId(form.youtubeUrl) && (
              <div className="mt-2 w-full aspect-video rounded-lg overflow-hidden bg-dark-800">
                <img
                  src={`https://img.youtube.com/vi/${extractYouTubeId(form.youtubeUrl)}/mqdefault.jpg`}
                  alt="Preview" className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="h-px bg-dark-800" />
          <div>
            <label className="label flex items-center gap-2">
              <ClipboardList size={12} className="text-purple-400" />
              Assignment
            </label>
            <input type="text" className="input mb-2"
              placeholder="Assignment title (e.g. Build a navbar)"
              value={form.assignmentTitle}
              onChange={e => setForm(f => ({ ...f, assignmentTitle: e.target.value }))} />
            <textarea rows={3} className="input resize-none"
              placeholder="Full assignment description — what students need to do..."
              value={form.assignmentDescription}
              onChange={e => setForm(f => ({ ...f, assignmentDescription: e.target.value }))} />
          </div>

          <div className="h-px bg-dark-800" />
          <div>
            <label className="label">Resources</label>
            <div className="space-y-2 mb-2">
              {form.resources.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    className="input shrink-0"
                    style={{ width: '110px' }}
                    value={r.type || 'other'}
                    onChange={e => updateResource(i, 'type', e.target.value)}
                  >
                    {RESOURCE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="input shrink-0"
                    style={{ width: '110px' }}
                    placeholder="Label"
                    value={r.label}
                    onChange={e => updateResource(i, 'label', e.target.value)}
                  />
                  <div className="relative flex-1">
                    <Link2 size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                    <input
                      type="url"
                      className="input pl-8 w-full"
                      placeholder="https://..."
                      value={r.url}
                      onChange={e => updateResource(i, 'url', e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => removeResource(i)}
                    className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-600/20
                               flex items-center justify-center text-red-400 hover:bg-red-600/20
                               transition-all shrink-0"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addResource} className="btn-secondary text-xs">
              <Plus size={12} /> Add Resource
            </button>
          </div>

          <div>
            <label className="label">Lesson Order</label>
            <input type="number" min="1" className="input" style={{ maxWidth: '120px' }}
              value={form.order}
              onChange={e => setForm(f => ({ ...f, order: e.target.value }))} />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={closeModal} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                : editLesson ? 'Save Changes' : 'Add Lesson'
              }
            </button>
          </div>
        </div>
      </Modal>

      <QuizManager
        open={!!quizLesson}
        onClose={() => setQuizLesson(null)}
        lesson={quizLesson}
      />

      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Lesson"
        message="This will permanently delete this lesson, its quiz, and all student progress for it."
      />
    </PageWrapper>
  )
}