import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getLessonQuestions, getQuizResult, saveQuizResult,
} from '../firebase/firestore'

// ── Seeded random number generator (Mulberry32) ────────────────────────────
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Convert string to stable integer hash
function hashStr(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

// Fisher-Yates shuffle with provided rand function
function seededShuffle(arr, rand) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Randomize question order AND option order per student
// Each student gets a different but CONSISTENT order per attempt
export function randomizeQuestions(questions, userId, lessonId, attempt = 0) {
  if (!questions.length || !userId) return questions

  const baseSeed = hashStr(`${userId}_${lessonId}_${attempt}`)

  // 1. Shuffle question order
  const shuffledQs = seededShuffle(questions, mulberry32(baseSeed))

  // 2. Shuffle options within each question (remapping correct answer)
  return shuffledQs.map((q, qi) => {
    const optSeed = hashStr(`${userId}_${lessonId}_${attempt}_opt_${qi}_${q.id || qi}`)
    const optRand = mulberry32(optSeed)

    // Tag each option with whether it's correct
    const tagged = q.options.map((opt, i) => ({
      text:      opt,
      isCorrect: i === q.correctIndex,
    }))

    const shuffledTagged = seededShuffle(tagged, optRand)

    return {
      ...q,
      options:      shuffledTagged.map(o => o.text),
      correctIndex: shuffledTagged.findIndex(o => o.isCorrect),
    }
  })
}

export function useQuiz(userId, lessonId, courseId) {
  const [rawQuestions, setRawQuestions] = useState([])
  const [quizResult,   setQuizResult]   = useState(null)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    setRawQuestions([])
    setQuizResult(null)
    if (!lessonId) { setLoading(false); return }
    setLoading(true)
    Promise.all([
      getLessonQuestions(lessonId),
      userId ? getQuizResult(userId, lessonId) : Promise.resolve(null),
    ]).then(([qs, result]) => {
      setRawQuestions(qs)
      setQuizResult(result)
      setLoading(false)
    })
  }, [userId, lessonId])

  // Randomize based on userId + lessonId + attempt count — stable per session
  const questions = useMemo(() => {
    if (!rawQuestions.length || !userId) return rawQuestions
    const attempt = quizResult?.attempts || 0
    return randomizeQuestions(rawQuestions, userId, lessonId, attempt)
  }, [rawQuestions, userId, lessonId, quizResult?.attempts])

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
    // Re-randomize for next attempt
    return { passed, score, total }
  }, [userId, lessonId, courseId, questions, quizResult])

  return {
    questions,
    quizResult,
    quizPassed:  quizResult?.passed === true,
    hasQuiz:     rawQuestions.length > 0,
    quizLoading: loading,
    submitQuiz,
  }
}