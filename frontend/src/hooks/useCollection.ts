import { useState, useCallback } from 'react'
import {
  attachPublicLearningPathToMe,
  detachMyLearningPath,
  type AttachLearningPathResult,
} from '@/services/learningPath'

export interface UseCollectionOptions {
  /** Called on API success */
  onSuccess?: (result: AttachLearningPathResult) => void
  /** Called on API failure */
  onError?: (error: unknown) => void
}

export interface UseCollectionResult {
  /** Whether an add/detach operation is in flight */
  loading: boolean
  /** Set of path IDs currently in the user's collection (local optimistic state) */
  savedIds: Set<number>
  /** Add a path to the collection */
  addPath: (pathId: number) => Promise<void>
  /** Remove a path from the collection */
  removePath: (pathId: number) => Promise<void>
  /** Toggle a path in/out of the collection */
  togglePath: (pathId: number) => Promise<void>
  /** Check if a path is in the collection */
  isSaved: (pathId: number) => boolean
}

/**
 * Manages a user's learning path collection.
 *
 * Provides optimistic local state (savedIds) updated immediately on toggle,
 * with the API call running in the background. On error, the local state
 * is NOT reverted (fire-and-forget UX is acceptable for this use case).
 */
export function useCollection(
  initialIds: number[] = [],
  options: UseCollectionOptions = {}
): UseCollectionResult {
  const { onSuccess, onError } = options
  const [loading, setLoading] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<number>>(
    () => new Set(initialIds)
  )

  const addPath = useCallback(
    async (pathId: number) => {
      if (savedIds.has(pathId)) return
      setSavedIds((prev) => new Set([...prev, pathId]))
      setLoading(true)
      try {
        const result = await attachPublicLearningPathToMe(pathId)
        onSuccess?.(result)
      } catch (err) {
        // Optimistic remove on failure
        setSavedIds((prev) => {
          const next = new Set(prev)
          next.delete(pathId)
          return next
        })
        onError?.(err)
      } finally {
        setLoading(false)
      }
    },
    [savedIds, onSuccess, onError]
  )

  const removePath = useCallback(
    async (pathId: number) => {
      if (!savedIds.has(pathId)) return
      setSavedIds((prev) => {
        const next = new Set(prev)
        next.delete(pathId)
        return next
      })
      setLoading(true)
      try {
        await detachMyLearningPath(pathId)
      } catch (err) {
        // Optimistic re-add on failure
        setSavedIds((prev) => new Set([...prev, pathId]))
        onError?.(err)
      } finally {
        setLoading(false)
      }
    },
    [savedIds, onError]
  )

  const togglePath = useCallback(
    async (pathId: number) => {
      if (savedIds.has(pathId)) {
        await removePath(pathId)
      } else {
        await addPath(pathId)
      }
    },
    [savedIds, addPath, removePath]
  )

  const isSaved = useCallback(
    (pathId: number) => savedIds.has(pathId),
    [savedIds]
  )

  return { loading, savedIds, addPath, removePath, togglePath, isSaved }
}
