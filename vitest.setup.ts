import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'

// jsdom carries localStorage between tests; reset it for isolation.
afterEach(() => {
  try { window.localStorage.clear() } catch { /* ignore */ }
})
