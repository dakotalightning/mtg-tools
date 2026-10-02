import { ShoppingList, ShoppingListItem, ShoppingListStorage } from './types'

/**
 * Explicit, dependency-free type guards used to validate unknown JSON before
 * it is trusted (hydration + backup import). Invalid records are rejected so a
 * single malformed entry never corrupts the whole store.
 */

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const isStr = (v: unknown): v is string => typeof v === 'string'
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const optStr = (v: unknown): v is string | undefined => v === undefined || isStr(v)

export const isShoppingListItem = (v: unknown): v is ShoppingListItem => {
  if (!isObj(v)) return false
  if (!isStr(v.id) || !isStr(v.cardName)) return false
  if (!isNum(v.quantityWanted) || !isNum(v.quantityFound) || !isNum(v.position)) return false
  if (!isStr(v.createdAt) || !isStr(v.updatedAt)) return false
  if (!optStr(v.oracleCardId) || !optStr(v.cardId)) return false
  if (!optStr(v.selectedPrintingId) || !optStr(v.selectedSetCode) || !optStr(v.note)) return false
  if (v.snapshot !== undefined) {
    if (!isObj(v.snapshot)) return false
    if (!optStr(v.snapshot.imageUrl) || !optStr(v.snapshot.typeLine)) return false
  }
  return true
}

export const isShoppingList = (v: unknown): v is ShoppingList => {
  if (!isObj(v)) return false
  if (!isStr(v.id) || !isStr(v.name)) return false
  if (!optStr(v.description) || !optStr(v.color)) return false
  if (!isStr(v.createdAt) || !isStr(v.updatedAt)) return false
  if (!Array.isArray(v.items)) return false
  return v.items.every(isShoppingListItem)
}

export const isShoppingListStorage = (v: unknown): v is ShoppingListStorage => {
  if (!isObj(v)) return false
  if (v.version !== 1) return false
  if (!isStr(v.updatedAt)) return false
  if (!Array.isArray(v.lists)) return false
  return v.lists.every(isShoppingList)
}
