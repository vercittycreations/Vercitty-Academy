import { useState, useEffect } from 'react'
import {
  getCoursesForUser, getCourse, getAllCourses,
  getLessonsForCourse, getProgressForUserCourse,
} from '../firebase/firestore'

// Fetches courses + lesson counts + progress all in one shot
// So CourseCard and CourseProgressCard don't need to fire their own Firestore reads
export function useUserCourses(userId) {
  const [courses,      setCourses]      = useState([])
  const [coursesMeta,  setCoursesMeta]  = useState({}) // courseId -> { lessonCount, completedIds }
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    const fetch = async () => {
      setLoading(true)
      // Step 1: get course IDs
      const courseIds  = await getCoursesForUser(userId)
      if (courseIds.length === 0) { setCourses([]); setLoading(false); return }

      // Step 2: fetch course docs + lessons + progress ALL in parallel
      const [courseDocs, ...rest] = await Promise.all([
        Promise.all(courseIds.map(id => getCourse(id))),
        ...courseIds.map(id =>
          Promise.all([
            getLessonsForCourse(id),
            getProgressForUserCourse(userId, id),
          ])
        ),
      ])

      const valid = courseDocs.filter(Boolean).filter(c => c.status !== 'draft')

      // Build meta map
      const meta = {}
      courseIds.forEach((id, i) => {
        const [lessons, completedIds] = rest[i]
        meta[id] = {
          lessonCount:  lessons.length,
          completedIds: completedIds || [],
          percent: lessons.length > 0
            ? Math.round(((completedIds || []).length / lessons.length) * 100)
            : 0,
        }
      })

      setCourses(valid)
      setCoursesMeta(meta)
      setLoading(false)
    }

    fetch()
  }, [userId])

  return { courses, coursesMeta, loading }
}

export function useAllCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllCourses().then(data => {
      setCourses(data)
      setLoading(false)
    })
  }, [])

  return { courses, loading, setCourses }
}