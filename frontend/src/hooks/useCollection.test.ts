import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCollection } from './useCollection'
import * as learningPath from '@/services/learningPath'

const mockAttach = vi.spyOn(learningPath, 'attachPublicLearningPathToMe')
const mockDetach = vi.spyOn(learningPath, 'detachMyLearningPath')

beforeEach(() => {
  vi.clearAllMocks()
  mockAttach.mockReset()
  mockDetach.mockReset()
})

// ─── Initial state ────────────────────────────────────────────────────────────

describe('Initial state', () => {
  it('starts empty when no initial IDs provided', () => {
    const { result } = renderHook(() => useCollection())
    expect(result.current.savedIds.size).toBe(0)
    expect(result.current.loading).toBe(false)
  })

  it('starts with provided IDs in savedIds', () => {
    const { result } = renderHook(() => useCollection([10, 20, 30]))
    expect(result.current.savedIds.has(10)).toBe(true)
    expect(result.current.savedIds.has(20)).toBe(true)
    expect(result.current.savedIds.has(30)).toBe(true)
  })

  it('loading is false initially', () => {
    const { result } = renderHook(() => useCollection())
    expect(result.current.loading).toBe(false)
  })
})

// ─── addPath ─────────────────────────────────────────────────────────────────

describe('addPath', () => {
  it('adds path ID to savedIds on API success', async () => {
    mockAttach.mockResolvedValue({ already_exists: false, learning_path: {} as any })
    const { result } = renderHook(() => useCollection())

    await act(async () => {
      await result.current.addPath(7)
    })

    expect(result.current.savedIds.has(7)).toBe(true)
  })

  it('does nothing if path already saved (idempotent)', async () => {
    const { result } = renderHook(() => useCollection([7]))

    await act(async () => {
      await result.current.addPath(7)
    })

    expect(mockAttach).not.toHaveBeenCalled()
    expect(result.current.savedIds.has(7)).toBe(true)
  })

  it('removes path from savedIds on API failure', async () => {
    mockAttach.mockRejectedValue(new Error('Network error'))
    const onError = vi.fn()
    const { result } = renderHook(() => useCollection([], { onError }))

    await act(async () => {
      await result.current.addPath(7)
    })

    expect(result.current.savedIds.has(7)).toBe(false)
    expect(onError).toHaveBeenCalled()
  })

  it('calls onSuccess callback on success', async () => {
    const successResult = { already_exists: false, learning_path: {} as any }
    mockAttach.mockResolvedValue(successResult)
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useCollection([], { onSuccess }))

    await act(async () => {
      await result.current.addPath(7)
    })

    expect(onSuccess).toHaveBeenCalledWith(successResult)
  })

  it('calls onError callback on failure', async () => {
    const error = new Error('Server error')
    mockAttach.mockRejectedValue(error)
    const onError = vi.fn()
    const { result } = renderHook(() => useCollection([], { onError }))

    await act(async () => {
      await result.current.addPath(7)
    })

    expect(onError).toHaveBeenCalledWith(error)
  })

  it('is no-op when path already saved (onError not called)', async () => {
    const onError = vi.fn()
    const { result } = renderHook(() => useCollection([7], { onError }))

    await act(async () => {
      await result.current.addPath(7)
    })

    expect(onError).not.toHaveBeenCalled()
  })

  it('handles id 0', async () => {
    mockAttach.mockResolvedValue({ already_exists: false, learning_path: {} as any })
    const { result } = renderHook(() => useCollection())

    await act(async () => {
      await result.current.addPath(0)
    })

    expect(result.current.savedIds.has(0)).toBe(true)
  })

  it('handles very large path ID numbers', async () => {
    mockAttach.mockResolvedValue({ already_exists: false, learning_path: {} as any })
    const { result } = renderHook(() => useCollection())

    await act(async () => {
      await result.current.addPath(Number.MAX_SAFE_INTEGER)
    })

    expect(result.current.savedIds.has(Number.MAX_SAFE_INTEGER)).toBe(true)
  })

  it('multiple sequential adds work correctly', async () => {
    mockAttach
      .mockResolvedValueOnce({ already_exists: false, learning_path: {} as any })
      .mockResolvedValueOnce({ already_exists: false, learning_path: {} as any })

    const { result } = renderHook(() => useCollection())

    await act(async () => {
      await result.current.addPath(1)
      await result.current.addPath(2)
    })

    expect(result.current.savedIds.has(1)).toBe(true)
    expect(result.current.savedIds.has(2)).toBe(true)
  })
})

// ─── removePath ───────────────────────────────────────────────────────────────

describe('removePath', () => {
  it('removes path ID from savedIds on success', async () => {
    mockDetach.mockResolvedValue({ success: true } as any)
    const { result } = renderHook(() => useCollection([7]))

    await act(async () => {
      await result.current.removePath(7)
    })

    expect(result.current.savedIds.has(7)).toBe(false)
  })

  it('does nothing if path not saved (idempotent)', async () => {
    const { result } = renderHook(() => useCollection())

    await act(async () => {
      await result.current.removePath(7)
    })

    expect(mockDetach).not.toHaveBeenCalled()
  })

  it('re-adds path to savedIds on failure', async () => {
    mockDetach.mockRejectedValue(new Error('fail'))
    const onError = vi.fn()
    const { result } = renderHook(() => useCollection([7], { onError }))

    await act(async () => {
      await result.current.removePath(7)
    })

    expect(result.current.savedIds.has(7)).toBe(true)
    expect(onError).toHaveBeenCalled()
  })
})

// ─── togglePath ───────────────────────────────────────────────────────────────

describe('togglePath', () => {
  it('adds path when not saved', async () => {
    mockAttach.mockResolvedValue({ already_exists: false, learning_path: {} as any })
    const { result } = renderHook(() => useCollection())

    await act(async () => {
      await result.current.togglePath(5)
    })

    expect(result.current.savedIds.has(5)).toBe(true)
    expect(mockAttach).toHaveBeenCalledWith(5)
  })

  it('removes path when already saved', async () => {
    mockDetach.mockResolvedValue({ success: true } as any)
    const { result } = renderHook(() => useCollection([5]))

    await act(async () => {
      await result.current.togglePath(5)
    })

    expect(result.current.savedIds.has(5)).toBe(false)
    expect(mockDetach).toHaveBeenCalledWith(5)
  })
})

// ─── isSaved ─────────────────────────────────────────────────────────────────

describe('isSaved', () => {
  it('returns true for saved path', () => {
    const { result } = renderHook(() => useCollection([10, 20]))
    expect(result.current.isSaved(10)).toBe(true)
    expect(result.current.isSaved(20)).toBe(true)
  })

  it('returns false for unsaved path', () => {
    const { result } = renderHook(() => useCollection([10]))
    expect(result.current.isSaved(99)).toBe(false)
  })

  it('returns correct values after addPath', async () => {
    mockAttach.mockResolvedValue({ already_exists: false, learning_path: {} as any })
    const { result } = renderHook(() => useCollection())

    expect(result.current.isSaved(5)).toBe(false)

    await act(async () => {
      await result.current.addPath(5)
    })

    expect(result.current.isSaved(5)).toBe(true)
  })
})

// ─── loading state ─────────────────────────────────────────────────────────────

describe('loading state', () => {
  it('loading flag is managed correctly during addPath', async () => {
    mockAttach.mockResolvedValue({ already_exists: false, learning_path: {} as any })
    const { result } = renderHook(() => useCollection())

    // Initially not loading
    expect(result.current.loading).toBe(false)

    await act(async () => {
      await result.current.addPath(1)
    })

    // After completion, not loading
    expect(result.current.loading).toBe(false)
  })

  it('loading flag is managed correctly during removePath', async () => {
    mockDetach.mockResolvedValue({ success: true } as any)
    const { result } = renderHook(() => useCollection([1]))

    await act(async () => {
      await result.current.removePath(1)
    })

    expect(result.current.loading).toBe(false)
  })
})

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('Edge cases', () => {
  it('initialIds with duplicate values deduplicates via Set', () => {
    // Set constructor deduplicates
    const ids = [1, 1, 2, 2, 3]
    const { result } = renderHook(() => useCollection(ids as any))
    expect(result.current.savedIds.size).toBe(3)
  })

  it('toggle add then remove updates savedIds correctly', async () => {
    mockAttach.mockResolvedValue({ already_exists: false, learning_path: {} as any })
    mockDetach.mockResolvedValue({ success: true } as any)
    const { result } = renderHook(() => useCollection())

    // Add
    await act(async () => {
      await result.current.togglePath(5)
    })

    // After add, saved
    expect(result.current.savedIds.has(5)).toBe(true)

    // Remove
    await act(async () => {
      await result.current.togglePath(5)
    })

    // After remove, not saved
    expect(result.current.savedIds.has(5)).toBe(false)
  })
})
