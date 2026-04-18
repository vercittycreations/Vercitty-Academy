import { useState, useEffect } from 'react'
import { Users, Plus, Pencil, Trash2, Search, Copy, Check } from 'lucide-react'
import PageWrapper   from '../../components/layout/PageWrapper'
import Modal         from '../../components/admin/Modal'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import Spinner       from '../../components/ui/Spinner'
import EmptyState    from '../../components/ui/EmptyState'
import { getAllUsers, createUserDoc, updateUserDoc, deleteUserDoc } from '../../firebase/firestore'
import { createUser } from '../../firebase/auth'

const EMPTY_FORM = { name: '', email: '', password: '', role: 'user' }

export default function ManageUsers() {
  const [users,    setUsers]    = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [modal,    setModal]    = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [saving,   setSaving]   = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [error,    setError]    = useState('')
  const [copiedId, setCopiedId] = useState(null)

  const load = async () => {
    setLoading(true)
    const data = await getAllUsers()
    setUsers(data); setFiltered(data); setLoading(false)
  }
  useEffect(() => { load() }, [])
  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(users.filter(u =>
      u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    ))
  }, [search, users])

  const openCreate = () => { setEditUser(null); setForm(EMPTY_FORM); setError(''); setModal(true) }
  const openEdit   = (u) => {
    setEditUser(u)
    setForm({ name: u.name, email: u.email, password: '', role: u.role || 'user' })
    setError(''); setModal(true)
  }
  const closeModal = () => { setModal(false); setError('') }

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) return setError('Name and email required.')
    if (!editUser && !form.password.trim())       return setError('Password required for new users.')
    if (!editUser && form.password.length < 6)    return setError('Password min 6 characters.')
    setSaving(true); setError('')
    try {
      if (editUser) {
        await updateUserDoc(editUser.id, { name: form.name, role: form.role })
      } else {
        const cred = await createUser(form.email, form.password)
        await createUserDoc(cred.user.uid, { name: form.name, email: form.email, role: form.role })
      }
      await load(); closeModal()
    } catch (err) {
      setError(err.code === 'auth/email-already-in-use'
        ? 'Email already registered.' : err.message || 'Something went wrong.')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    await deleteUserDoc(deleteId)
    setDeleteId(null); setDeleting(false); await load()
  }

  const copyEmail = (email, id) => {
    navigator.clipboard.writeText(email)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <PageWrapper>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Manage Users</h1>
          <p className="text-dark-400 text-sm mt-1">Create and manage student accounts.</p>
        </div>
        <button onClick={openCreate} className="btn-primary shrink-0 w-full sm:w-auto justify-center">
          <Plus size={16}/> Add User
        </button>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none"/>
        <input type="text" placeholder="Search users..." value={search}
          onChange={e => setSearch(e.target.value)} className="input pl-9"/>
      </div>

      {loading ? <Spinner text="Loading users..."/> :
       filtered.length === 0 ? (
        <EmptyState icon={Users}
          title={search ? 'No users found' : 'No users yet'}
          action={!search && <button onClick={openCreate} className="btn-primary"><Plus size={15}/> Add User</button>}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-dark-800">
            <span className="text-xs text-dark-500">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          {/* Mobile: card list. Desktop: table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-dark-800 bg-dark-900/60">
                  {['User', 'Email', 'Role', 'Actions'].map(h => (
                    <th key={h} className={`px-5 py-3 text-xs font-display font-600 text-dark-400 uppercase tracking-wider
                                            ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id}
                    className={`${i < filtered.length - 1 ? 'border-b border-dark-800/50' : ''}
                                hover:bg-dark-800/30 transition-colors`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-600/20 border border-brand-600/30
                                        flex items-center justify-center shrink-0">
                          <span className="text-brand-400 font-700 text-xs">{u.name?.[0]?.toUpperCase() || 'U'}</span>
                        </div>
                        <span className="text-white font-body font-500">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-dark-300 font-body truncate max-w-[200px]">{u.email}</span>
                        <button onClick={() => copyEmail(u.email, u.id)} className="text-dark-600 hover:text-dark-300 shrink-0">
                          {copiedId === u.id ? <Check size={12} className="text-emerald-400"/> : <Copy size={12}/>}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ${u.role === 'admin'
                        ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                        : 'bg-brand-600/15 text-brand-400 border border-brand-600/20'}`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(u)} className="btn-secondary px-3 py-1.5 text-xs"><Pencil size={12}/></button>
                        <button onClick={() => setDeleteId(u.id)} className="btn-danger px-3 py-1.5 text-xs"><Trash2 size={12}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden divide-y divide-dark-800/50">
            {filtered.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-9 h-9 rounded-full bg-brand-600/20 border border-brand-600/30
                                flex items-center justify-center shrink-0">
                  <span className="text-brand-400 font-700 text-sm">{u.name?.[0]?.toUpperCase() || 'U'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-display font-600 text-sm truncate">{u.name}</p>
                  <p className="text-dark-400 text-xs truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => openEdit(u)} className="btn-secondary px-2.5 py-1.5 text-xs"><Pencil size={11}/></button>
                  <button onClick={() => setDeleteId(u.id)} className="btn-danger px-2.5 py-1.5 text-xs"><Trash2 size={11}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={modal} onClose={closeModal} title={editUser ? 'Edit User' : 'Create New User'}>
        <div className="space-y-4">
          {error && <div className="px-4 py-3 rounded-lg bg-red-600/10 border border-red-600/20 text-red-400 text-sm">{error}</div>}
          <div>
            <label className="label">Full Name</label>
            <input type="text" className="input" placeholder="John Doe"
              value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}/>
          </div>
          <div>
            <label className="label">Email Address</label>
            <input type="email" className={`input ${editUser ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder="john@example.com" value={form.email}
              onChange={e => setForm(f => ({...f, email: e.target.value}))} disabled={!!editUser}/>
            {editUser && <p className="text-xs text-dark-500 mt-1">Email cannot be changed after creation.</p>}
          </div>
          {!editUser && (
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="Min. 6 characters"
                value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))}/>
            </div>
          )}
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}>
              <option value="user">User (Student)</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={closeModal} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Saving...</> : editUser ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        loading={deleting} title="Delete User" message="User account permanently delete ho jayega."/>
    </PageWrapper>
  )
}