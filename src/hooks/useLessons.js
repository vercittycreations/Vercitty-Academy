import { useState, useEffect } from 'react'
import { getLessonsForCourse } from '../firebase/firestore'

export function useLessons(courseId) {
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!courseId) return
    getLessonsForCourse(courseId).then(data => {
      setLessons(data)
      setLoading(false)
    })
  }, [courseId])

  return { lessons, setLessons, loading }
}