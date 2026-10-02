import { isComplete } from '@/lib/shopping/operations'
import { listProgress } from '@/lib/shopping/selectors'
import { useShoppingLists } from '@/lib/shopping/ShoppingListProvider'
import { ListFilter, ListSort } from '@/lib/shopping/types'
import { useWorkshop } from '@/lib/workshop'
import { cx } from '@/lib/ui'
import { useState } from 'react'
import LocalStorageNotice from './LocalStorageNotice'
import ShoppingProgress from './ShoppingProgress'

const SECTION = 'text-[11px] font-bold tracking-[2px] text-[#806033] uppercase mt-6 mb-2'

const ShoppingSidebar = ({ onOpenBackupImport }: { onOpenBackupImport: () => void }) => {
  const {
    lists, currentListId, currentList, selectList, createList,
    filter, setFilter, sort, setSort, exportEnvelope,
  } = useShoppingLists()
  const { toast } = useWorkshop()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const items = currentList?.items ?? []
  const neededCount = items.filter((it) => !isComplete(it)).length
  const foundCount = items.filter(isComplete).length

  const submitCreate = () => {
    const name = newName.trim()
    if (!name) return
    createList({ name })
    setNewName(''); setCreating(false)
  }

  const exportBackup = () => {
    try {
      const blob = new Blob([JSON.stringify(exportEnvelope(), null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `card-cloud-shopping-lists-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
      toast('Backup downloaded')
    } catch { toast('Could not export backup') }
  }

  const filterBtn = (f: ListFilter, label: string, count: number) => (
    <button
      key={f}
      onClick={() => setFilter(f)}
      aria-pressed={filter === f}
      className={cx('w-full flex justify-between items-center px-3 py-2 rounded-md text-sm min-h-[40px]',
        filter === f ? 'bg-[#e9e6dc] font-semibold' : 'hover:bg-[#f0ede4]')}
    >
      <span>{label}</span><span className="font-mono text-xs text-muted">{count}</span>
    </button>
  )

  const sortBtn = (s: ListSort, label: string) => (
    <button
      key={s}
      onClick={() => setSort(s)}
      aria-pressed={sort === s}
      className={cx('w-full text-left px-3 py-2 rounded-md text-sm min-h-[40px]',
        sort === s ? 'bg-[#e9e6dc] font-semibold' : 'hover:bg-[#f0ede4]')}
    >
      {label}
    </button>
  )

  return (
    <aside className="bg-paper border border-line rounded-lg p-4 self-start">
      <ShoppingProgress list={currentList} />

      <div className={SECTION}>Shopping lists</div>
      <div className="grid gap-1">
        {lists.map((l) => (
          <button
            key={l.id}
            onClick={() => selectList(l.id)}
            aria-current={l.id === currentListId}
            className={cx('w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm min-h-[40px]',
              l.id === currentListId ? 'bg-[#e9e6dc] font-semibold' : 'hover:bg-[#f0ede4]')}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: l.color || '#a97731' }} />
            <span className="truncate text-left flex-1">{l.name}</span>
            <span className="font-mono text-xs text-muted">{l.items.length}</span>
          </button>
        ))}
        {lists.length === 0 && <p className="text-[13px] text-muted px-3 py-2">No lists yet.</p>}
      </div>

      {creating ? (
        <div className="flex gap-1 mt-2">
          <input
            autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitCreate(); if (e.key === 'Escape') setCreating(false) }}
            placeholder="List name" aria-label="New list name"
            className="flex-1 min-w-0 px-2 py-1.5 border border-[#c9c7be] rounded bg-[#fffdf9] text-sm"
          />
          <button onClick={submitCreate} className="text-sm border border-line rounded px-2 hover:border-brass">Add</button>
        </div>
      ) : (
        <button onClick={() => setCreating(true)} className="w-full text-left px-3 py-2 mt-1 rounded-md text-sm text-[#806033] hover:bg-[#f0ede4] min-h-[40px]">
          + New list
        </button>
      )}

      <div className={SECTION}>View</div>
      <div className="grid gap-1">
        {filterBtn('all', 'All cards', items.length)}
        {filterBtn('needed', 'Still needed', neededCount)}
        {filterBtn('found', 'Found', foundCount)}
      </div>

      <div className={SECTION}>Sort</div>
      <div className="grid gap-1">
        {sortBtn('order', 'List order')}
        {sortBtn('alpha', 'Alphabetical')}
        {sortBtn('set', 'Group by set')}
      </div>

      <div className={SECTION}>Backup</div>
      <div className="grid gap-1">
        <button onClick={exportBackup} className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-[#f0ede4] min-h-[40px]">Export JSON</button>
        <button onClick={onOpenBackupImport} className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-[#f0ede4] min-h-[40px]">Restore backup…</button>
      </div>

      <div className="mt-6 pt-4 border-t border-line">
        <LocalStorageNotice />
      </div>
    </aside>
  )
}

export default ShoppingSidebar
