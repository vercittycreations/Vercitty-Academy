import { useState, useEffect, useRef, useCallback } from 'react'
import { getNote, saveNote } from '../firebase/firestore'

export function useNotes(userId, lessonId) {
  const [text, setText]     = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const timerRef            = useRef(null)

  useEffect(() => {
    if (!userId || !lessonId) return
    setText('')
    setSaved(false)
    getNote(userId, lessonId).then(t => setText(t || ''))
  }, [userId, lessonId])

  const handleChange = useCallback((val) => {
    setText(val)
    setSaved(false)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      if (!userId || !lessonId) return
      setSaving(true)
      await saveNote(userId, lessonId, val)
      setSaving(false)
      setSaved(true)
    }, 1000)
  }, [userId, lessonId])

  return { text, handleChange, saving, saved }
}   