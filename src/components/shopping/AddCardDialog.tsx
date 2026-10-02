import { resolveCardByName, cardImage } from '@/lib/shopping/cards'
import { useShoppingLists } from '@/lib/shopping/ShoppingListProvider'
import { useWorkshop } from '@/lib/workshop'
import { BTN, BTN_PRIMARY, cx } from '@/lib/ui'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useCallback, useRef, useState } from 'react'

const AddCardDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { addItem } = useShoppingLists()
  const { toast } = useWorkshop()
  const [q, setQ] = useState('')
  const [qty, setQty] = useState(1)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onQuery = useCallback((value: string) => {
    setQ(value)
    if (debounce.current) clearTimeout(debounce.current)
    if (value.trim().length < 2) { setSuggestions([]); return }
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(value)}`, { cache: 'force-cache' })
        const data = res.ok ? await res.json() : { data: [] }
        setSuggestions((data.data ?? []).slice(0, 10))
      } catch { setSuggestions([]) }
    }, 220)
  }, [])

  const add = useCallback(async (name: string) => {
    setBusy(true)
    const resolution = await resolveCardByName(name)
    setBusy(false)
    if (resolution.status !== 'resolved') {
      toast(`Couldn’t resolve “${name}”`)
      return
    }
    const c = resolution.card
    addItem({
      cardName: c.name,
      cardId: c.id,
      oracleCardId: c.oracle_id,
      quantityWanted: Math.max(1, qty),
      snapshot: { imageUrl: cardImage(c), typeLine: c.type_line },
    })
    toast(`Added ${qty > 1 ? `${qty}× ` : ''}${c.name}`)
    setQ(''); setSuggestions([]); setQty(1)
    onClose()
  }, [addItem, qty, toast, onClose])

  return (
    <Transition show={open} as={Fragment} afterLeave={() => { setQ(''); setSuggestions([]); setQty(1) }}>
      <Dialog onClose={onClose} className="relative z-20">
        <Transition.Child as={Fragment} enter="transition-opacity" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-[#10212899]" aria-hidden="true" />
        </Transition.Child>
        <div className="fixed inset-0 flex justify-center items-center p-4 max-[760px]:items-end max-[760px]:p-0">
          <Dialog.Panel className="bg-paper border border-line rounded-xl w-full max-w-[460px] p-5 max-[760px]:rounded-b-none max-[760px]:max-w-none">
            <Dialog.Title className="text-base font-semibold">Add a card</Dialog.Title>
            <p className="text-[13px] text-muted mb-3">Search by name, pick a result.</p>

            <div className="flex gap-2">
              <input
                autoFocus
                value={q}
                onChange={(e) => onQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && suggestions[0]) add(suggestions[0]) }}
                placeholder="Card name…"
                aria-label="Card name"
                className="flex-1 min-w-0 px-3 py-2 border border-[#c9c7be] rounded-md bg-[#fffdf9] text-ink min-h-[44px]"
              />
              <input
                type="number" min={1} value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value || '1', 10)))}
                aria-label="Quantity wanted"
                className="w-16 px-3 py-2 border border-[#c9c7be] rounded-md bg-[#fffdf9] text-ink min-h-[44px]"
              />
            </div>

            <div className="mt-2 max-h-56 overflow-y-auto">
              {busy && <p className="text-[13px] text-muted p-2">Adding…</p>}
              {suggestions.map((s) => (
                <button key={s} onClick={() => add(s)} className="w-full text-left px-3 py-2 rounded-md hover:bg-[#f5ede0] min-h-[44px]">
                  {s}
                </button>
              ))}
              {!busy && q.trim().length >= 2 && suggestions.length === 0 && (
                <p className="text-[13px] text-muted p-2">No matches.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={onClose} className={BTN}>Cancel</button>
              <button onClick={() => suggestions[0] && add(suggestions[0])} disabled={!suggestions[0] || busy} className={cx(BTN_PRIMARY, (!suggestions[0] || busy) && 'opacity-50')}>
                Add card
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  )
}

export default AddCardDialog
