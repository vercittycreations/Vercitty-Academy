import {
  collection, doc, getDoc, getDocs, setDoc, addDoc,
  updateDoc, deleteDoc, query, where, orderBy,
  onSnapshot, serverTimestamp, writeBatch,
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