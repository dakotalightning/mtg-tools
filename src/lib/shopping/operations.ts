import { uid } from './id'
import { nowIso } from './migrations'
import { PrintingSnapshot, ShoppingList, ShoppingListItem, ShoppingListStorage } from './types'

export type NewItemInput = {
  cardName: string
  oracleCardId?: string
  cardId?: string
  selectedPrintingId?: string
  selectedSetCode?: string
  quantityWanted?: number
  note?: string
  snapshot?: PrintingSnapshot
}

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export const isComplete = (item: ShoppingListItem) =>
  item.quantityWanted > 0 && item.quantityFound >= item.quantityWanted

/** Canonical card identity used for de-duplication / quantity merging. */
export const canonicalKey = (i: { oracleCardId?: string; cardId?: string; cardName: string }) =>
  (i.oracleCardId || i.cardId || i.cardName.trim().toLowerCase())

/** Merge key also considers the chosen printing ("any" when unspecified). */
const mergeKey = (i: { oracleCardId?: string; cardId?: string; cardName: string; selectedPrintingId?: string }) =>
  `${canonicalKey(i)}::${i.selectedPrintingId ?? 'any'}`

// ---- low-level immutable mappers -------------------------------------------

const touchStorage = (s: ShoppingListStorage): ShoppingListStorage => ({ ...s, updatedAt: nowIso() })

const mapList = (
  s: ShoppingListStorage,
  listId: string,
  fn: (list: ShoppingList) => ShoppingList
): ShoppingListStorage =>
  touchStorage({
    ...s,
    lists: s.lists.map((l) => (l.id === listId ? { ...fn(l), updatedAt: nowIso() } : l)),
  })

const mapItem = (
  list: ShoppingList,
  itemId: string,
  fn: (item: ShoppingListItem) => ShoppingListItem
): ShoppingList => ({
  ...list,
  items: list.items.map((it) => (it.id === itemId ? { ...fn(it), updatedAt: nowIso() } : it)),
})

// ---- list operations -------------------------------------------------------

export const makeItem = (input: NewItemInput, position: number): ShoppingListItem => {
  const ts = nowIso()
  return {
    id: uid(),
    cardName: input.cardName,
    oracleCardId: input.oracleCardId,
    cardId: input.cardId,
    selectedPrintingId: input.selectedPrintingId,
    selectedSetCode: input.selectedSetCode,
    quantityWanted: Math.max(1, Math.floor(input.quantityWanted ?? 1)),
    quantityFound: 0,
    note: input.note,
    position,
    snapshot: input.snapshot,
    createdAt: ts,
    updatedAt: ts,
  }
}

export const createList = (
  s: ShoppingListStorage,
  input: { name: string; description?: string; color?: string }
): { storage: ShoppingListStorage; list: ShoppingList } => {
  const ts = nowIso()
  const list: ShoppingList = {
    id: uid(),
    name: input.name.trim() || 'Untitled list',
    description: input.description,
    color: input.color,
    items: [],
    createdAt: ts,
    updatedAt: ts,
  }
  return { storage: touchStorage({ ...s, lists: [...s.lists, list] }), list }
}

export const updateList = (
  s: ShoppingListStorage,
  listId: string,
  patch: Partial<Pick<ShoppingList, 'name' | 'description' | 'color'>>
): ShoppingListStorage => mapList(s, listId, (l) => ({ ...l, ...patch }))

export const deleteList = (s: ShoppingListStorage, listId: string): ShoppingListStorage =>
  touchStorage({ ...s, lists: s.lists.filter((l) => l.id !== listId) })

export const duplicateList = (
  s: ShoppingListStorage,
  listId: string
): { storage: ShoppingListStorage; list: ShoppingList | null } => {
  const src = s.lists.find((l) => l.id === listId)
  if (!src) return { storage: s, list: null }
  const ts = nowIso()
  const copy: ShoppingList = {
    ...src,
    id: uid(),
    name: `${src.name} (copy)`,
    createdAt: ts,
    updatedAt: ts,
    items: src.items.map((it) => ({ ...it, id: uid(), createdAt: ts, updatedAt: ts })),
  }
  return { storage: touchStorage({ ...s, lists: [...s.lists, copy] }), list: copy }
}

// ---- item operations -------------------------------------------------------

export const addItem = (
  s: ShoppingListStorage,
  listId: string,
  input: NewItemInput
): ShoppingListStorage =>
  mapList(s, listId, (list) => {
    const key = mergeKey(input)
    const existing = list.items.find((it) => mergeKey(it) === key)
    if (existing) {
      return mapItem(list, existing.id, (it) => ({
        ...it,
        quantityWanted: it.quantityWanted + Math.max(1, Math.floor(input.quantityWanted ?? 1)),
        snapshot: it.snapshot ?? input.snapshot,
        oracleCardId: it.oracleCardId ?? input.oracleCardId,
        cardId: it.cardId ?? input.cardId,
      }))
    }
    return { ...list, items: [...list.items, makeItem(input, list.items.length)] }
  })

export type BulkResult = { added: number; merged: number }

export const addItemsBulk = (
  s: ShoppingListStorage,
  listId: string,
  inputs: NewItemInput[]
): { storage: ShoppingListStorage; result: BulkResult } => {
  let storage = s
  let added = 0
  let merged = 0
  for (const input of inputs) {
    const list = storage.lists.find((l) => l.id === listId)
    const exists = list?.items.some((it) => mergeKey(it) === mergeKey(input))
    if (exists) merged += 1
    else added += 1
    storage = addItem(storage, listId, input)
  }
  return { storage, result: { added, merged } }
}

export const updateItem = (
  s: ShoppingListStorage,
  listId: string,
  itemId: string,
  patch: Partial<Pick<ShoppingListItem, 'note' | 'cardName'>>
): ShoppingListStorage => mapList(s, listId, (l) => mapItem(l, itemId, (it) => ({ ...it, ...patch })))

export const removeItem = (s: ShoppingListStorage, listId: string, itemId: string): ShoppingListStorage =>
  mapList(s, listId, (l) => ({ ...l, items: l.items.filter((it) => it.id !== itemId) }))

/** Re-insert a previously removed item at its original position (for undo). */
export const restoreItem = (
  s: ShoppingListStorage,
  listId: string,
  item: ShoppingListItem
): ShoppingListStorage =>
  mapList(s, listId, (l) => {
    if (l.items.some((it) => it.id === item.id)) return l
    const items = [...l.items]
    items.splice(clamp(item.position, 0, items.length), 0, item)
    return { ...l, items }
  })

export const setQuantityWanted = (
  s: ShoppingListStorage,
  listId: string,
  itemId: string,
  qty: number
): ShoppingListStorage =>
  mapList(s, listId, (l) =>
    mapItem(l, itemId, (it) => {
      const wanted = Math.max(1, Math.floor(qty))
      return { ...it, quantityWanted: wanted, quantityFound: clamp(it.quantityFound, 0, wanted) }
    })
  )

export const setQuantityFound = (
  s: ShoppingListStorage,
  listId: string,
  itemId: string,
  qty: number
): ShoppingListStorage =>
  mapList(s, listId, (l) =>
    mapItem(l, itemId, (it) => ({ ...it, quantityFound: clamp(Math.floor(qty), 0, it.quantityWanted) }))
  )

export const incrementQuantityFound = (s: ShoppingListStorage, listId: string, itemId: string) =>
  mapList(s, listId, (l) =>
    mapItem(l, itemId, (it) => ({ ...it, quantityFound: clamp(it.quantityFound + 1, 0, it.quantityWanted) }))
  )

export const decrementQuantityFound = (s: ShoppingListStorage, listId: string, itemId: string) =>
  mapList(s, listId, (l) =>
    mapItem(l, itemId, (it) => ({ ...it, quantityFound: clamp(it.quantityFound - 1, 0, it.quantityWanted) }))
  )

/**
 * Predictable toggle rule: if the item is complete, reset found to 0;
 * otherwise mark it fully found (found = wanted).
 */
export const toggleItemComplete = (s: ShoppingListStorage, listId: string, itemId: string) =>
  mapList(s, listId, (l) =>
    mapItem(l, itemId, (it) => ({
      ...it,
      quantityFound: isComplete(it) ? 0 : it.quantityWanted,
    }))
  )

export const selectPreferredPrinting = (
  s: ShoppingListStorage,
  listId: string,
  itemId: string,
  printing: { printingId?: string; setCode?: string; snapshot?: PrintingSnapshot }
): ShoppingListStorage =>
  mapList(s, listId, (l) =>
    mapItem(l, itemId, (it) => ({
      ...it,
      selectedPrintingId: printing.printingId,
      selectedSetCode: printing.setCode,
      snapshot: printing.snapshot ?? it.snapshot,
    }))
  )

export const reorderItems = (
  s: ShoppingListStorage,
  listId: string,
  orderedIds: string[]
): ShoppingListStorage =>
  mapList(s, listId, (l) => {
    const pos = new Map(orderedIds.map((id, i) => [id, i]))
    const items = l.items
      .map((it) => ({ ...it, position: pos.get(it.id) ?? it.position }))
      .sort((a, b) => a.position - b.position)
    return { ...l, items }
  })
