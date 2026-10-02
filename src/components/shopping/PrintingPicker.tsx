import { cardImage, cardPrice, ScryCard } from '@/lib/shopping/cards'
import { ShoppingListItem } from '@/lib/shopping/types'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState } from 'react'

type Selection = { printingId?: string; setCode?: string; snapshot?: { imageUrl?: string; typeLine?: string } }

type Props = {
  open: boolean
  onClose: () => void
  item: ShoppingListItem | null
  printings: ScryCard[] | undefined
  loading: boolean
  onSelect: (sel: Selection) => void
}

const year = (iso: string) => (iso || '').slice(0, 4)

const PrintingPicker = ({ open, onClose, item, printings, loading, onSelect }: Props) => {
  const [q, setQ] = useState('')

  const filtered = (printings ?? []).filter((p) => {
    const s = q.trim().toLowerCase()
    if (!s) return true
    return p.set_name.toLowerCase().includes(s) || p.set.toLowerCase().includes(s) || p.collector_number.includes(s)
  })

  const choose = (sel: Selection) => {
    onSelect(sel)
    onClose()
  }

  return (
    <Transition show={open} as={Fragment} afterLeave={() => setQ('')}>
      <Dialog onClose={onClose} className="relative z-20">
        <Transition.Child as={Fragment} enter="transition-opacity" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-[#10212899]" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex justify-center items-center p-4 max-[760px]:items-end max-[760px]:p-0">
          <Transition.Child
            as={Fragment}
            enter="transition duration-150" enterFrom="opacity-0 translate-y-3" enterTo="opacity-100 translate-y-0"
            leave="transition duration-100" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-3"
          >
            <Dialog.Panel className="bg-paper border border-line rounded-xl w-full max-w-[560px] max-h-[80vh] flex flex-col overflow-hidden max-[760px]:rounded-b-none max-[760px]:max-w-none max-[760px]:max-h-[85vh]">
              <div className="p-5 border-b border-line">
                <Dialog.Title className="text-base font-semibold">Choose a printing</Dialog.Title>
                <p className="text-[13px] text-muted">{item?.cardName}</p>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search sets…"
                  aria-label="Search sets"
                  className="mt-3 w-full px-3 py-2 border border-[#c9c7be] rounded-md bg-[#fffdf9] text-ink min-h-[44px]"
                />
              </div>

              <div className="overflow-y-auto p-2">
                <button
                  onClick={() => choose({ printingId: undefined, setCode: undefined })}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-md hover:bg-[#f5ede0] min-h-[44px]"
                >
                  <span className="w-9 h-9 grid place-items-center bg-[#ece8df] border border-[#d4cec0] rounded-md text-[#79643f] shrink-0">◇</span>
                  <span>
                    <strong className="block text-sm">Any printing</strong>
                    <small className="text-xs text-muted">Buy whichever edition you find</small>
                  </span>
                  {!item?.selectedPrintingId && <span className="ml-auto text-forest font-semibold text-sm">Selected ✓</span>}
                </button>

                {loading && <p className="text-[13px] text-muted p-3">Loading printings…</p>}
                {!loading && filtered.length === 0 && <p className="text-[13px] text-muted p-3">No printings match.</p>}

                {filtered.map((p) => {
                  const selected = item?.selectedPrintingId === p.id
                  const finish = p.finishes?.includes('nonfoil') ? 'Nonfoil' : p.finishes?.includes('foil') ? 'Foil only' : ''
                  const price = cardPrice(p)
                  return (
                    <button
                      key={p.id}
                      onClick={() => choose({ printingId: p.id, setCode: p.set, snapshot: { imageUrl: cardImage(p), typeLine: p.type_line } })}
                      className={`w-full text-left flex items-center gap-3 p-3 rounded-md hover:bg-[#f5ede0] min-h-[44px] ${selected ? 'bg-[#e9e6dc]' : ''}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cardImage(p)} alt="" className="w-9 h-12 object-cover rounded border border-line shrink-0 bg-[#e8eadf]" />
                      <span className="min-w-0">
                        <strong className="block text-sm truncate">{p.set_name}</strong>
                        <small className="text-xs text-muted">
                          {p.set.toUpperCase()} · #{p.collector_number} · {p.rarity} · {year(p.released_at)}{finish ? ` · ${finish}` : ''}
                        </small>
                      </span>
                      <span className="ml-auto text-right shrink-0">
                        {price && <span className="block text-sm">{price}</span>}
                        {selected && <span className="text-forest font-semibold text-xs">Selected ✓</span>}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="p-3 border-t border-line flex justify-end">
                <button onClick={onClose} className="min-h-[44px] px-4 rounded-md border border-line bg-paper hover:border-brass">Close</button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}

export default PrintingPicker
