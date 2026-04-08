import { useCallback } from 'react'
import { saveLastLesson, getLastLesson } from '../firebase/firestore'

export function useLastLesson(userId, courseId) {
  const save = useCallback((lessonId) => {
    if (!userId || !courseId || !lessonId) return
    saveLastLesson(userId, courseId, lessonId)
  }, [userId, courseId])

  const getLast = useCallback(async () => {
    if (!userId || !courseId) return null
    return getLastLesson(userId, courseId)
  }, [userId, courseId])

  return { save, getLast }
}