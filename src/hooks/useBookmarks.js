import { useState, useEffect, useCallback } from 'react'
import { subscribeToBookmarks, toggleBookmark } from '../firebase/firestore'

export function useBookmarks(userId, courseId) {
  const [bookmarkedLessons, setBookmarkedLessons] = useState([])
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    if (!userId || !courseId) return
    const unsub = subscribeToBookmarks(userId, courseId, setBookmarkedLessons)
    return unsub
  }, [userId, courseId])

  const toggle = useCallback(async (lessonId) => {
    if (!userId || !lessonId || toggling) return
    setToggling(true)
    await toggleBookmark(userId, lessonId, courseId)
    setToggling(false)
  }, [userId, courseId, toggling])

  const isBookmarked = useCallback(
    (lessonId) => bookmarkedLessons.includes(lessonId),
    [bookmarkedLessons]
  )

  return { bookmarkedLessons, toggle, isBookmarked, toggling }
}