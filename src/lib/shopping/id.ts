/**
 * Stable id generator. Uses crypto.randomUUID() where available and falls back
 * to a timestamp+random id for older browsers / non-secure contexts.
 */
export const uid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}
