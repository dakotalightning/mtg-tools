import { isComplete } from './operations'
import { ListFilter, ListSort, ShoppingList, ShoppingListItem } from './types'

export const listProgress = (list: ShoppingList | null) => {
  const total = list?.items.length ?? 0
  const completed = list ? list.items.filter(isComplete).length : 0
  const remaining = total - completed
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
  return { total, completed, remaining, percent }
}

export const filterItems = (items: ShoppingListItem[], filter: ListFilter) => {
  if (filter === 'needed') return items.filter((it) => !isComplete(it))
  if (filter === 'found') return items.filter(isComplete)
  return items
}

export const searchItems = (items: ShoppingListItem[], query: string) => {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter(
    (it) =>
      it.cardName.toLowerCase().includes(q) ||
      (it.snapshot?.typeLine ?? '').toLowerCase().includes(q) ||
      (it.selectedSetCode ?? '').toLowerCase().includes(q)
  )
}

export const sortItems = (items: ShoppingListItem[], sort: ListSort) => {
  const copy = [...items]
  if (sort === 'alpha') copy.sort((a, b) => a.cardName.localeCompare(b.cardName))
  else copy.sort((a, b) => a.position - b.position) // 'order' (and base order for 'set' grouping)
  return copy
}

/** Group by selected set code; items without a selection go under "Any printing". */
export const groupBySet = (items: ShoppingListItem[]) => {
  const groups = new Map<string, ShoppingListItem[]>()
  for (const it of items) {
    const key = it.selectedSetCode?.toUpperCase() || '—ANY—'
    const arr = groups.get(key) ?? []
    arr.push(it)
    groups.set(key, arr)
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => (a === '—ANY—' ? 1 : b === '—ANY—' ? -1 : a.localeCompare(b)))
    .map(([code, groupItems]) => ({
      code,
      label: code === '—ANY—' ? 'Any / unspecified printing' : code,
      items: groupItems,
    }))
}
