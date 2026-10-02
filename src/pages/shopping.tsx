import AddCardDialog from '@/components/shopping/AddCardDialog'
import BackupImportDialog from '@/components/shopping/BackupImportDialog'
import LocalStorageNotice from '@/components/shopping/LocalStorageNotice'
import PrintingPicker from '@/components/shopping/PrintingPicker'
import ShoppingItemRow from '@/components/shopping/ShoppingItemRow'
import ShoppingProgress from '@/components/shopping/ShoppingProgress'
import ShoppingSidebar from '@/components/shopping/ShoppingSidebar'
import BulkImportDialog from '@/components/shopping/BulkImportDialog'
import { filterItems, groupBySet, searchItems, sortItems } from '@/lib/shopping/selectors'
import { useShoppingLists } from '@/lib/shopping/ShoppingListProvider'
import { useCardEnrichment } from '@/lib/shopping/useCardEnrichment'
import { ListFilter, ShoppingListItem } from '@/lib/shopping/types'
import { BTN, BTN_PRIMARY, cx, EYEBROW, H1, PAGE_HEAD, SUB } from '@/lib/ui'
import { useWorkshop } from '@/lib/workshop'
import { Menu } from '@headlessui/react'
import { useMemo, useRef, useState } from 'react'

const ShoppingPage = () => {
  const s = useShoppingLists()
  const { toast } = useWorkshop()

  const [addOpen, setAddOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [backupOpen, setBackupOpen] = useState(false)
  const [pickerItemId, setPickerItemId] = useState<string | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [undo, setUndo] = useState<ShoppingListItem | null>(null)
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const list = s.currentList
  const items = useMemo(() => list?.items ?? [], [list])
  const enrichment = useCardEnrichment(items)

  const visible = useMemo(() => {
    const filtered = searchItems(filterItems(items, s.filter), s.search)
    return sortItems(filtered, s.sort)
  }, [items, s.filter, s.search, s.sort])

  const grouped = useMemo(() => (s.sort === 'set' ? groupBySet(visible) : null), [s.sort, visible])

  const pickerItem = items.find((it) => it.id === pickerItemId) ?? null

  const doRemove = (item: ShoppingListItem) => {
    s.removeItem(item.id)
    setUndo(item)
    if (undoTimer.current) clearTimeout(undoTimer.current)
    undoTimer.current = setTimeout(() => setUndo(null), 6000)
  }
  const doUndo = () => {
    if (undo) { s.restoreItem(undo); setUndo(null) }
    if (undoTimer.current) clearTimeout(undoTimer.current)
  }

  const startRename = () => { setRenameValue(list?.name ?? ''); setRenaming(true) }
  const commitRename = () => {
    if (list && renameValue.trim()) s.renameList(list.id, renameValue.trim())
    setRenaming(false)
  }
  const deleteCurrent = () => {
    if (list && window.confirm(`Delete “${list.name}” and its ${list.items.length} card(s)? This cannot be undone.`)) {
      s.deleteList(list.id)
      toast('List deleted')
    }
  }
  const exportBackup = () => {
    try {
      const blob = new Blob([JSON.stringify(s.exportEnvelope(), null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `card-cloud-shopping-lists-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
      toast('Backup downloaded')
    } catch { toast('Could not export backup') }
  }

  const renderRow = (item: ShoppingListItem) => (
    <ShoppingItemRow
      key={item.id}
      item={item}
      card={enrichment.getCard(item)}
      printings={enrichment.getPrintings(item)}
      ensurePrintings={enrichment.ensurePrintings}
      onToggleComplete={() => s.toggleComplete(item.id)}
      onIncrement={() => s.incrementFound(item.id)}
      onDecrement={() => s.decrementFound(item.id)}
      onSelectPrinting={(sel) => s.selectPrinting(item.id, sel)}
      onOpenPicker={() => { enrichment.ensurePrintings(item); setPickerItemId(item.id) }}
      onRemove={() => doRemove(item)}
    />
  )

  // ---- hydration / empty states -------------------------------------------
  if (!s.loaded) {
    return (
      <section>
        <div className={PAGE_HEAD}><div><div className={EYEBROW}>SHOPPING LIST</div><h1 className={H1}>Shopping lists</h1></div></div>
        <div className="animate-pulse space-y-3">
          <div className="h-24 bg-[#ece9e0] rounded-lg" />
          <div className="h-20 bg-[#ece9e0] rounded-lg" />
          <div className="h-20 bg-[#ece9e0] rounded-lg" />
        </div>
      </section>
    )
  }

  if (s.lists.length === 0 || !list) {
    return (
      <section>
        <div className={PAGE_HEAD}>
          <div>
            <div className={EYEBROW}>SHOPPING LIST</div>
            <h1 className={H1}>Plan your pickups.</h1>
            <p className={SUB}>Create a list, add cards, then check them off while you shop.</p>
          </div>
        </div>
        <LocalStorageNotice />
        <div className="mt-4 px-6 py-12 bg-[#faf8f0] text-center border border-dashed border-[#b5b6ac] rounded-lg">
          <h2 className="text-xl mb-2">No shopping lists yet</h2>
          <p className={SUB}>Start one for your next trip to the store.</p>
          <button className={cx(BTN_PRIMARY, 'mt-4')} onClick={() => s.createList({ name: 'My shopping list' })}>
            Create a list
          </button>
          <div className="mt-3">
            <button className="text-[13px] underline text-muted" onClick={() => setBackupOpen(true)}>Restore from backup</button>
          </div>
        </div>
        <BackupImportDialog open={backupOpen} onClose={() => setBackupOpen(false)} />
      </section>
    )
  }

  const count = visible.length

  return (
    <section>
      <div className={PAGE_HEAD}>
        <div className="min-w-0">
          <div className={EYEBROW}>SHOPPING LIST</div>
          {renaming ? (
            <input
              autoFocus value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(false) }}
              aria-label="List name"
              className="font-serif text-[34px] leading-[1.2] tracking-[-.8px] mb-2 w-full bg-transparent border-b border-line outline-none max-[760px]:text-[29px]"
            />
          ) : (
            <h1 className={cx(H1, 'truncate')}>{list.name}</h1>
          )}
          <p className={cx(SUB, 'max-[760px]:text-sm')}>{list.description || 'Paste a deck list, plan ahead, then check off cards while you shop.'}</p>
        </div>
        <div className="flex gap-2 items-center shrink-0 max-[760px]:hidden">
          <button className={BTN} onClick={() => setBulkOpen(true)}>⇧ Bulk import</button>
          <button className={BTN_PRIMARY} onClick={() => setAddOpen(true)}>+ Add cards</button>
          <Menu as="div" className="relative">
            <Menu.Button className={cx(BTN, 'px-3')} aria-label="List options">⋯</Menu.Button>
            <Menu.Items className="absolute right-0 mt-1 w-44 bg-paper border border-line rounded-md shadow-lg z-10 py-1 focus:outline-none">
              {[
                ['Rename', startRename],
                ['Duplicate', () => s.duplicateList(list.id)],
                ['Export JSON', exportBackup],
              ].map(([label, fn]) => (
                <Menu.Item key={label as string}>
                  {({ active }) => (
                    <button onClick={fn as () => void} className={cx('w-full text-left px-3 py-2 text-sm', active && 'bg-[#f0ede4]')}>{label as string}</button>
                  )}
                </Menu.Item>
              ))}
              <div className="border-t border-line my-1" />
              <Menu.Item>
                {({ active }) => (
                  <button onClick={deleteCurrent} className={cx('w-full text-left px-3 py-2 text-sm text-[#7a3b30]', active && 'bg-[#f4ddd8]')}>Delete list</button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
      </div>

      {/* mobile action bar */}
      <div className="hidden max-[760px]:flex gap-2 mb-3">
        <button className={cx(BTN, 'flex-1')} onClick={() => setBulkOpen(true)}>⇧ Import</button>
        <button className={cx(BTN_PRIMARY, 'flex-1')} onClick={() => setAddOpen(true)}>+ Add</button>
      </div>

      <div className="grid grid-cols-[260px_1fr] gap-6 max-[1100px]:grid-cols-[220px_1fr] max-[760px]:grid-cols-1">
        {/* desktop sidebar */}
        <div className="max-[760px]:hidden">
          <ShoppingSidebar onOpenBackupImport={() => setBackupOpen(true)} />
        </div>

        {/* mobile list selector + progress + filters */}
        <div className="hidden max-[760px]:block space-y-3 mb-1">
          <select
            value={s.currentListId ?? ''} onChange={(e) => s.selectList(e.target.value)}
            aria-label="Choose list"
            className="w-full px-3 py-2 border border-[#c9c7be] rounded-md bg-[#fffdf9] min-h-[44px]"
          >
            {s.lists.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.items.length})</option>)}
          </select>
          <div className="bg-paper border border-line rounded-lg p-4"><ShoppingProgress list={list} /></div>
          <div className="flex gap-2">
            {(['all', 'needed', 'found'] as ListFilter[]).map((f) => (
              <button key={f} onClick={() => s.setFilter(f)} aria-pressed={s.filter === f}
                className={cx('flex-1 min-h-[44px] rounded-md border text-sm',
                  s.filter === f ? 'bg-[#e9e6dc] border-[#a0b1a5] font-semibold' : 'border-line bg-paper')}>
                {f === 'all' ? 'All' : f === 'needed' ? 'Needed' : 'Found'}
              </button>
            ))}
          </div>
        </div>

        {/* main column */}
        <div>
          <input
            value={s.search} onChange={(e) => s.setSearch(e.target.value)}
            placeholder="Search this list…" aria-label="Search this list"
            className="w-full px-4 py-2.5 border border-[#c5c5bd] rounded-lg bg-paper text-ink min-h-[44px] mb-3"
          />

          {enrichment.error && (
            <div role="alert" className="mb-3 bg-[#f4ddd8] border border-[#e0b3a9] text-[#7a3b30] rounded-md px-4 py-3 text-[13px] flex justify-between items-center gap-3">
              <span>Couldn’t load live card details. Showing saved info.</span>
              <button onClick={enrichment.retry} className="underline shrink-0">Retry</button>
            </div>
          )}

          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold">{count} card{count === 1 ? '' : 's'}</span>
            <span className="text-[12px] text-muted max-[760px]:hidden">Tap a set to choose the printing you want</span>
          </div>

          {count === 0 ? (
            <div className="px-6 py-12 bg-[#faf8f0] text-center border border-dashed border-[#b5b6ac] rounded-lg">
              <p className={SUB}>
                {items.length === 0 ? 'This list is empty. Add cards or import a deck list.'
                  : s.filter === 'found' ? 'Nothing checked off yet.'
                  : s.filter === 'needed' ? 'Everything here is found. Nice.'
                  : 'No cards match your search.'}
              </p>
            </div>
          ) : grouped ? (
            <div className="space-y-6">
              {grouped.map((g) => (
                <div key={g.code}>
                  <div className="text-[12px] font-bold tracking-[1.5px] text-muted uppercase mb-2 border-b border-line pb-1">{g.label}</div>
                  <div className="space-y-2">{g.items.map(renderRow)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">{visible.map(renderRow)}</div>
          )}
        </div>
      </div>

      <PrintingPicker
        open={pickerItemId !== null}
        onClose={() => setPickerItemId(null)}
        item={pickerItem}
        printings={pickerItem ? enrichment.getPrintings(pickerItem) : undefined}
        loading={pickerItem ? enrichment.getPrintings(pickerItem) === undefined : false}
        onSelect={(sel) => pickerItem && s.selectPrinting(pickerItem.id, sel)}
      />
      <AddCardDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <BulkImportDialog open={bulkOpen} onClose={() => setBulkOpen(false)} />
      <BackupImportDialog open={backupOpen} onClose={() => setBackupOpen(false)} />

      {undo && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#203138] text-white px-5 py-3 rounded-lg shadow-lg text-sm z-30 flex items-center gap-4">
          <span>Removed {undo.cardName}</span>
          <button onClick={doUndo} className="font-semibold text-gold underline">Undo</button>
        </div>
      )}
    </section>
  )
}

export default ShoppingPage
