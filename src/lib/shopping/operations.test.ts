import { beforeEach, describe, expect, it } from 'vitest'
import { emptyStorage } from './migrations'
import * as ops from './operations'
import { ShoppingListStorage } from './types'

const seed = () => {
  const { storage, list } = ops.createList(emptyStorage(), { name: 'Test' })
  return { storage, listId: list.id }
}

describe('createList', () => {
  it('adds a named list', () => {
    const { storage, list } = ops.createList(emptyStorage(), { name: 'Friday' })
    expect(storage.lists).toHaveLength(1)
    expect(list.name).toBe('Friday')
  })
  it('falls back to a default name when blank', () => {
    const { list } = ops.createList(emptyStorage(), { name: '   ' })
    expect(list.name).toBe('Untitled list')
  })
})

describe('addItem', () => {
  let storage: ShoppingListStorage
  let listId: string
  beforeEach(() => { ({ storage, listId } = seed()) })

  it('adds a new item', () => {
    storage = ops.addItem(storage, listId, { cardName: 'Sol Ring', quantityWanted: 1 })
    expect(storage.lists[0].items).toHaveLength(1)
    expect(storage.lists[0].items[0].position).toBe(0)
  })

  it('merges quantity for the same card + printing', () => {
    storage = ops.addItem(storage, listId, { cardName: 'Sol Ring', cardId: 'c1', quantityWanted: 2 })
    storage = ops.addItem(storage, listId, { cardName: 'Sol Ring', cardId: 'c1', quantityWanted: 3 })
    expect(storage.lists[0].items).toHaveLength(1)
    expect(storage.lists[0].items[0].quantityWanted).toBe(5)
  })

  it('keeps different printings separate', () => {
    storage = ops.addItem(storage, listId, { cardName: 'Sol Ring', cardId: 'c1', selectedPrintingId: 'p1' })
    storage = ops.addItem(storage, listId, { cardName: 'Sol Ring', cardId: 'c1', selectedPrintingId: 'p2' })
    expect(storage.lists[0].items).toHaveLength(2)
  })
})

describe('quantities', () => {
  let storage: ShoppingListStorage
  let listId: string
  let itemId: string
  beforeEach(() => {
    ;({ storage, listId } = seed())
    storage = ops.addItem(storage, listId, { cardName: 'Bolt', quantityWanted: 4 })
    itemId = storage.lists[0].items[0].id
  })

  it('clamps quantityFound to [0, wanted]', () => {
    storage = ops.setQuantityFound(storage, listId, itemId, 99)
    expect(storage.lists[0].items[0].quantityFound).toBe(4)
    storage = ops.setQuantityFound(storage, listId, itemId, -5)
    expect(storage.lists[0].items[0].quantityFound).toBe(0)
  })

  it('increments and decrements within bounds', () => {
    storage = ops.incrementQuantityFound(storage, listId, itemId)
    expect(storage.lists[0].items[0].quantityFound).toBe(1)
    storage = ops.decrementQuantityFound(storage, listId, itemId)
    storage = ops.decrementQuantityFound(storage, listId, itemId)
    expect(storage.lists[0].items[0].quantityFound).toBe(0)
  })

  it('re-clamps found when wanted shrinks', () => {
    storage = ops.setQuantityFound(storage, listId, itemId, 4)
    storage = ops.setQuantityWanted(storage, listId, itemId, 2)
    expect(storage.lists[0].items[0].quantityFound).toBe(2)
  })
})

describe('toggleItemComplete', () => {
  it('marks a one-copy item fully found, then resets', () => {
    let { storage, listId } = seed()
    storage = ops.addItem(storage, listId, { cardName: 'Sol Ring', quantityWanted: 1 })
    const id = storage.lists[0].items[0].id
    storage = ops.toggleItemComplete(storage, listId, id)
    expect(storage.lists[0].items[0].quantityFound).toBe(1)
    storage = ops.toggleItemComplete(storage, listId, id)
    expect(storage.lists[0].items[0].quantityFound).toBe(0)
  })

  it('completes a multi-copy item to wanted, then unchecks to 0', () => {
    let { storage, listId } = seed()
    storage = ops.addItem(storage, listId, { cardName: 'Bolt', quantityWanted: 4 })
    const id = storage.lists[0].items[0].id
    storage = ops.setQuantityFound(storage, listId, id, 2)
    storage = ops.toggleItemComplete(storage, listId, id) // 2/4 -> complete (4)
    expect(storage.lists[0].items[0].quantityFound).toBe(4)
    storage = ops.toggleItemComplete(storage, listId, id) // complete -> 0
    expect(storage.lists[0].items[0].quantityFound).toBe(0)
  })
})

describe('selectPreferredPrinting', () => {
  it('sets and clears the preferred printing', () => {
    let { storage, listId } = seed()
    storage = ops.addItem(storage, listId, { cardName: 'Sol Ring' })
    const id = storage.lists[0].items[0].id
    storage = ops.selectPreferredPrinting(storage, listId, id, { printingId: 'p1', setCode: 'C21' })
    expect(storage.lists[0].items[0].selectedPrintingId).toBe('p1')
    storage = ops.selectPreferredPrinting(storage, listId, id, {})
    expect(storage.lists[0].items[0].selectedPrintingId).toBeUndefined()
  })
})

describe('reorder / remove / restore / duplicate', () => {
  it('reorders items by id order', () => {
    let { storage, listId } = seed()
    storage = ops.addItem(storage, listId, { cardName: 'A' })
    storage = ops.addItem(storage, listId, { cardName: 'B' })
    const [a, b] = storage.lists[0].items
    storage = ops.reorderItems(storage, listId, [b.id, a.id])
    expect(storage.lists[0].items.map((i) => i.cardName)).toEqual(['B', 'A'])
  })

  it('restores a removed item at its original position', () => {
    let { storage, listId } = seed()
    storage = ops.addItem(storage, listId, { cardName: 'A' })
    storage = ops.addItem(storage, listId, { cardName: 'B' })
    const b = storage.lists[0].items[1]
    storage = ops.removeItem(storage, listId, b.id)
    expect(storage.lists[0].items).toHaveLength(1)
    storage = ops.restoreItem(storage, listId, b)
    expect(storage.lists[0].items.map((i) => i.cardName)).toEqual(['A', 'B'])
  })

  it('duplicates a list with fresh ids', () => {
    let { storage, listId } = seed()
    storage = ops.addItem(storage, listId, { cardName: 'A' })
    const { storage: next, list } = ops.duplicateList(storage, listId)
    expect(next.lists).toHaveLength(2)
    expect(list?.id).not.toBe(listId)
    expect(list?.items[0].id).not.toBe(storage.lists[0].items[0].id)
  })
})

describe('addItemsBulk', () => {
  it('reports added vs merged counts', () => {
    let { storage, listId } = seed()
    const r1 = ops.addItemsBulk(storage, listId, [
      { cardName: 'Sol Ring', cardId: 'c1' },
      { cardName: 'Bolt', cardId: 'c2' },
    ])
    expect(r1.result).toEqual({ added: 2, merged: 0 })
    const r2 = ops.addItemsBulk(r1.storage, listId, [{ cardName: 'Sol Ring', cardId: 'c1', quantityWanted: 2 }])
    expect(r2.result).toEqual({ added: 0, merged: 1 })
    expect(r2.storage.lists[0].items.find((i) => i.cardId === 'c1')?.quantityWanted).toBe(3)
  })
})
