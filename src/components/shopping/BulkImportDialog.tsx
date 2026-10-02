import { cardImage, resolveCardByName, ScryCard } from '@/lib/shopping/cards'
import { NewItemInput } from '@/lib/shopping/operations'
import { mergeParsedLines, ParsedLine, parseShoppingList } from '@/lib/shopping/parse'
import { useShoppingLists } from '@/lib/shopping/ShoppingListProvider'
import { BTN, BTN_PRIMARY, cx, SUB } from '@/lib/ui'
import { useWorkshop } from '@/lib/workshop'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState } from 'react'

type Status = 'resolved' | 'ambiguous' | 'unresolved' | 'invalid' | 'skipped'
type Row = {
  key: string
  quantity: number
  name: string
  setCode?: string
  status: Status
  card?: ScryCard
  setMissing?: boolean
  suggestions?: string[]
}

const SAMPLE = `Sol Ring
1 Rhystic Study [WOT]
4 Lightning Bolt (CLB)
4 Llanowar Elves`

const resolveRow = async (line: ParsedLine): Promise<Row> => {
  const base = { key: `${line.lineNumber}-${line.name}`, quantity: line.quantity, name: line.name, setCode: line.setCode }
  if (line.error) return { ...base, status: 'invalid' }
  let res = await resolveCardByName(line.name, line.setCode)
  let setMissing = false
  if (res.status === 'unresolved' && line.setCode) {
    const retry = await resolveCardByName(line.name)
    if (retry.status === 'resolved') { res = retry; setMissing = true }
  }
  if (res.status === 'resolved') return { ...base, status: 'resolved', card: res.card, setMissing }
  if (res.status === 'ambiguous') return { ...base, status: 'ambiguous', suggestions: res.suggestions }
  return { ...base, status: 'unresolved' }
}

const BulkImportDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { addItemsBulk } = useShoppingLists()
  const { toast } = useWorkshop()
  const [step, setStep] = useState<'input' | 'review'>('input')
  const [text, setText] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [working, setWorking] = useState(false)

  const reset = () => { setStep('input'); setText(''); setRows([]); setWorking(false) }

  const resolveAll = async () => {
    const parsed = mergeParsedLines(parseShoppingList(text))
    if (parsed.length === 0) { toast('Nothing to import'); return }
    setWorking(true)
    setStep('review')
    const out: Row[] = []
    for (const line of parsed) {
      // sequential to respect Scryfall rate limits
      // eslint-disable-next-line no-await-in-loop
      out.push(await resolveRow(line))
      setRows([...out])
    }
    setWorking(false)
  }

  const pickSuggestion = async (key: string, name: string) => {
    const res = await resolveCardByName(name)
    setRows((rs) => rs.map((r) => (r.key === key
      ? (res.status === 'resolved' ? { ...r, name, status: 'resolved', card: res.card, suggestions: undefined } : r)
      : r)))
  }

  const retryRow = async (key: string, name: string) => {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, name } : r)))
    const res = await resolveCardByName(name)
    setRows((rs) => rs.map((r) => (r.key === key
      ? (res.status === 'resolved'
        ? { ...r, status: 'resolved', card: res.card }
        : res.status === 'ambiguous'
          ? { ...r, status: 'ambiguous', suggestions: res.suggestions }
          : { ...r, status: 'unresolved' })
      : r)))
  }

  const toggleSkip = (key: string) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, status: r.status === 'skipped' ? (r.card ? 'resolved' : 'unresolved') : 'skipped' } : r)))

  const resolvedRows = rows.filter((r) => r.status === 'resolved' && r.card)
  const unresolvedCount = rows.filter((r) => r.status === 'unresolved' || r.status === 'invalid').length
  const ambiguousCount = rows.filter((r) => r.status === 'ambiguous').length

  const commit = () => {
    const inputs: NewItemInput[] = resolvedRows.map((r) => ({
      cardName: r.card!.name,
      cardId: r.card!.id,
      oracleCardId: r.card!.oracle_id,
      selectedPrintingId: r.setCode && !r.setMissing ? r.card!.id : undefined,
      selectedSetCode: r.setCode && !r.setMissing ? r.card!.set : undefined,
      quantityWanted: r.quantity,
      snapshot: { imageUrl: cardImage(r.card!), typeLine: r.card!.type_line },
    }))
    const result = addItemsBulk(inputs)
    toast(
      `Imported ${result?.added ?? 0} card${(result?.added ?? 0) === 1 ? '' : 's'}` +
      (result?.merged ? `, merged ${result.merged}` : '') +
      (unresolvedCount || ambiguousCount ? ` · ${unresolvedCount + ambiguousCount} skipped` : '')
    )
    reset(); onClose()
  }

  const statusBadge = (r: Row) => {
    const map: Record<Status, string> = {
      resolved: 'text-forest', ambiguous: 'text-[#8a6d1f]', unresolved: 'text-[#7a3b30]', invalid: 'text-[#7a3b30]', skipped: 'text-muted',
    }
    const label: Record<Status, string> = {
      resolved: r.setMissing ? 'Resolved (set not found — Any)' : 'Resolved', ambiguous: 'Ambiguous', unresolved: 'Not found', invalid: 'Invalid line', skipped: 'Skipped',
    }
    return <span className={cx('text-[12px] font-semibold', map[r.status])}>{label[r.status]}</span>
  }

  return (
    <Transition show={open} as={Fragment} afterLeave={reset}>
      <Dialog onClose={onClose} className="relative z-20">
        <Transition.Child as={Fragment} enter="transition-opacity" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-[#10212899]" aria-hidden="true" />
        </Transition.Child>
        <div className="fixed inset-0 flex justify-center items-center p-4 max-[760px]:items-end max-[760px]:p-0">
          <Dialog.Panel className="bg-paper border border-line rounded-xl w-full max-w-[640px] max-h-[85vh] flex flex-col overflow-hidden max-[760px]:rounded-b-none max-[760px]:max-w-none">
            <div className="p-5 border-b border-line">
              <Dialog.Title className="text-base font-semibold">Bulk import</Dialog.Title>
              <p className={cx(SUB, '!text-[13px]')}>Paste a deck list — quantities and set codes are understood.</p>
            </div>

            {step === 'input' ? (
              <div className="p-5 overflow-y-auto">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={10}
                  placeholder={SAMPLE}
                  aria-label="Cards to import"
                  className="w-full px-3 py-2 border border-[#c9c7be] rounded-md bg-[#fffdf9] text-ink font-mono text-sm"
                />
                <p className="text-[12px] text-muted mt-2">
                  Examples: <code>Sol Ring</code>, <code>4 Llanowar Elves</code>, <code>1 Rhystic Study [WOT]</code>, <code>4 Lightning Bolt (CLB)</code>
                </p>
              </div>
            ) : (
              <div className="p-4 overflow-y-auto space-y-2">
                {working && <p className="text-[13px] text-muted">Resolving against Scryfall…</p>}
                {rows.map((r) => (
                  <div key={r.key} className="border border-line rounded-md p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">
                          {r.quantity > 1 ? `${r.quantity}× ` : ''}{r.card?.name || r.name || <span className="text-muted">(empty)</span>}
                          {r.setCode && <span className="font-mono text-[11px] text-muted ml-2">[{r.setCode}]</span>}
                        </div>
                        {statusBadge(r)}
                      </div>
                      <button onClick={() => toggleSkip(r.key)} className="text-[12px] underline text-muted shrink-0">
                        {r.status === 'skipped' ? 'Include' : 'Skip'}
                      </button>
                    </div>

                    {r.status === 'ambiguous' && (
                      <div className="mt-2">
                        <p className="text-[12px] text-muted mb-1">Did you mean:</p>
                        <div className="flex gap-1 flex-wrap">
                          {r.suggestions?.map((s) => (
                            <button key={s} onClick={() => pickSuggestion(r.key, s)} className="text-[12px] border border-line rounded px-2 py-1 hover:border-brass">{s}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    {(r.status === 'unresolved' || r.status === 'invalid') && (
                      <div className="mt-2 flex gap-2">
                        <input
                          defaultValue={r.name}
                          onKeyDown={(e) => { if (e.key === 'Enter') retryRow(r.key, (e.target as HTMLInputElement).value) }}
                          aria-label={`Correct name for line ${r.key}`}
                          className="flex-1 min-w-0 px-2 py-1.5 border border-[#c9c7be] rounded bg-[#fffdf9] text-sm"
                        />
                        <button
                          onClick={(e) => retryRow(r.key, (e.currentTarget.previousSibling as HTMLInputElement).value)}
                          className="text-[12px] border border-line rounded px-2 hover:border-brass"
                        >Resolve</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 border-t border-line flex justify-between items-center gap-2">
              {step === 'review' ? (
                <span className="text-[13px] text-muted">
                  {resolvedRows.length} ready{ambiguousCount ? ` · ${ambiguousCount} ambiguous` : ''}{unresolvedCount ? ` · ${unresolvedCount} unresolved` : ''}
                </span>
              ) : <span />}
              <div className="flex gap-2">
                {step === 'review' && <button onClick={() => setStep('input')} className={BTN}>Back</button>}
                <button onClick={onClose} className={BTN}>Cancel</button>
                {step === 'input' ? (
                  <button onClick={resolveAll} disabled={!text.trim()} className={cx(BTN_PRIMARY, !text.trim() && 'opacity-50')}>Resolve cards</button>
                ) : (
                  <button onClick={commit} disabled={working || resolvedRows.length === 0} className={cx(BTN_PRIMARY, (working || resolvedRows.length === 0) && 'opacity-50')}>
                    Add {resolvedRows.length} to list
                  </button>
                )}
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  )
}

export default BulkImportDialog
