import { emptyStorage, migrateShoppingListStorage, nowIso } from './migrations'
import * as ops from './operations'
import {
  createLocalStoragePersistence,
  createMemoryPersistence,
  STORAGE_KEY,
  StoragePersistence,
} from './persistence'
import { isShoppingListStorage } from './schema'
import { ShoppingList, ShoppingListItem, ShoppingListStorage } from './types'

export type StoreState = {
  storage: ShoppingListStorage
  loaded: boolean
  /** Set when persistence is unavailable or a write failed. */
  storageError: string | null
  /** Set when saved data could not be loaded and was reset (with a backup kept). */
  recoveryMessage: string | null
}

const DEBOUNCE_MS = 300

/**
 * Central, single-writer store for all shopping-list state. Mutations apply an
 * immutable operation to the cached envelope, notify subscribers synchronously
 * (so the UI is instant), and persist through the adapter — important changes
 * immediately, rapid/non-critical ones debounced.
 */
export class ShoppingStore {
  private persistence: StoragePersistence
  private cache: ShoppingListStorage = emptyStorage()
  private listeners = new Set<() => void>()
  private loaded = false
  private storageError: string | null = null
  private recoveryMessage: string | null = null
  private writeTimer: ReturnType<typeof setTimeout> | null = null
  private externalUnsub: (() => void) | null = null

  constructor(persistence?: StoragePersistence) {
    this.persistence = persistence ?? createMemoryPersistence()
  }

  /** Read + migrate persisted data. Safe to call once on the client after mount. */
  load() {
    const raw = this.persistence.read()
    if (raw == null) {
      this.cache = emptyStorage()
    } else {
      try {
        const parsed = JSON.parse(raw)
        this.cache = migrateShoppingListStorage(parsed)
      } catch (err) {
        // Unrecoverable — preserve a backup, reset to empty, warn the user.
        this.persistence.backup(raw)
        this.cache = emptyStorage()
        this.recoveryMessage =
          'Saved shopping lists could not be read and were reset. A backup copy was kept in this browser.'
      }
    }
    if (!this.persistence.available) {
      this.storageError =
        'This browser is not saving data (private mode or blocked storage). Lists will not persist.'
    }
    this.loaded = true
    this.notify()
  }

  getState(): StoreState {
    return {
      storage: this.cache,
      loaded: this.loaded,
      storageError: this.storageError,
      recoveryMessage: this.recoveryMessage,
    }
  }

  subscribe(cb: () => void): () => void {
    this.listeners.add(cb)
    if (!this.externalUnsub) {
      this.externalUnsub = this.persistence.onExternalChange(() => this.reloadFromExternal())
    }
    return () => {
      this.listeners.delete(cb)
      if (this.listeners.size === 0 && this.externalUnsub) {
        this.externalUnsub()
        this.externalUnsub = null
      }
    }
  }

  private notify() {
    this.listeners.forEach((cb) => cb())
  }

  private reloadFromExternal() {
    const raw = this.persistence.read()
    try {
      this.cache = raw == null ? emptyStorage() : migrateShoppingListStorage(JSON.parse(raw))
    } catch {
      return // ignore an unreadable external change rather than clobbering memory
    }
    this.notify()
  }

  /** Update the cache + notify immediately; persist now (important) or debounced. */
  private commit(next: ShoppingListStorage, immediate = true) {
    this.cache = next
    this.notify()
    if (immediate) this.flush()
    else this.scheduleWrite()
  }

  private scheduleWrite() {
    if (this.writeTimer) clearTimeout(this.writeTimer)
    this.writeTimer = setTimeout(() => this.flush(), DEBOUNCE_MS)
  }

  flush() {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer)
      this.writeTimer = null
    }
    try {
      this.persistence.write(JSON.stringify(this.cache))
      if (this.storageError && this.persistence.available) this.storageError = null
    } catch (err) {
      // Keep the in-memory action; just report that it was not persisted.
      this.storageError =
        'Could not save to this browser (storage may be full). Your changes are kept for this session only.'
      this.notify()
    }
  }

  dismissRecoveryMessage() {
    this.recoveryMessage = null
    this.notify()
  }

  // ---- mutations (return the affected entity where useful) -----------------

  createList(input: { name: string; description?: string; color?: string }): ShoppingList {
    const { storage, list } = ops.createList(this.cache, input)
    this.commit(storage)
    return list
  }

  updateList(id: string, patch: Partial<Pick<ShoppingList, 'name' | 'description' | 'color'>>) {
    this.commit(ops.updateList(this.cache, id, patch))
  }

  deleteList(id: string) {
    this.commit(ops.deleteList(this.cache, id))
  }

  duplicateList(id: string): ShoppingList | null {
    const { storage, list } = ops.duplicateList(this.cache, id)
    this.commit(storage)
    return list
  }

  addItem(listId: string, input: ops.NewItemInput) {
    this.commit(ops.addItem(this.cache, listId, input))
  }

  addItemsBulk(listId: string, inputs: ops.NewItemInput[]): ops.BulkResult {
    const { storage, result } = ops.addItemsBulk(this.cache, listId, inputs)
    this.commit(storage)
    return result
  }

  updateItem(listId: string, itemId: string, patch: Partial<{ note: string; cardName: string }>) {
    this.commit(ops.updateItem(this.cache, listId, itemId, patch))
  }

  removeItem(listId: string, itemId: string) {
    this.commit(ops.removeItem(this.cache, listId, itemId))
  }

  restoreItem(listId: string, item: ShoppingListItem) {
    this.commit(ops.restoreItem(this.cache, listId, item))
  }

  setQuantityWanted(listId: string, itemId: string, qty: number) {
    this.commit(ops.setQuantityWanted(this.cache, listId, itemId, qty))
  }

  setQuantityFound(listId: string, itemId: string, qty: number) {
    this.commit(ops.setQuantityFound(this.cache, listId, itemId, qty))
  }

  incrementQuantityFound(listId: string, itemId: string) {
    this.commit(ops.incrementQuantityFound(this.cache, listId, itemId))
  }

  decrementQuantityFound(listId: string, itemId: string) {
    this.commit(ops.decrementQuantityFound(this.cache, listId, itemId))
  }

  toggleItemComplete(listId: string, itemId: string) {
    this.commit(ops.toggleItemComplete(this.cache, listId, itemId))
  }

  selectPreferredPrinting(
    listId: string,
    itemId: string,
    printing: { printingId?: string; setCode?: string; snapshot?: { imageUrl?: string; typeLine?: string } }
  ) {
    this.commit(ops.selectPreferredPrinting(this.cache, listId, itemId, printing))
  }

  reorderItems(listId: string, orderedIds: string[]) {
    this.commit(ops.reorderItems(this.cache, listId, orderedIds), false)
  }

  // ---- backup import / export ----------------------------------------------

  exportEnvelope(): ShoppingListStorage {
    return this.cache
  }

  /**
   * Restore from a previously exported envelope. `replace` swaps the data;
   * `merge` appends, giving colliding list ids a fresh id (predictable rule).
   */
  importEnvelope(value: unknown, mode: 'merge' | 'replace'): { lists: number; items: number } {
    const incoming = migrateShoppingListStorage(value)
    const counts = {
      lists: incoming.lists.length,
      items: incoming.lists.reduce((n, l) => n + l.items.length, 0),
    }
    if (mode === 'replace') {
      this.commit({ ...incoming, updatedAt: nowIso() })
      return counts
    }
    const existingIds = new Set(this.cache.lists.map((l) => l.id))
    const merged = incoming.lists.map((l) =>
      existingIds.has(l.id) ? { ...l, id: `${l.id}-imported-${Math.random().toString(36).slice(2, 7)}` } : l
    )
    this.commit({ version: 1, lists: [...this.cache.lists, ...merged], updatedAt: nowIso() })
    return counts
  }

  /** Expose a parsed export validator for the UI preview. */
  static describeEnvelope(value: unknown): { lists: number; items: number } | null {
    if (!isShoppingListStorage(value)) {
      try {
        const migrated = migrateShoppingListStorage(value)
        return { lists: migrated.lists.length, items: migrated.lists.reduce((n, l) => n + l.items.length, 0) }
      } catch {
        return null
      }
    }
    return { lists: value.lists.length, items: value.lists.reduce((n, l) => n + l.items.length, 0) }
  }
}

/** App-wide singleton (client uses localStorage; SSR uses the memory fallback). */
export const shoppingStore = new ShoppingStore(
  typeof window === 'undefined' ? createMemoryPersistence() : createLocalStoragePersistence(STORAGE_KEY)
)
