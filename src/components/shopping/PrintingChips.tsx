import { ScryCard } from '@/lib/shopping/cards'
import { ShoppingListItem } from '@/lib/shopping/types'

type Selection = { printingId?: string; setCode?: string; snapshot?: { imageUrl?: string; typeLine?: string } }

type Props = {
  item: ShoppingListItem
  printings: ScryCard[] | undefined
  onSelect: (sel: Selection) => void
  onOpenPicker: () => void
}

const year = (iso: string) => (iso || '').slice(0, 4)

const PrintingChips = ({ item, printings, onSelect, onOpenPicker }: Props) => {
  const all = printings ?? []
  const selectedId = item.selectedPrintingId
  const isAny = !selectedId

  // Loading / offline fallback: show the saved set code (if any) rather than nothing.
  if (all.length === 0) {
    return (
      <div className="flex gap-2 items-center flex-wrap">
        {item.selectedSetCode ? (
          <span className="inline-flex items-center border border-brass bg-[#f5ede0] rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold min-h-[36px]">
            {item.selectedSetCode.toUpperCase()}
          </span>
        ) : (
          <span className="text-[12px] text-muted">Loading sets…</span>
        )}
      </div>
    )
  }

  let shown = all.slice(0, 3)
  if (selectedId && !shown.some((p) => p.id === selectedId)) {
    const sel = all.find((p) => p.id === selectedId)
    if (sel) shown = [sel, ...all.filter((p) => p.id !== sel.id)].slice(0, 3)
  }
  const extra = all.length - shown.length

  return (
    <div className="flex gap-2 items-stretch flex-wrap">
      {isAny && <span className="self-center text-[11px] uppercase tracking-wide text-muted mr-1">Any printing</span>}
      {shown.map((p) => {
        const selected = selectedId === p.id
        return (
          <button
            key={p.id}
            aria-pressed={selected}
            aria-label={`Set ${p.set_name}${selected ? ', selected' : ''}`}
            onClick={() => onSelect({ printingId: p.id, setCode: p.set, snapshot: { imageUrl: p.image_uris?.small, typeLine: p.type_line } })}
            className={`flex flex-col items-start justify-center border rounded-md px-2.5 py-1 min-h-[44px] text-left cursor-pointer hover:border-brass ${
              selected ? 'border-brass bg-[#f5ede0]' : 'border-line bg-paper'
            }`}
          >
            <span className="font-mono text-[11px] font-semibold leading-none">{p.set.toUpperCase()}</span>
            <span className="text-[10px] text-muted leading-tight mt-0.5">{year(p.released_at)} · {p.rarity}</span>
          </button>
        )
      })}
      {extra > 0 && (
        <button
          onClick={onOpenPicker}
          className="flex items-center justify-center border border-dashed border-[#b5b6ac] rounded-md px-2.5 min-h-[44px] text-[12px] text-muted hover:border-brass hover:text-ink"
        >
          + {extra} sets
        </button>
      )}
    </div>
  )
}

export default PrintingChips
