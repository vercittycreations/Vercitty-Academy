import { useState, useEffect } from 'react'
import { getCoursesForUser, getCourse, getAllCourses } from '../firebase/firestore'

export function useUserCourses(userId) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    const fetch = async () => {
      setLoading(true)
      const courseIds  = await getCoursesForUser(userId)
      const courseData = await Promise.all(courseIds.map(id => getCourse(id)))
      // Students only see published courses (not draft)
      setCourses(courseData.filter(Boolean).filter(c => c.status !== 'draft'))
      setLoading(false)
    }
    fetch()
  }, [userId])

  return { courses, loading }
}

export function useAllCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Admin sees ALL courses including drafts
    getAllCourses().then(data => {
      setCourses(data)
      setLoading(false)
    })
  }, [])

  return { courses, loading, setCourses }
}