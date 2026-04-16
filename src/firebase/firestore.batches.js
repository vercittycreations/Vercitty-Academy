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
  const q    = query(collection(db, 'batchMembers'), where('batchId', '==', batchId), where('userId', '==', userId))
  const snap = await getDocs(q)
  if (snap.empty) {
    await addDoc(collection(db, 'batchMembers'), { batchId, userId, joinedAt: serverTimestamp() })
  }
}

export const removeUserFromBatch = async (batchId, userId) => {
  const q    = query(collection(db, 'batchMembers'), where('batchId', '==', batchId), where('userId', '==', userId))
  const snap = await getDocs(q)
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
}

export const getBatchMembers = async (batchId) => {
  const q    = query(collection(db, 'batchMembers'), where('batchId', '==', batchId))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data().userId)
}

export const getUserActiveBatch = async (userId) => {
  const q     = query(collection(db, 'batchMembers'), where('userId', '==', userId))
  const snap  = await getDocs(q)
  if (snap.empty) return null
  const batchIds = snap.docs.map(d => d.data().batchId)
  const batches  = await Promise.all(batchIds.map(id => getBatch(id)))
  const valid    = batches.filter(Boolean)
  return valid.find(b => b.status === 'active') || valid.find(b => b.status === 'draft') || valid[0] || null
}

// ─── CERTIFICATE LINKS ────────────────────────────────────────────────────────
// Admin sets a Google Drive link per student per batch
export const setCertificateLink = (batchId, userId, driveLink) =>
  setDoc(doc(db, 'certificates', `${batchId}_${userId}`), {
    batchId, userId, driveLink, updatedAt: serverTimestamp()
  })

export const getCertificateLink = async (batchId, userId) => {
  if (!batchId || !userId) return null
  const snap = await getDoc(doc(db, 'certificates', `${batchId}_${userId}`))
  return snap.exists() ? snap.data().driveLink : null
}

export const getAllCertificatesForBatch = async (batchId) => {
  const q    = query(collection(db, 'certificates'), where('batchId', '==', batchId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────
export const createAnnouncement = (data) =>
  addDoc(collection(db, 'announcements'), { ...data, createdAt: serverTimestamp() })

export const updateAnnouncement = (id, data) =>
  updateDoc(doc(db, 'announcements', id), data)

export const deleteAnnouncement = (id) =>
  deleteDoc(doc(db, 'announcements', id))

export const subscribeToAnnouncements = (batchId, callback) => {
  const q = query(collection(db, 'announcements'), limit(20))
  return onSnapshot(q, snap => {
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
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
    .sort((a, b) => (b.createdAt?.toDate?.() || new Date(0)) - (a.createdAt?.toDate?.() || new Date(0)))
}

// ─── SUBMISSIONS ──────────────────────────────────────────────────────────────
export const submitAssignment = async (data) => {
  const q    = query(collection(db, 'submissions'), where('userId', '==', data.userId), where('lessonId', '==', data.lessonId))
  const snap = await getDocs(q)
  if (!snap.empty) {
    await updateDoc(snap.docs[0].ref, { workLink: data.workLink, submittedAt: serverTimestamp(), status: 'pending' })
    return snap.docs[0].ref
  }
  return addDoc(collection(db, 'submissions'), { ...data, status: 'pending', feedback: '', submittedAt: serverTimestamp() })
}

export const getAllSubmissions = async (batchId) => {
  if (!batchId) return []
  try {
    const q    = query(collection(db, 'submissions'), where('batchId', '==', batchId))
    const snap = await getDocs(q)
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.submittedAt?.toDate?.() || new Date(0)) - (a.submittedAt?.toDate?.() || new Date(0)))
  } catch (err) { console.error('getAllSubmissions:', err); return [] }
}

export const getMySubmissions = async (userId, batchId) => {
  if (!userId || !batchId) return []
  try {
    const q    = query(collection(db, 'submissions'), where('userId', '==', userId), where('batchId', '==', batchId))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.dayNumber - b.dayNumber)
  } catch (err) { console.error('getMySubmissions:', err); return [] }
}

export const reviewSubmission = (submissionId, feedback) =>
  updateDoc(doc(db, 'submissions', submissionId), { status: 'reviewed', feedback, reviewedAt: serverTimestamp() })

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
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0))
  } catch (err) { console.error('getReadingModules:', err); return [] }
}

// Standalone reading modules (not tied to a lesson — for the dedicated Reading Page)
export const createStandaloneModule = (data) =>
  addDoc(collection(db, 'readingPages'), { ...data, createdAt: serverTimestamp() })

export const updateStandaloneModule = (id, data) =>
  updateDoc(doc(db, 'readingPages', id), data)

export const deleteStandaloneModule = (id) =>
  deleteDoc(doc(db, 'readingPages', id))

export const getAllReadingPages = async () => {
  const snap = await getDocs(collection(db, 'readingPages'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0))
}

export const getReadingPagesForBatch = async (batchId) => {
  if (!batchId) return getAllReadingPages()
  const q    = query(collection(db, 'readingPages'), where('batchId', '==', batchId))
  const snap = await getDocs(q)
  if (snap.empty) return getAllReadingPages()
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0))
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
  } catch { return null }
}

export const getMyReadingResponses = async (userId) => {
  if (!userId) return {}
  const q    = query(collection(db, 'readingResponses'), where('userId', '==', userId))
  const snap = await getDocs(q)
  const map  = {}
  snap.docs.forEach(d => { map[d.data().moduleId] = d.data() })
  return map
}