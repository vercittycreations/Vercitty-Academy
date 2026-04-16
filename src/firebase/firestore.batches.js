import {
  collection, doc, getDoc, getDocs, setDoc, addDoc,
  updateDoc, deleteDoc, query, where, orderBy, limit,
  onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'

// ─── BATCHES ──────────────────────────────────────────────────────────────────
export const createBatch = (data) =>
  addDoc(collection(db, 'batches'), { ...data, status: 'draft', createdAt: serverTimestamp() })

export const updateBatch = (batchId, data) =>
  updateDoc(doc(db, 'batches', batchId), data)

export const deleteBatch = (batchId) =>
  deleteDoc(doc(db, 'batches', batchId))

export const getAllBatches = async () => {
  const snap = await getDocs(collection(db, 'batches'))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const ta = a.createdAt?.toDate?.() || new Date(0)
      const tb = b.createdAt?.toDate?.() || new Date(0)
      return tb - ta
    })
}

export const getBatch = async (batchId) => {
  const snap = await getDoc(doc(db, 'batches', batchId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// ─── BATCH MEMBERS ────────────────────────────────────────────────────────────
export const addUserToBatch = async (batchId, userId) => {
  const q = query(
    collection(db, 'batchMembers'),
    where('batchId', '==', batchId),
    where('userId',  '==', userId)
  )
  const snap = await getDocs(q)
  if (snap.empty) {
    await addDoc(collection(db, 'batchMembers'), {
      batchId, userId, joinedAt: serverTimestamp()
    })
  }
}

export const removeUserFromBatch = async (batchId, userId) => {
  const q = query(
    collection(db, 'batchMembers'),
    where('batchId', '==', batchId),
    where('userId',  '==', userId)
  )
  const snap = await getDocs(q)
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
}

export const getBatchMembers = async (batchId) => {
  const q    = query(collection(db, 'batchMembers'), where('batchId', '==', batchId))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data().userId)
}

export const getUserActiveBatch = async (userId) => {
  const q    = query(collection(db, 'batchMembers'), where('userId', '==', userId))
  const snap = await getDocs(q)
  if (snap.empty) return null

  const batchIds = snap.docs.map(d => d.data().batchId)
  const batches  = await Promise.all(batchIds.map(id => getBatch(id)))
  const valid    = batches.filter(Boolean)

  // Prefer active, then draft, then anything
  return (
    valid.find(b => b.status === 'active') ||
    valid.find(b => b.status === 'draft')  ||
    valid[0] ||
    null
  )
}

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────
export const createAnnouncement = (data) =>
  addDoc(collection(db, 'announcements'), { ...data, createdAt: serverTimestamp() })

export const updateAnnouncement = (id, data) =>
  updateDoc(doc(db, 'announcements', id), data)

export const deleteAnnouncement = (id) =>
  deleteDoc(doc(db, 'announcements', id))

// Real-time listener — no compound index needed (filter in JS)
export const subscribeToAnnouncements = (batchId, callback) => {
  const q = query(collection(db, 'announcements'), limit(20))
  return onSnapshot(q, snap => {
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    // Filter: show global (no batchId) OR matching batchId
    const filtered = all
      .filter(a => !a.batchId || a.batchId === batchId)
      .sort((a, b) => {
        const ta = a.createdAt?.toDate?.() || new Date(0)
        const tb = b.createdAt?.toDate?.() || new Date(0)
        return tb - ta
      })
    callback(filtered)
  })
}

export const getAllAnnouncements = async () => {
  const snap = await getDocs(collection(db, 'announcements'))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const ta = a.createdAt?.toDate?.() || new Date(0)
      const tb = b.createdAt?.toDate?.() || new Date(0)
      return tb - ta
    })
}

// ─── SUBMISSIONS ──────────────────────────────────────────────────────────────
export const submitAssignment = async (data) => {
  // Check if already submitted for this lesson
  const q = query(
    collection(db, 'submissions'),
    where('userId',   '==', data.userId),
    where('lessonId', '==', data.lessonId)
  )
  const snap = await getDocs(q)
  if (!snap.empty) {
    // Update existing submission
    await updateDoc(snap.docs[0].ref, {
      workLink:    data.workLink,
      submittedAt: serverTimestamp(),
      status:      'pending',
    })
    return snap.docs[0].ref
  }
  return addDoc(collection(db, 'submissions'), {
    ...data,
    status:      'pending',
    feedback:    '',
    submittedAt: serverTimestamp(),
  })
}

// FIX: Only filter by batchId (single field) — no compound index needed
// Sort client-side to avoid missing index error
export const getAllSubmissions = async (batchId) => {
  if (!batchId) return []
  try {
    const q    = query(collection(db, 'submissions'), where('batchId', '==', batchId))
    const snap = await getDocs(q)
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const ta = a.submittedAt?.toDate?.() || new Date(0)
        const tb = b.submittedAt?.toDate?.() || new Date(0)
        return tb - ta  // newest first
      })
  } catch (err) {
    console.error('getAllSubmissions error:', err)
    return []
  }
}

export const getMySubmissions = async (userId, batchId) => {
  if (!userId || !batchId) return []
  try {
    const q    = query(
      collection(db, 'submissions'),
      where('userId',  '==', userId),
      where('batchId', '==', batchId)
    )
    const snap = await getDocs(q)
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.dayNumber - b.dayNumber)
  } catch (err) {
    console.error('getMySubmissions error:', err)
    return []
  }
}

export const reviewSubmission = (submissionId, feedback) =>
  updateDoc(doc(db, 'submissions', submissionId), {
    status:     'reviewed',
    feedback,
    reviewedAt: serverTimestamp(),
  })

// ─── READING MODULES ──────────────────────────────────────────────────────────
export const createReadingModule = (data) =>
  addDoc(collection(db, 'readingModules'), { ...data, createdAt: serverTimestamp() })

export const updateReadingModule = (id, data) =>
  updateDoc(doc(db, 'readingModules', id), data)

export const deleteReadingModule = (id) =>
  deleteDoc(doc(db, 'readingModules', id))

export const getReadingModulesForLesson = async (lessonId) => {
  if (!lessonId) return []
  try {
    const q    = query(collection(db, 'readingModules'), where('lessonId', '==', lessonId))
    const snap = await getDocs(q)
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  } catch (err) {
    console.error('getReadingModulesForLesson error:', err)
    return []
  }
}

export const saveReadingResponse = (userId, moduleId, answers) =>
  setDoc(doc(db, 'readingResponses', `${userId}_${moduleId}`), {
    userId, moduleId, answers, completedAt: serverTimestamp()
  })

export const getReadingResponse = async (userId, moduleId) => {
  if (!userId || !moduleId) return null
  try {
    const snap = await getDoc(doc(db, 'readingResponses', `${userId}_${moduleId}`))
    return snap.exists() ? snap.data() : null
  } catch (err) {
    return null
  }
}