import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Plus, Pencil, Trash2, Layers,
  Eye, EyeOff, Globe
} from 'lucide-react'
import PageWrapper   from '../../components/layout/PageWrapper'
import Modal         from '../../components/admin/Modal'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import Spinner       from '../../components/ui/Spinner'
import EmptyState    from '../../components/ui/EmptyState'
import { useAllCourses }  from '../../hooks/useCourses'
import {
  createCourse, updateCourse, deleteCourse, updateCourseStatus
} from '../../firebase/firestore'

const EMPTY_FORM = { title: '', description: '', thumbnail: '' }
const FILTERS    = ['all', 'published', 'draft']

export default function ManageCourses() {
  const navigate = useNavigate()
  const { courses, loading, setCourses } = useAllCourses()

  const [modal,      setModal]      = useState(false)
  const [editCourse, setEditCourse] = useState(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)
  const [deleteId,   setDeleteId]   = useState(null)
  const [deleting,   setDeleting]   = useState(false)
  const [error,      setError]      = useState('')
  const [filter,     setFilter]     = useState('all')
  const [toggling,   setToggling]   = useState(null) // courseId being toggled

  const openCreate = () => {
    setEditCourse(null)
    setForm(EMPTY_FORM)
    setError('')
    setModal(true)
  }
  const openEdit = (c) => {
    setEditCourse(c)
    setForm({ title: c.title, description: c.description || '', thumbnail: c.thumbnail || '' })
    setError('')
    setModal(true)
  }
  const closeModal = () => { setModal(false); setError('') }

  const handleSave = async () => {
    if (!form.title.trim()) return setError('Course title is required.')
    setSaving(true)
    setError('')
    try {
      if (editCourse) {
        await updateCourse(editCourse.id, { title: form.title, description: form.description, thumbnail: form.thumbnail })
        setCourses(cs => cs.map(c => c.id === editCourse.id ? { ...c, ...form } : c))
      } else {
        const ref = await createCourse({ title: form.title, description: form.description, thumbnail: form.thumbnail, status: 'published' })
        setCourses(cs => [...cs, { id: ref.id, ...form, status: 'published' }])
      }
      closeModal()
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    await deleteCourse(deleteId)
    setCourses(cs => cs.filter(c => c.id !== deleteId))
    setDeleteId(null)
    setDeleting(false)
  }

  const handleToggleStatus = async (course) => {
    const newStatus = course.status === 'draft' ? 'published' : 'draft'
    setToggling(course.id)
    await updateCourseStatus(course.id, newStatus)
    setCourses(cs => cs.map(c => c.id === course.id ? { ...c, status: newStatus } : c))
    setToggling(null)
  }

  const displayed = courses.filter(c => {
    if (filter === 'published') return c.status !== 'draft'
    if (filter === 'draft')     return c.status === 'draft'
    return true
  })

  const publishedCount = courses.filter(c => c.status !== 'draft').length
  const draftCount     = courses.filter(c => c.status === 'draft').length

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Manage Courses</h1>
          <p className="text-dark-400 text-sm mt-1">Create, publish, and manage your course library.</p>
        </div>
        <button onClick={openCreate} className="btn-primary shrink-0">
          <Plus size={16} /> New Course
        </button>
      </div>

      {/* Filter tabs */}
      {!loading && courses.length > 0 && (
        <div className="flex items-center gap-1 p-1 bg-dark-900 border border-dark-800
                        rounded-xl w-fit mb-6">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-display font-600 capitalize
                          transition-all duration-200
                          ${filter === f
                            ? 'bg-brand-600 text-white'
                            : 'text-dark-400 hover:text-white'
                          }`}
            >
              {f}
              {f === 'published' && (
                <span className="ml-1.5 text-[10px] opacity-70">({publishedCount})</span>
              )}
              {f === 'draft' && (
                <span className="ml-1.5 text-[10px] opacity-70">({draftCount})</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <Spinner text="Loading courses..." />
      ) : displayed.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={filter !== 'all' ? `No ${filter} courses` : 'No courses yet'}
          description={filter !== 'all'
            ? `You have no ${filter} courses.`
            : 'Create your first course to get started.'
          }
          action={filter === 'all'
            ? <button onClick={openCreate} className="btn-primary"><Plus size={15} /> New Course</button>
            : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayed.map(course => {
            const isDraft    = course.status === 'draft'
            const isToggling = toggling === course.id

            return (
              <div key={course.id} className={`card overflow-hidden flex flex-col group
                                               hover:border-dark-700 transition-all duration-200
                                               ${isDraft ? 'opacity-80' : ''}`}>
                {/* Thumbnail */}
                <div className="relative w-full aspect-video bg-dark-800 overflow-hidden">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title}
                         className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen size={28} className="text-dark-600" />
                    </div>
                  )}
                  {/* Status badge */}
                  <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-1
                                   rounded-full text-[10px] font-display font-600
                                   ${isDraft
                                     ? 'bg-dark-800/90 text-dark-400 border border-dark-700'
                                     : 'bg-emerald-500/90 text-white'
                                   }`}>
                    {isDraft ? <EyeOff size={9} /> : <Globe size={9} />}
                    {isDraft ? 'Draft' : 'Published'}
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-5">
                  <h3 className="text-white font-display font-600 text-base mb-1 line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-dark-400 text-sm line-clamp-2 flex-1 mb-4">
                    {course.description || 'No description.'}
                  </p>
                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate(`/admin/courses/${course.id}/lessons`)}
                      className="btn-secondary px-3 py-1.5 text-xs flex-1 justify-center"
                    >
                      <Layers size={12} /> Lessons
                    </button>

                    {/* Publish/Draft toggle */}
                    <button
                      onClick={() => handleToggleStatus(course)}
                      disabled={isToggling}
                      className={`px-3 py-1.5 text-xs rounded-lg border font-display font-600
                                  inline-flex items-center gap-1.5 transition-all
                                  ${isDraft
                                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20'
                                    : 'bg-dark-800 border-dark-700 text-dark-400 hover:border-dark-500 hover:text-white'
                                  } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isToggling ? (
                        <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      ) : isDraft ? (
                        <><Eye size={11} /> Publish</>
                      ) : (
                        <><EyeOff size={11} /> Draft</>
                      )}
                    </button>

                    <button
                      onClick={() => openEdit(course)}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => setDeleteId(course.id)}
                      className="btn-danger px-3 py-1.5 text-xs"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={closeModal}
             title={editCourse ? 'Edit Course' : 'Create New Course'}>
        <div className="space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-600/10 border border-red-600/20 text-red-400 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="label">Course Title</label>
            <input type="text" className="input" placeholder="e.g. Website Development Fundamentals"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea rows={3} className="input resize-none"
              placeholder="Brief overview of what students will learn..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Thumbnail URL</label>
            <input type="url" className="input" placeholder="https://..."
              value={form.thumbnail}
              onChange={e => setForm(f => ({ ...f, thumbnail: e.target.value }))} />
          </div>
          {form.thumbnail && (
            <div className="rounded-lg overflow-hidden border border-dark-700 aspect-video bg-dark-800">
              <img src={form.thumbnail} alt="Preview"
                   className="w-full h-full object-cover"
                   onError={e => e.target.style.display = 'none'} />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={closeModal} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                : editCourse ? 'Save Changes' : 'Create Course'
              }
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Course"
        message="This will permanently delete the course and all its lessons. Students will lose access."
      />
    </PageWrapper>
  )
}