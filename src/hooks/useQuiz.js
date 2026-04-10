import { useState, useEffect, useCallback } from 'react'
import {
  getLessonQuestions,
  getQuizResult,
  saveQuizResult,
} from '../firebase/firestore'

export function useQuiz(userId, lessonId, courseId) {
  const [questions,  setQuestions]  = useState([])
  const [quizResult, setQuizResult] = useState(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    setQuestions([])
    setQuizResult(null)
    if (!lessonId) { setLoading(false); return }
    setLoading(true)
    Promise.all([
      getLessonQuestions(lessonId),
      userId ? getQuizResult(userId, lessonId) : Promise.resolve(null),
    ]).then(([qs, result]) => {
      setQuestions(qs)
      setQuizResult(result)
      setLoading(false)
    })
  }, [userId, lessonId])

  const submitQuiz = useCallback(async (answers) => {
    if (!userId || !lessonId || questions.length === 0) return null
    const total    = questions.length
    const score    = questions.reduce(
      (acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0
    )
    const passed   = score / total >= 0.8
    const attempts = (quizResult?.attempts || 0) + 1
    const result   = {
      userId, lessonId, courseId, passed, score, total, attempts,
      ...(passed ? { passedAt: new Date().toISOString() } : {}),
    }
    await saveQuizResult(userId, lessonId, result)
    setQuizResult(result)
    return { passed, score, total }
  }, [userId, lessonId, courseId, questions, quizResult])

  return {
    questions,
    quizResult,
    quizPassed:  quizResult?.passed === true,
    hasQuiz:     questions.length > 0,
    quizLoading: loading,
    submitQuiz,
  }
}