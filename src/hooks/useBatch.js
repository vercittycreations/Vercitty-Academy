import { useState, useEffect, useCallback } from 'react'
import { getUserActiveBatch } from '../firebase/firestore.batches'

export function useBatch(userId) {
  const [batch,   setBatch]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    getUserActiveBatch(userId).then(b => {
      setBatch(b)
      setLoading(false)
    })
  }, [userId])

  const currentDay = useCallback(() => {
    if (!batch?.startDate) return 0
    const start = batch.startDate.toDate
      ? batch.startDate.toDate()
      : new Date(batch.startDate)
    const diff = Date.now() - start.getTime()
    const day  = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1
    return Math.max(1, Math.min(day, 30))
  }, [batch])

  const daysRemaining = useCallback(() => {
    if (!batch?.endDate) return null
    const end = batch.endDate.toDate
      ? batch.endDate.toDate()
      : new Date(batch.endDate)
    const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }, [batch])

  const isLessonUnlocked = useCallback((dayNumber) => {
    if (!dayNumber) return true
    return dayNumber <= currentDay()
  }, [currentDay])

  const isCertificateAvailable = useCallback(() => {
    if (!batch) return false
    const day = currentDay()
    if (day < 30) return false
    if (!batch.endDate) return true
    const end = batch.endDate.toDate
      ? batch.endDate.toDate()
      : new Date(batch.endDate)
    const deadline = new Date(end.getTime() + 45 * 24 * 60 * 60 * 1000)
    return Date.now() <= deadline.getTime()
  }, [batch, currentDay])

  const certificateStatus = useCallback(() => {
    if (!batch) return 'no-batch'
    const day = currentDay()
    if (day < 30) return 'locked'
    if (!isCertificateAvailable()) return 'expired'
    return 'available'
  }, [batch, currentDay, isCertificateAvailable])

  const getBatchStartDate = useCallback(() => {
    if (!batch?.startDate) return null
    return batch.startDate.toDate
      ? batch.startDate.toDate()
      : new Date(batch.startDate)
  }, [batch])

  return {
    batch,
    loading,
    currentDay: currentDay(),
    daysRemaining: daysRemaining(),
    isLessonUnlocked,
    isCertificateAvailable: isCertificateAvailable(),
    certificateStatus: certificateStatus(),
    batchStartDate: getBatchStartDate(),
  }
}