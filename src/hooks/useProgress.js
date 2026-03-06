import { useState, useEffect, useCallback } from 'react'
import { subscribeToProgress, markLessonComplete } from '../firebase/firestore'

export function useProgress(userId, courseId) {
  const [completedLessons, setCompletedLessons] = useState([])
  const [loading,          setLoading]          = useState(true)
  const [justCompleted,    setJustCompleted]     = useState(null)

  useEffect(() => {
    if (!userId || !courseId) { setLoading(false); return }
    setLoading(true)
    const unsub = subscribeToProgress(userId, courseId, (ids) => {
      setCompletedLessons(ids)
      setLoading(false)
    })
    return unsub
  }, [userId, courseId])

  const markComplete = useCallback(async (lessonId) => {
    if (!userId || !courseId || !lessonId) return
    if (completedLessons.includes(lessonId)) return
    await markLessonComplete(userId, courseId, lessonId)
    setJustCompleted(lessonId)
    setTimeout(() => setJustCompleted(null), 3000)
  }, [userId, courseId, completedLessons])

  const getPercent = useCallback((totalLessons) => {
    if (!totalLessons || totalLessons === 0) return 0
    return Math.round((completedLessons.length / totalLessons) * 100)
  }, [completedLessons])

  const isCompleted = useCallback((lessonId) =>
    completedLessons.includes(lessonId),
  [completedLessons])

  return {
    completedLessons,
    markComplete,
    getPercent,
    isCompleted,
    justCompleted,
    loading,
  }
}