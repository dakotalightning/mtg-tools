import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StoragePersistence } from './persistence'
import { ShoppingStore } from './store'
import { ShoppingListStorage } from './types'

class MockPersistence implements StoragePersistence {
  available = true
  value: string | null = null
  backups: string[] = []
  failWrites = false
  private cbs = new Set<() => void>()
  read() { return this.value }
  write(v: string) { if (this.failWrites) throw new Error('quota exceeded'); this.value = v }
  remove() { this.value = null }
  backup(v: string) { this.backups.push(v) }
  onExternalChange(cb: () => void) { this.cbs.add(cb); return () => this.cbs.delete(cb) }
  fireExternal(raw: string) { this.value = raw; this.cbs.forEach((cb) => cb()) }
}

const envelope = (lists: unknown[] = []): ShoppingListStorage =>
  ({ version: 1, lists: lists as any, updatedAt: 'x' })

const makeStore = (seed?: string) => {
  const p = new MockPersistence()
  if (seed !== undefined) p.value = seed
  const store = new ShoppingStore(p)
  return { store, p }
}

describe('hydration', () => {
  it('initializes empty when nothing is stored', () => {
    const { store } = makeStore()
    store.load()
    expect(store.getState().loaded).toBe(true)
    expect(store.getState().storage.lists).toEqual([])
  })

  it('hydrates a valid v1 envelope', () => {
    const seed = JSON.stringify(envelope([{ id: 'l1', name: 'L', items: [], createdAt: 'x', updatedAt: 'x' }]))
    const { store } = makeStore(seed)
    store.load()
    expect(store.getState().storage.lists).toHaveLength(1)
  })

  it('recovers from malformed JSON, keeps a backup, and warns', () => {
    const { store, p } = makeStore('{ not valid json')
    store.load()
    expect(store.getState().storage.lists).toEqual([])
    expect(store.getState().recoveryMessage).toBeTruthy()
    expect(p.backups).toHaveLength(1)
  })

  it('recovers from an unknown version', () => {
    const { store, p } = makeStore(JSON.stringify({ version: 99, lists: [], updatedAt: 'x' }))
    store.load()
    expect(store.getState().recoveryMessage).toBeTruthy()
    expect(p.backups).toHaveLength(1)
  })
})

describe('mutations persist', () => {
  let store: ShoppingStore
  let p: MockPersistence
  beforeEach(() => { ({ store, p } = makeStore()); store.load() })

  it('creates, updates and deletes lists', () => {
    const list = store.createList({ name: 'Friday' })
    expect(store.getState().storage.lists).toHaveLength(1)
    store.updateList(list.id, { name: 'Saturday' })
    expect(store.getState().storage.lists[0].name).toBe('Saturday')
    store.deleteList(list.id)
    expect(store.getState().storage.lists).toHaveLength(0)
    // persisted to the adapter
    expect(JSON.parse(p.value!).lists).toHaveLength(0)
  })

  it('updates quantities and selected printing', () => {
    const list = store.createList({ name: 'L' })
    store.addItem(list.id, { cardName: 'Bolt', quantityWanted: 4 })
    const itemId = store.getState().storage.lists[0].items[0].id
    store.setQuantityFound(list.id, itemId, 2)
    store.selectPreferredPrinting(list.id, itemId, { printingId: 'p1', setCode: 'CLB' })
    const item = store.getState().storage.lists[0].items[0]
    expect(item.quantityFound).toBe(2)
    expect(item.selectedPrintingId).toBe('p1')
  })

  it('merges duplicate bulk additions', () => {
    const list = store.createList({ name: 'L' })
    store.addItemsBulk(list.id, [{ cardName: 'Sol Ring', cardId: 'c1', quantityWanted: 1 }])
    const res = store.addItemsBulk(list.id, [{ cardName: 'Sol Ring', cardId: 'c1', quantityWanted: 2 }])
    expect(res).toEqual({ added: 0, merged: 1 })
    expect(store.getState().storage.lists[0].items[0].quantityWanted).toBe(3)
  })

  it('keeps the in-memory action when a write fails (quota)', () => {
    p.failWrites = true
    store.createList({ name: 'Doomed' })
    expect(store.getState().storage.lists).toHaveLength(1) // kept in memory
    expect(store.getState().storageError).toBeTruthy()
  })
})

describe('cross-tab sync', () => {
  it('reloads when another tab changes storage', () => {
    const { store, p } = makeStore()
    store.load()
    const notified = vi.fn()
    store.subscribe(notified)
    const external = JSON.stringify(envelope([{ id: 'l9', name: 'From other tab', items: [], createdAt: 'x', updatedAt: 'x' }]))
    p.fireExternal(external)
    expect(store.getState().storage.lists[0].name).toBe('From other tab')
    expect(notified).toHaveBeenCalled()
  })
})

describe('backup import', () => {
  let store: ShoppingStore
  beforeEach(() => { ({ store } = makeStore()); store.load(); store.createList({ name: 'Existing' }) })

  it('merges imported lists alongside existing', () => {
    const incoming = envelope([{ id: 'x1', name: 'Imported', items: [], createdAt: 'x', updatedAt: 'x' }])
    const counts = store.importEnvelope(incoming, 'merge')
    expect(counts).toEqual({ lists: 1, items: 0 })
    expect(store.getState().storage.lists).toHaveLength(2)
  })

  it('gives colliding ids a new id on merge', () => {
    const existingId = store.getState().storage.lists[0].id
    const incoming = envelope([{ id: existingId, name: 'Clash', items: [], createdAt: 'x', updatedAt: 'x' }])
    store.importEnvelope(incoming, 'merge')
    const ids = store.getState().storage.lists.map((l) => l.id)
    expect(new Set(ids).size).toBe(2) // no duplicate ids
  })

  it('replaces all data', () => {
    const incoming = envelope([{ id: 'x1', name: 'Only', items: [], createdAt: 'x', updatedAt: 'x' }])
    store.importEnvelope(incoming, 'replace')
    expect(store.getState().storage.lists).toHaveLength(1)
    expect(store.getState().storage.lists[0].name).toBe('Only')
  })
})
