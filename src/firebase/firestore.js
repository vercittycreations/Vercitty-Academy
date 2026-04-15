import {
  collection, doc, getDoc, getDocs, setDoc, addDoc,
  updateDoc, deleteDoc, query, where, orderBy, limit,
  onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'

// ─── USERS ────────────────────────────────────────────────────────────────────

/**
 * BUG FIX: previously was `{ ...data, role: 'user' }` which meant the
 * hardcoded role ALWAYS overwrote whatever role was passed in (e.g. 'admin').
 * Now `role: 'user'` is the default that data can override.
 */
export const createUserDoc = (uid, data) =>
  setDoc(doc(db, 'users', uid), {
    role: 'user',       // default — data spread below can override this
    ...data,
    createdAt: serverTimestamp(),
  })

export const getUserDoc = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const getAllUsers = async () => {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const updateUserDoc = (uid, data) =>
  updateDoc(doc(db, 'users', uid), data)

export const deleteUserDoc = (uid) =>
  deleteDoc(doc(db, 'users', uid))

// ─── COURSES ──────────────────────────────────────────────────────────────────
export const createCourse = (data) =>
  addDoc(collection(db, 'courses'), {
    status: 'published', ...data, createdAt: serverTimestamp()
  })

export const getCourse = async (courseId) => {
  const snap = await getDoc(doc(db, 'courses', courseId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const getAllCourses = async () => {
  const snap = await getDocs(collection(db, 'courses'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const updateCourse = (courseId, data) =>
  updateDoc(doc(db, 'courses', courseId), data)

export const updateCourseStatus = (courseId, status) =>
  updateDoc(doc(db, 'courses', courseId), { status })

export const deleteCourse = (courseId) =>
  deleteDoc(doc(db, 'courses', courseId))

// ─── LESSONS ──────────────────────────────────────────────────────────────────
export const createLesson = (data) =>
  addDoc(collection(db, 'lessons'), { ...data, createdAt: serverTimestamp() })

export const getLessonsForCourse = async (courseId) => {
  const q = query(
    collection(db, 'lessons'),
    where('courseId', '==', courseId),
    orderBy('order', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const updateLesson = (lessonId, data) =>
  updateDoc(doc(db, 'lessons', lessonId), data)

export const deleteLesson = (lessonId) =>
  deleteDoc(doc(db, 'lessons', lessonId))

// ─── USER COURSES ─────────────────────────────────────────────────────────────
export const assignCourseToUser = async (userId, courseId) => {
  const q = query(
    collection(db, 'userCourses'),
    where('userId', '==', userId),
    where('courseId', '==', courseId)
  )
  const snap = await getDocs(q)
  if (snap.empty) {
    await addDoc(collection(db, 'userCourses'), {
      userId, courseId, assignedAt: serverTimestamp()
    })
  }
}

export const unassignCourseFromUser = async (userId, courseId) => {
  const q = query(
    collection(db, 'userCourses'),
    where('userId', '==', userId),
    where('courseId', '==', courseId)
  )
  const snap = await getDocs(q)
  snap.docs.forEach(d => deleteDoc(d.ref))
}

export const getCoursesForUser = async (userId) => {
  const q = query(collection(db, 'userCourses'), where('userId', '==', userId))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data().courseId)
}

export const getUsersForCourse = async (courseId) => {
  const q = query(collection(db, 'userCourses'), where('courseId', '==', courseId))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data().userId)
}

export const getAssignmentsForUser = async (userId) => {
  const q = query(collection(db, 'userCourses'), where('userId', '==', userId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const getAllUserCoursesFlat = async () => {
  const snap = await getDocs(collection(db, 'userCourses'))
  return snap.docs.map(d => d.data())
}

// ─── PROGRESS ─────────────────────────────────────────────────────────────────
export const markLessonComplete = async (userId, courseId, lessonId) => {
  const q = query(
    collection(db, 'progress'),
    where('userId', '==', userId),
    where('lessonId', '==', lessonId)
  )
  const snap = await getDocs(q)
  if (snap.empty) {
    await addDoc(collection(db, 'progress'), {
      userId, courseId, lessonId,
      completed: true,
      completedAt: serverTimestamp(),
    })
  }
}

export const getProgressForUserCourse = async (userId, courseId) => {
  const q = query(
    collection(db, 'progress'),
    where('userId', '==', userId),
    where('courseId', '==', courseId),
    where('completed', '==', true)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data().lessonId)
}

export const subscribeToProgress = (userId, courseId, callback) => {
  const q = query(
    collection(db, 'progress'),
    where('userId', '==', userId),
    where('courseId', '==', courseId),
    where('completed', '==', true)
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => d.data().lessonId))
  })
}

// ─── ACTIVITY FEED (real-time) ────────────────────────────────────────────────
export const subscribeToActivityFeed = (callback, limitCount = 25) => {
  const q = query(
    collection(db, 'progress'),
    where('completed', '==', true),
    orderBy('completedAt', 'desc'),
    limit(limitCount)
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

// ─── BOOKMARKS ────────────────────────────────────────────────────────────────
export const toggleBookmark = async (userId, lessonId, courseId) => {
  const ref  = doc(db, 'bookmarks', `${userId}_${lessonId}`)
  const snap = await getDoc(ref)
  if (snap.exists()) { await deleteDoc(ref); return false }
  await setDoc(ref, { userId, lessonId, courseId, savedAt: serverTimestamp() })
  return true
}

export const subscribeToBookmarks = (userId, courseId, callback) => {
  const q = query(
    collection(db, 'bookmarks'),
    where('userId', '==', userId),
    where('courseId', '==', courseId)
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => d.data().lessonId))
  })
}

// ─── NOTES ────────────────────────────────────────────────────────────────────
export const saveNote = (userId, lessonId, text) =>
  setDoc(doc(db, 'notes', `${userId}_${lessonId}`), {
    userId, lessonId, text, updatedAt: serverTimestamp()
  })

export const getNote = async (userId, lessonId) => {
  const snap = await getDoc(doc(db, 'notes', `${userId}_${lessonId}`))
  return snap.exists() ? snap.data().text : ''
}

// ─── LAST LESSON ──────────────────────────────────────────────────────────────
export const saveLastLesson = (userId, courseId, lessonId) =>
  setDoc(doc(db, 'lastLesson', `${userId}_${courseId}`), {
    userId, courseId, lessonId, updatedAt: serverTimestamp()
  })

export const getLastLesson = async (userId, courseId) => {
  const snap = await getDoc(doc(db, 'lastLesson', `${userId}_${courseId}`))
  return snap.exists() ? snap.data().lessonId : null
}

// ─── LOGIN HISTORY ────────────────────────────────────────────────────────────
export const recordLogin = async (userId, userInfo) => {
  try {
    await addDoc(collection(db, 'loginHistory'), {
      userId,
      name:    userInfo.name    || '',
      email:   userInfo.email   || '',
      loginAt: serverTimestamp(),
    })
  } catch (e) {
    // Never block login due to history save failure
    console.warn('Login history save failed:', e)
  }
}

export const getLoginHistory = async (userId, limitCount = 20) => {
  const q = query(
    collection(db, 'loginHistory'),
    where('userId', '==', userId),
    orderBy('loginAt', 'desc'),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const getAllLoginHistory = async (limitCount = 50) => {
  const q = query(
    collection(db, 'loginHistory'),
    orderBy('loginAt', 'desc'),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── COURSE FEEDBACK ──────────────────────────────────────────────────────────
export const saveCourseFeedback = (userId, courseId, data) =>
  setDoc(doc(db, 'courseFeedback', `${userId}_${courseId}`), {
    userId, courseId, ...data, createdAt: serverTimestamp()
  })

export const getCourseFeedback = async (userId, courseId) => {
  const snap = await getDoc(doc(db, 'courseFeedback', `${userId}_${courseId}`))
  return snap.exists() ? snap.data() : null
}

export const getCourseFeedbacks = async (courseId) => {
  const q = query(
    collection(db, 'courseFeedback'),
    where('courseId', '==', courseId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── QUESTION BANK ────────────────────────────────────────────────────────────
export const createBankQuestion = (data) =>
  addDoc(collection(db, 'questionBank'), { ...data, createdAt: serverTimestamp() })

export const getAllBankQuestions = async () => {
  const snap = await getDocs(
    query(collection(db, 'questionBank'), orderBy('createdAt', 'desc'))
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const updateBankQuestion = (id, data) =>
  updateDoc(doc(db, 'questionBank', id), data)

export const deleteBankQuestion = (id) =>
  deleteDoc(doc(db, 'questionBank', id))

// ─── QUIZ ─────────────────────────────────────────────────────────────────────
export const setLessonQuiz = (lessonId, questionIds) =>
  setDoc(doc(db, 'quizQuestions', lessonId), {
    lessonId, questionIds, updatedAt: serverTimestamp()
  })

export const getLessonQuizIds = async (lessonId) => {
  const snap = await getDoc(doc(db, 'quizQuestions', lessonId))
  return snap.exists() ? (snap.data().questionIds || []) : []
}

export const getLessonQuestions = async (lessonId) => {
  const ids = await getLessonQuizIds(lessonId)
  if (ids.length === 0) return []
  const questions = await Promise.all(
    ids.map(async id => {
      const snap = await getDoc(doc(db, 'questionBank', id))
      return snap.exists() ? { id: snap.id, ...snap.data() } : null
    })
  )
  return questions.filter(Boolean)
}

export const deleteLessonQuiz = (lessonId) =>
  deleteDoc(doc(db, 'quizQuestions', lessonId))

// ─── QUIZ RESULTS ─────────────────────────────────────────────────────────────
export const saveQuizResult = (userId, lessonId, data) =>
  setDoc(
    doc(db, 'quizResults', `${userId}_${lessonId}`),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  )

export const getQuizResult = async (userId, lessonId) => {
  const snap = await getDoc(doc(db, 'quizResults', `${userId}_${lessonId}`))
  return snap.exists() ? snap.data() : null
}