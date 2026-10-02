import { describe, expect, it } from 'vitest'
import { emptyStorage, migrateShoppingListStorage } from './migrations'
import { ShoppingList, ShoppingListStorage } from './types'

const validItem = (id: string) => ({
  id, cardName: 'Sol Ring', quantityWanted: 1, quantityFound: 0, position: 0,
  createdAt: 'x', updatedAt: 'x',
})
const validList = (id: string, items: unknown[] = [validItem('i1')]): ShoppingList => ({
  id, name: 'L', items: items as any, createdAt: 'x', updatedAt: 'x',
})
const envelope = (lists: unknown[]): ShoppingListStorage => ({ version: 1, lists: lists as any, updatedAt: 'x' })

describe('migrateShoppingListStorage', () => {
  it('returns empty for null', () => {
    expect(migrateShoppingListStorage(null).lists).toEqual([])
  })

  it('passes through a valid v1 envelope', () => {
    const v = envelope([validList('l1')])
    expect(migrateShoppingListStorage(v)).toEqual(v)
  })

  it('drops a malformed item but keeps the rest of the list', () => {
    const v = envelope([validList('l1', [validItem('i1'), { id: 'bad' /* missing fields */ }])])
    const out = migrateShoppingListStorage(v)
    expect(out.lists[0].items).toHaveLength(1)
    expect(out.lists[0].items[0].id).toBe('i1')
  })

  it('drops a malformed list but keeps valid lists', () => {
    const v = envelope([validList('l1'), { id: 'nope' /* missing name/items */ }])
    const out = migrateShoppingListStorage(v)
    expect(out.lists).toHaveLength(1)
    expect(out.lists[0].id).toBe('l1')
  })

  it('throws on an unknown/future version', () => {
    expect(() => migrateShoppingListStorage({ version: 99, lists: [], updatedAt: 'x' })).toThrow()
  })

  it('throws on a non-object payload', () => {
    expect(() => migrateShoppingListStorage('garbage')).toThrow()
  })

  it('emptyStorage is a valid v1 envelope', () => {
    const e = emptyStorage()
    expect(e.version).toBe(1)
    expect(e.lists).toEqual([])
  })
})
