import {
  createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import { BulkResult, NewItemInput } from './operations'
import { getLastListId, setLastListId } from './prefs'
import { shoppingStore, ShoppingStore, StoreState } from './store'
import { ListFilter, ListSort, ShoppingList, ShoppingListItem } from './types'

type Ctx = {
  loaded: boolean
  storageError: string | null
  recoveryMessage: string | null
  dismissRecovery: () => void

  lists: ShoppingList[]
  currentListId: string | null
  currentList: ShoppingList | null
  selectList: (id: string) => void

  filter: ListFilter
  setFilter: (f: ListFilter) => void
  sort: ListSort
  setSort: (s: ListSort) => void
  search: string
  setSearch: (s: string) => void

  createList: (input: { name: string; description?: string; color?: string }) => void
  renameList: (id: string, name: string) => void
  updateListMeta: (id: string, patch: { description?: string; color?: string }) => void
  deleteList: (id: string) => void
  duplicateList: (id: string) => void

  addItem: (input: NewItemInput) => void
  addItemsBulk: (inputs: NewItemInput[]) => BulkResult | null
  removeItem: (itemId: string) => void
  restoreItem: (item: ShoppingListItem) => void
  updateItem: (itemId: string, patch: { note?: string; cardName?: string }) => void
  setQuantityWanted: (itemId: string, qty: number) => void
  setQuantityFound: (itemId: string, qty: number) => void
  incrementFound: (itemId: string) => void
  decrementFound: (itemId: string) => void
  toggleComplete: (itemId: string) => void
  selectPrinting: (
    itemId: string,
    printing: { printingId?: string; setCode?: string; snapshot?: { imageUrl?: string; typeLine?: string } }
  ) => void
  reorderItems: (orderedIds: string[]) => void

  exportEnvelope: () => ReturnType<ShoppingStore['exportEnvelope']>
  importEnvelope: (value: unknown, mode: 'merge' | 'replace') => { lists: number; items: number }
}

const ShoppingListContext = createContext<Ctx | null>(null)

const emptyState: StoreState = {
  storage: { version: 1, lists: [], updatedAt: '' },
  loaded: false,
  storageError: null,
  recoveryMessage: null,
}

export const ShoppingListProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<StoreState>(emptyState)
  const [currentListId, setCurrentListId] = useState<string | null>(null)
  const [filter, setFilter] = useState<ListFilter>('all')
  const [sort, setSort] = useState<ListSort>('order')
  const [search, setSearch] = useState('')

  // Hydrate after mount (never during SSR) and subscribe to store changes.
  useEffect(() => {
    shoppingStore.load()
    setState(shoppingStore.getState())
    const unsub = shoppingStore.subscribe(() => setState(shoppingStore.getState()))
    const last = getLastListId()
    const lists = shoppingStore.getState().storage.lists
    setCurrentListId(lists.find((l) => l.id === last)?.id ?? lists[0]?.id ?? null)
    return unsub
  }, [])

  const lists = state.storage.lists

  // Keep a valid current selection as lists change.
  useEffect(() => {
    if (!state.loaded) return
    if (currentListId && lists.some((l) => l.id === currentListId)) return
    const next = lists[0]?.id ?? null
    setCurrentListId(next)
  }, [state.loaded, lists, currentListId])

  const selectList = useCallback((id: string) => {
    setCurrentListId(id)
    setLastListId(id)
  }, [])

  const currentList = useMemo(
    () => lists.find((l) => l.id === currentListId) ?? null,
    [lists, currentListId]
  )

  const withList = useCallback(
    (fn: (id: string) => void) => {
      if (currentListId) fn(currentListId)
    },
    [currentListId]
  )

  const value: Ctx = useMemo(
    () => ({
      loaded: state.loaded,
      storageError: state.storageError,
      recoveryMessage: state.recoveryMessage,
      dismissRecovery: () => shoppingStore.dismissRecoveryMessage(),

      lists,
      currentListId,
      currentList,
      selectList,

      filter, setFilter, sort, setSort, search, setSearch,

      createList: (input) => {
        const list = shoppingStore.createList(input)
        selectList(list.id)
      },
      renameList: (id, name) => shoppingStore.updateList(id, { name }),
      updateListMeta: (id, patch) => shoppingStore.updateList(id, patch),
      deleteList: (id) => shoppingStore.deleteList(id),
      duplicateList: (id) => {
        const list = shoppingStore.duplicateList(id)
        if (list) selectList(list.id)
      },

      addItem: (input) => withList((id) => shoppingStore.addItem(id, input)),
      addItemsBulk: (inputs) => {
        let result: BulkResult | null = null
        withList((id) => { result = shoppingStore.addItemsBulk(id, inputs) })
        return result
      },
      removeItem: (itemId) => withList((id) => shoppingStore.removeItem(id, itemId)),
      restoreItem: (item) => withList((id) => shoppingStore.restoreItem(id, item)),
      updateItem: (itemId, patch) => withList((id) => shoppingStore.updateItem(id, itemId, patch)),
      setQuantityWanted: (itemId, qty) => withList((id) => shoppingStore.setQuantityWanted(id, itemId, qty)),
      setQuantityFound: (itemId, qty) => withList((id) => shoppingStore.setQuantityFound(id, itemId, qty)),
      incrementFound: (itemId) => withList((id) => shoppingStore.incrementQuantityFound(id, itemId)),
      decrementFound: (itemId) => withList((id) => shoppingStore.decrementQuantityFound(id, itemId)),
      toggleComplete: (itemId) => withList((id) => shoppingStore.toggleItemComplete(id, itemId)),
      selectPrinting: (itemId, printing) => withList((id) => shoppingStore.selectPreferredPrinting(id, itemId, printing)),
      reorderItems: (orderedIds) => withList((id) => shoppingStore.reorderItems(id, orderedIds)),

      exportEnvelope: () => shoppingStore.exportEnvelope(),
      importEnvelope: (value, mode) => shoppingStore.importEnvelope(value, mode),
    }),
    [state, lists, currentListId, currentList, selectList, withList, filter, sort, search]
  )

  return <ShoppingListContext.Provider value={value}>{children}</ShoppingListContext.Provider>
}

export const useShoppingLists = (): Ctx => {
  const ctx = useContext(ShoppingListContext)
  if (!ctx) throw new Error('useShoppingLists must be used within a ShoppingListProvider')
  return ctx
}
