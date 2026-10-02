/**
 * Shopping-list domain model. These are the shapes persisted to localStorage,
 * so they store stable identifiers + small display snapshots only — never full
 * card/set/price payloads (those are re-fetched from Scryfall on demand).
 */

export type PrintingSnapshot = {
  imageUrl?: string
  typeLine?: string
}

export type ShoppingListItem = {
  id: string

  // Stable references, not the whole card record.
  oracleCardId?: string
  cardId?: string
  cardName: string

  // undefined selectedPrintingId === "Any printing".
  selectedPrintingId?: string
  selectedSetCode?: string

  quantityWanted: number
  quantityFound: number

  note?: string
  position: number

  // Enough to render the row if enrichment is unavailable.
  snapshot?: PrintingSnapshot

  createdAt: string
  updatedAt: string
}

export type ShoppingList = {
  id: string
  name: string
  description?: string
  color?: string
  items: ShoppingListItem[]
  createdAt: string
  updatedAt: string
}

/** Versioned storage envelope written to localStorage. */
export type ShoppingListStorage = {
  version: 1
  lists: ShoppingList[]
  updatedAt: string
}

export const STORAGE_VERSION = 1 as const

export type ListFilter = 'all' | 'needed' | 'found'
export type ListSort = 'order' | 'alpha' | 'set'
