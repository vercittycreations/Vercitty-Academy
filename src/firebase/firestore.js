import {
  collection, doc, getDoc, getDocs, setDoc, addDoc,
  updateDoc, deleteDoc, query, where, orderBy,
  onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'

// ─── USERS ────────────────────────────────────────────────────────────────────
export const createUserDoc = (uid, data) =>
  setDoc(doc(db, 'users', uid), { ...data, role: 'user', createdAt: serverTimestamp() })

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
  addDoc(collection(db, 'courses'), { ...data, createdAt: serverTimestamp() })

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

// ─── USER COURSES (ASSIGNMENTS) ───────────────────────────────────────────────
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

// ─── BOOKMARKS ────────────────────────────────────────────────────────────────
export const toggleBookmark = async (userId, lessonId, courseId) => {
  const ref = doc(db, 'bookmarks', `${userId}_${lessonId}`)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    await deleteDoc(ref)
    return false
  } else {
    await setDoc(ref, { userId, lessonId, courseId, savedAt: serverTimestamp() })
    return true
  }
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

// ─── LAST LESSON (RESUME) ─────────────────────────────────────────────────────
export const saveLastLesson = (userId, courseId, lessonId) =>
  setDoc(doc(db, 'lastLesson', `${userId}_${courseId}`), {
    userId, courseId, lessonId, updatedAt: serverTimestamp()
  })

export const getLastLesson = async (userId, courseId) => {
  const snap = await getDoc(doc(db, 'lastLesson', `${userId}_${courseId}`))
  return snap.exists() ? snap.data().lessonId : null
}

// ─── QUESTION BANK ────────────────────────────────────────────────────────────
// Each question: { question, options:[A,B,C,D], correctIndex, topic, difficulty }

export const createBankQuestion = (data) =>
  addDoc(collection(db, 'questionBank'), {
    ...data,
    createdAt: serverTimestamp(),
  })

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

// ─── QUIZ (attached to lesson — picks from bank OR custom) ────────────────────
// quizQuestions/{lessonId} → { lessonId, questionIds: [...] }
// questionIds are IDs from questionBank collection

export const setLessonQuiz = (lessonId, questionIds) =>
  setDoc(doc(db, 'quizQuestions', lessonId), {
    lessonId,
    questionIds,
    updatedAt: serverTimestamp(),
  })

export const getLessonQuizIds = async (lessonId) => {
  const snap = await getDoc(doc(db, 'quizQuestions', lessonId))
  return snap.exists() ? (snap.data().questionIds || []) : []
}

// Get full question objects for a lesson
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