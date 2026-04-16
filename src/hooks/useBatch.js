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

  // Total days in this batch (startDate to endDate)
  const totalDays = useCallback(() => {
    if (!batch?.startDate || !batch?.endDate) return 30
    const start = batch.startDate.toDate ? batch.startDate.toDate() : new Date(batch.startDate)
    const end   = batch.endDate.toDate   ? batch.endDate.toDate()   : new Date(batch.endDate)
    const diff  = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(1, diff)
  }, [batch])

  // Current day number since batch started (capped at totalDays)
  const currentDay = useCallback(() => {
    if (!batch?.startDate) return 0
    const start = batch.startDate.toDate ? batch.startDate.toDate() : new Date(batch.startDate)
    const diff  = Date.now() - start.getTime()
    const day   = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1
    return Math.max(1, Math.min(day, totalDays()))
  }, [batch, totalDays])

  const daysRemaining = useCallback(() => {
    if (!batch?.endDate) return null
    const end  = batch.endDate.toDate ? batch.endDate.toDate() : new Date(batch.endDate)
    const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }, [batch])

  const isLessonUnlocked = useCallback((dayNumber) => {
    if (!dayNumber) return true
    return dayNumber <= currentDay()
  }, [currentDay])

  // Certificate: available on last day, for 45 days after end
  const certificateStatus = useCallback(() => {
    if (!batch) return 'no-batch'
    const total = totalDays()
    const day   = currentDay()
    if (day < total) return 'locked'
    // Check 45-day window after endDate
    if (batch.endDate) {
      const end      = batch.endDate.toDate ? batch.endDate.toDate() : new Date(batch.endDate)
      const deadline = new Date(end.getTime() + 45 * 24 * 60 * 60 * 1000)
      if (Date.now() > deadline.getTime()) return 'expired'
    }
    return 'available'
  }, [batch, currentDay, totalDays])

  const getBatchStartDate = useCallback(() => {
    if (!batch?.startDate) return null
    return batch.startDate.toDate ? batch.startDate.toDate() : new Date(batch.startDate)
  }, [batch])

  const total = totalDays()
  const cur   = currentDay()

  return {
    batch,
    loading,
    currentDay:          cur,
    totalDays:           total,
    daysRemaining:       daysRemaining(),
    isLessonUnlocked,
    certificateStatus:   certificateStatus(),
    batchStartDate:      getBatchStartDate(),
    batchProgress:       total > 0 ? Math.round((cur / total) * 100) : 0,
  }
}