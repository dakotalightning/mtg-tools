/**
 * Low-level storage adapter. This is the ONLY module that touches
 * `localStorage`, so the whole feature can later be re-pointed at
 * GraphQL/cloud persistence by swapping the implementation.
 */
export interface StoragePersistence {
  /** True when a real backing store is usable (false during SSR / blocked storage). */
  readonly available: boolean
  read(): string | null
  write(value: string): void
  remove(): void
  /** Write a timestamped recovery copy of an unreadable payload. */
  backup(value: string): void
  /** Subscribe to cross-tab changes of this key. Returns an unsubscribe fn. */
  onExternalChange(cb: () => void): () => void
}

/** In-memory fallback used during SSR and in tests. */
export const createMemoryPersistence = (): StoragePersistence => {
  let value: string | null = null
  return {
    available: false,
    read: () => value,
    write: (v) => { value = v },
    remove: () => { value = null },
    backup: () => {},
    onExternalChange: () => () => {},
  }
}

export const createLocalStoragePersistence = (key: string): StoragePersistence => {
  const canUse = (() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false
      const probe = '__cc_probe__'
      window.localStorage.setItem(probe, '1')
      window.localStorage.removeItem(probe)
      return true
    } catch {
      return false
    }
  })()

  if (!canUse) return createMemoryPersistence()

  return {
    available: true,
    read: () => {
      try {
        return window.localStorage.getItem(key)
      } catch {
        return null
      }
    },
    write: (value) => {
      // Throws on quota / serialization problems — callers decide how to react.
      window.localStorage.setItem(key, value)
    },
    remove: () => {
      try {
        window.localStorage.removeItem(key)
      } catch {
        /* ignore */
      }
    },
    backup: (value) => {
      try {
        window.localStorage.setItem(`${key}:recovery:${new Date().toISOString()}`, value)
      } catch {
        /* best effort */
      }
    },
    onExternalChange: (cb) => {
      const handler = (e: StorageEvent) => {
        if (e.key === key) cb()
      }
      window.addEventListener('storage', handler)
      return () => window.removeEventListener('storage', handler)
    },
  }
}

export const STORAGE_KEY = 'card-cloud:shopping-lists'
