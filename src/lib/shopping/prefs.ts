/** Tiny, SSR-safe persistence for UI prefs (kept separate from list data). */
const LAST_LIST_KEY = 'card-cloud:shopping-last-list'

export const getLastListId = (): string | null => {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(LAST_LIST_KEY)
  } catch {
    return null
  }
}

export const setLastListId = (id: string | null) => {
  try {
    if (typeof window === 'undefined') return
    if (id) window.localStorage.setItem(LAST_LIST_KEY, id)
    else window.localStorage.removeItem(LAST_LIST_KEY)
  } catch {
    /* ignore */
  }
}
