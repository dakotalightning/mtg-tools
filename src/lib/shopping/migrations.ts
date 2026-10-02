import { isShoppingList, isShoppingListItem, isShoppingListStorage } from './schema'
import { ShoppingList, ShoppingListStorage, STORAGE_VERSION } from './types'

export const nowIso = () => new Date().toISOString()

export const emptyStorage = (): ShoppingListStorage => ({
  version: STORAGE_VERSION,
  lists: [],
  updatedAt: nowIso(),
})

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Keep a list if its core fields are valid, dropping only the individual items
 * that are malformed — so one bad item never discards an otherwise-good list.
 * Returns null when the list itself is unrecoverable.
 */
const salvageList = (value: unknown): ShoppingList | null => {
  if (!isObj(value)) return null
  const items = Array.isArray(value.items) ? value.items.filter(isShoppingListItem) : []
  const candidate = { ...value, items }
  return isShoppingList(candidate) ? candidate : null
}

/**
 * Centralized migration / normalization entry point. Returns a valid v1
 * envelope, salvaging as much as possible. Throws only when the payload is
 * fundamentally unrecognizable or declares a version we cannot handle — the
 * store catches that to back up + reinitialize.
 */
export function migrateShoppingListStorage(value: unknown): ShoppingListStorage {
  if (value == null) return emptyStorage()

  // Already a clean v1 envelope.
  if (isShoppingListStorage(value)) return value

  if (!isObj(value)) {
    throw new Error('Unrecognized shopping-list storage payload')
  }

  const version = value.version
  if (version !== undefined && version !== STORAGE_VERSION) {
    // No migration path for an unknown/future version — preserve + reinit upstream.
    throw new Error(`Unsupported shopping-list storage version: ${String(version)}`)
  }

  if (!Array.isArray(value.lists)) {
    throw new Error('Shopping-list storage is missing its lists array')
  }

  const lists = value.lists
    .map(salvageList)
    .filter((l): l is ShoppingList => l !== null)

  return {
    version: STORAGE_VERSION,
    lists,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : nowIso(),
  }
}
