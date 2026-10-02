import { cardImage, cardPrice, ScryCard } from '@/lib/shopping/cards'
import { isComplete } from '@/lib/shopping/operations'
import { ShoppingListItem } from '@/lib/shopping/types'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { useEffect } from 'react'
import PrintingChips from './PrintingChips'

type Selection = { printingId?: string; setCode?: string; snapshot?: { imageUrl?: string; typeLine?: string } }

type Props = {
  item: ShoppingListItem
  card?: ScryCard
  printings?: ScryCard[]
  ensurePrintings: (item: ShoppingListItem) => void
  onToggleComplete: () => void
  onIncrement: () => void
  onDecrement: () => void
  onSelectPrinting: (sel: Selection) => void
  onOpenPicker: () => void
  onRemove: () => void
}

const ShoppingItemRow = ({
  item, card, printings, ensurePrintings,
  onToggleComplete, onIncrement, onDecrement, onSelectPrinting, onOpenPicker, onRemove,
}: Props) => {
  useEffect(() => { ensurePrintings(item) }, [ensurePrintings, item])

  const complete = isComplete(item)
  const multi = item.quantityWanted > 1
  const img = cardImage(card) || item.snapshot?.imageUrl
  const typeLine = card?.type_line || item.snapshot?.typeLine
  const price = cardPrice(card)

  const stepper = (
    <div className="flex items-center gap-1" aria-label="Copies found">
      <button onClick={onDecrement} aria-label="Remove one copy found" className="w-11 h-11 rounded-md border border-[#bfc4b9] bg-paper hover:border-brass text-xl leading-none">−</button>
      <span className="w-12 text-center font-mono tabular-nums text-sm">{item.quantityFound}/{item.quantityWanted}</span>
      <button onClick={onIncrement} aria-label="Add one copy found" className="w-11 h-11 rounded-md border border-[#bfc4b9] bg-paper hover:border-brass text-xl leading-none">+</button>
    </div>
  )
  const markBtn = (
    <button
      onClick={onToggleComplete}
      className={`min-h-[44px] px-3 rounded-md border text-sm font-semibold whitespace-nowrap ${
        complete ? 'border-line bg-paper hover:border-brass' : 'bg-night text-white border-night hover:border-brass'
      }`}
    >
      {complete ? 'Undo' : 'Mark found'}
    </button>
  )
  const controls = multi ? stepper : markBtn

  return (
    <div className={`border rounded-lg p-3 flex gap-3 items-start ${complete ? 'bg-[#eef1ec] border-[#d7ddd3] opacity-80' : 'bg-paper border-line'}`}>
      {/* completion control */}
      <button
        role="checkbox"
        aria-checked={complete}
        aria-label={complete ? `Mark ${item.cardName} as not found` : `Mark ${item.cardName} as found`}
        onClick={onToggleComplete}
        className={`shrink-0 w-11 h-11 grid place-items-center rounded-md border cursor-pointer ${
          complete ? 'bg-forest border-forest text-white' : 'bg-paper border-[#bfc4b9] hover:border-brass'
        }`}
      >
        {complete && <CheckIcon className="w-5 h-5" />}
      </button>

      {/* image */}
      <div className="w-[52px] h-[72px] shrink-0 rounded border border-line overflow-hidden bg-[#e8eadf] grid place-items-center">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[10px] text-[#79643f] text-center px-1 line-clamp-3">{item.cardName}</span>
        )}
      </div>

      {/* main */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className={`font-semibold truncate ${complete ? 'text-muted' : ''}`}>{item.cardName}</div>
            <div className="text-[13px] text-muted">
              {typeLine ? `${typeLine} · ` : ''}
              {multi ? `${item.quantityFound} of ${item.quantityWanted} found` : complete ? 'Found' : '1 copy'}
              {price ? ` · ${price} ea.` : ''}
            </div>
          </div>
          <button onClick={onRemove} aria-label={`Remove ${item.cardName}`} className="shrink-0 text-muted hover:text-[#7a3b30] p-1">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* chips + mobile controls */}
        <div className="mt-2 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <PrintingChips item={item} printings={printings} onSelect={onSelectPrinting} onOpenPicker={onOpenPicker} />
          </div>
          <div className="hidden max-[760px]:flex shrink-0 self-center">{controls}</div>
        </div>
      </div>

      {/* desktop controls (right column) */}
      <div className="shrink-0 self-center max-[760px]:hidden">{controls}</div>
    </div>
  )
}

export default ShoppingItemRow
