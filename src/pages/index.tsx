import Icon from '@/components/Icon'
import { useWorkshop } from '@/lib/workshop'
import { BTN, BTN_PRIMARY, CODE, cx, EYEBROW, H1, H3, NOTE_BOX, PAGE_HEAD, SUB } from '@/lib/ui'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'

type TImageUris = { art_crop?: string; normal?: string; small?: string }

type TPrinting = {
  id: string
  name: string
  mana_cost?: string
  type_line?: string
  oracle_text?: string
  flavor_text?: string
  set: string
  set_name: string
  collector_number: string
  rarity: string
  released_at: string
  foil: boolean
  digital: boolean
  layout: string
  image_uris?: TImageUris
  card_faces?: { image_uris?: TImageUris }[]
  legalities: Record<string, string>
}

type Filter = 'all' | 'saved' | 'foil'
type Sort = 'set' | 'year'

const ART_FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="209"><rect width="100%" height="100%" fill="#e8eadf"/><text x="50%" y="50%" text-anchor="middle" dy=".35em" font-family="Georgia" font-size="16" fill="#79643f">No art</text></svg>'
  )

const year = (iso: string) => (iso || '').slice(0, 4)
const strip = (mana?: string) => (mana ? mana.replace(/[{}]/g, '') : '')
const artOf = (p?: TPrinting) => p?.image_uris?.normal || p?.card_faces?.[0]?.image_uris?.normal || ART_FALLBACK

const LEGAL_FORMATS = ['commander', 'vintage', 'legacy', 'modern'] as const
const legalLabel = (fmt: string, status: string) => {
  if (status === 'legal') return `${fmt} ✓`
  if (status === 'restricted') return `${fmt} restricted`
  if (status === 'banned') return `${fmt} banned`
  return `${fmt} —`
}

const CardFinder = () => {
  const router = useRouter()
  const { isSaved, toggleSaved, toast } = useWorkshop()

  const [query, setQuery] = useState('Sol Ring')
  const [card, setCard] = useState<TPrinting | null>(null)
  const [printings, setPrintings] = useState<TPrinting[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [empty, setEmpty] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('set')

  const search = useCallback(async (name: string) => {
    const q = name.trim()
    if (!q) return
    setLoading(true)
    setEmpty(false)
    try {
      const res = await fetch(
        `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(q)}`,
        { cache: 'force-cache' }
      )
      if (!res.ok) throw new Error('not found')
      const named = await res.json()
      const printsRes = await fetch(
        named.prints_search_uri || named.uri,
        { cache: 'force-cache' }
      )
      const printsData = await printsRes.json()
      const list: TPrinting[] = (printsData.data || [named]).filter(
        (p: TPrinting) => !p.digital && p.layout !== 'art_series'
      )
      if (list.length === 0) throw new Error('no prints')
      setCard(named)
      setPrintings(list)
      setSelectedId(list.find((p) => p.id === named.id)?.id || list[0].id)
    } catch {
      setCard(null)
      setPrintings([])
      setSelectedId(null)
      setEmpty(true)
    } finally {
      setLoading(false)
    }
  }, [])

  // Preload a card so the workshop opens with content.
  useEffect(() => {
    search('Sol Ring')
  }, [search])

  const selected = useMemo(
    () => printings.find((p) => p.id === selectedId) || printings[0] || null,
    [printings, selectedId]
  )

  const visible = useMemo(() => {
    const filtered = printings.filter((p) =>
      filter === 'all' ? true : filter === 'saved' ? isSaved(p.id) : p.foil
    )
    const sorted = [...filtered]
    if (sort === 'year') sorted.sort((a, b) => a.released_at.localeCompare(b.released_at))
    else sorted.sort((a, b) => a.set_name.localeCompare(b.set_name))
    return sorted
  }, [printings, filter, sort, isSaved])

  const makeLabel = () => {
    if (!selected) return
    router.push({
      pathname: '/labels',
      query: { text: selected.set_name, code: selected.set.toUpperCase() },
    })
  }

  const savePrinting = () => {
    if (!selected) return
    toggleSaved(selected.id)
    toast(isSaved(selected.id)
      ? `Removed ${selected.set.toUpperCase()} from your collection`
      : `Saved ${selected.set.toUpperCase()} to your collection`)
  }

  return (
    <section>
      <div className={PAGE_HEAD}>
        <div>
          <div className={EYEBROW}>FIND · IDENTIFY · ORGANIZE</div>
          <h1 className={H1}>Every printing. One place.</h1>
          <p className={cx(SUB, 'max-[760px]:text-sm')}>Find the right set, then give it a home in your collection.</p>
        </div>
        <div className="flex gap-3 items-center max-[760px]:hidden"><span className={CODE}>01 / THE WORKSHOP</span></div>
      </div>

      <form
        className="flex items-center gap-3 bg-paper border border-[#c5c5bd] pl-4 pr-2 py-1.5 rounded-lg mb-3"
        onSubmit={(e) => { e.preventDefault(); search(query) }}
      >
        <Icon name="search" />
        <input
          id="card-search"
          aria-label="Search cards"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a card name…"
          className="flex-1 min-w-0 border-0 bg-transparent outline-none py-2 text-ink"
        />
        <span className="font-mono text-xs border border-line px-[5px] py-[3px] text-muted max-[760px]:hidden">/</span>
        <button className={cx(BTN_PRIMARY, 'max-[760px]:text-sm max-[760px]:px-3')}>{loading ? 'Searching…' : 'Find card'}</button>
      </form>

      <div className="flex gap-2 flex-wrap items-center mb-6 print:hidden">
        {([
          ['all', 'All printings'],
          ['saved', 'In my collection'],
          ['foil', 'Foil available'],
        ] as [Filter, string][]).map(([f, label]) => (
          <button
            key={f}
            className={cx(
              'cursor-pointer border rounded-md text-[13px] min-h-[36px] px-3 py-1.5 font-medium hover:border-brass',
              filter === f
                ? 'bg-[#e4e8e5] border-[#a0b1a5] text-[#31543f]'
                : 'border-line bg-paper text-ink hover:bg-[#f5ede0]'
            )}
            onClick={() => setFilter(f)}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-[13px] text-muted max-[760px]:w-full max-[760px]:mt-1 max-[760px]:ml-0">Live data · Scryfall · set-first organization</span>
      </div>

      {empty && !loading && (
        <div className="px-6 py-12 bg-[#faf8f0] text-center border border-dashed border-[#b5b6ac] rounded-lg">
          <h2 className="text-xl mb-2">No card found for that name.</h2>
          <p className={SUB}>Try another name — spelling is fuzzy-matched.</p>
          <button
            className={cx(BTN, 'mt-4')}
            onClick={() => { setQuery('Sol Ring'); search('Sol Ring') }}
          >
            Show Sol Ring
          </button>
        </div>
      )}

      {loading && !card && (
        <div className="px-6 py-12 bg-[#faf8f0] text-center border border-dashed border-[#b5b6ac] rounded-lg">
          <p className={SUB}>Searching Scryfall…</p>
        </div>
      )}

      {card && selected && (
        <div className="grid grid-cols-[278px_1fr] gap-6 min-[1600px]:grid-cols-[300px_1fr] max-[1100px]:grid-cols-[230px_1fr] max-[1100px]:gap-[18px] max-[760px]:grid-cols-1">
          <div className="max-[760px]:grid max-[760px]:grid-cols-[140px_1fr] max-[760px]:gap-[14px]">
            <div className="aspect-w-10 aspect-h-7 block w-full overflow-hidden rounded-[5%] border shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="w-full max-h-full" src={artOf(selected)} alt={`Art for ${selected.name}`} />
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted my-[14px] max-[760px]:block max-[760px]:mt-0">
                <span className="max-[760px]:block max-[760px]:mb-2">{selected.set_name}</span>
                <span className="max-[760px]:block">{selected.set.toUpperCase()} · #{selected.collector_number}</span>
              </div>
              <div className="flex gap-1.5 flex-wrap max-[760px]:gap-1">
                {LEGAL_FORMATS.map((f) => (
                  <span key={f} className="text-[11px] bg-[#e4ebe2] text-[#375940] rounded px-[7px] py-1 capitalize">
                    {legalLabel(f, selected.legalities?.[f] || 'not_legal')}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-[18px] max-[760px]:grid-cols-1 max-[760px]:mt-[14px]">
                <button className={cx(BTN_PRIMARY, 'text-[13px] !p-2')} onClick={makeLabel}>Make label</button>
                <button className={cx(BTN, 'text-[13px] !p-2')} onClick={savePrinting}>
                  {isSaved(selected.id) ? 'Saved ✓' : 'Save printing'}
                </button>
              </div>
              <p className="text-xs mt-3 text-muted max-[760px]:text-[10px]">Card data &amp; art via Scryfall.<br />Set symbols shown as generic marks.</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-start mb-4 max-[760px]:mt-3">
              <div>
                <h2 className="font-serif text-[28px] mb-[5px] max-[760px]:text-[25px]">{card.name}</h2>
                <p className={SUB}>{card.type_line}</p>
              </div>
              <div className="font-mono text-xs text-muted mt-1">{printings.length} PRINTINGS</div>
            </div>

            <div className="flex border-b border-line gap-6 max-[760px]:gap-5" aria-label="Printing sort">
              {([['set', 'By set'], ['year', 'Release order']] as [Sort, string][]).map(([s, label]) => (
                <button
                  key={s}
                  className={cx(
                    'border-0 rounded-none bg-transparent py-2.5 text-sm font-medium cursor-pointer max-[760px]:text-[13px]',
                    sort === s ? 'text-[#78561f] !border-b-2 border-brass font-bold' : 'text-muted'
                  )}
                  onClick={() => setSort(s)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-[11px] tracking-[1.2px] text-muted px-2.5 py-[13px] font-semibold border-b border-line max-[760px]:px-1.5">SET / EDITION</th>
                    <th className="text-left text-[11px] tracking-[1.2px] text-muted px-2.5 py-[13px] font-semibold border-b border-line max-[760px]:px-1.5">RARITY</th>
                    <th className="text-left text-[11px] tracking-[1.2px] text-muted px-2.5 py-[13px] font-semibold border-b border-line max-[1100px]:hidden">NUMBER</th>
                    <th className="text-left text-[11px] tracking-[1.2px] text-muted px-2.5 py-[13px] font-semibold border-b border-line max-[760px]:hidden">COLLECTION</th>
                    <th className="text-left text-[11px] tracking-[1.2px] text-muted px-2.5 py-[13px] font-semibold border-b border-line max-[760px]:px-1.5"><span aria-label="Select printing">↗</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((p) => (
                    <tr key={p.id} className={selectedId === p.id ? 'bg-[#e9e6dc]' : undefined}>
                      <td className="px-2.5 py-[15px] border-b border-line max-[760px]:px-1.5">
                        <div className="flex gap-3 items-center max-[760px]:gap-2">
                          <span className="w-[34px] h-[34px] grid place-items-center bg-[#ece8df] border border-[#d4cec0] rounded-md text-xl text-[#79643f] max-[760px]:w-7 max-[760px]:h-7 max-[760px]:shrink-0" aria-label="Generic set placeholder">◇</span>
                          <div>
                            <strong className="max-[760px]:text-xs">{p.set_name}</strong>
                            <small className="block text-xs text-muted mt-0.5 max-[760px]:text-[11px]">{p.set.toUpperCase()} · {year(p.released_at)}</small>
                          </div>
                        </div>
                      </td>
                      <td className="px-2.5 py-[15px] border-b border-line max-[760px]:px-1.5">
                        <span className="flex items-center gap-1.5 text-[13px] max-[760px]:text-xs">
                          <i className="w-[7px] h-[7px] rounded-full" style={{ background: p.rarity === 'mythic' ? '#9c4f42' : p.rarity === 'rare' ? '#ad7c34' : '#798187' }} />
                          <span className="capitalize">{p.rarity}</span>
                        </span>
                      </td>
                      <td className="px-2.5 py-[15px] border-b border-line max-[1100px]:hidden"><span className={CODE}>#{p.collector_number}</span></td>
                      <td className="px-2.5 py-[15px] border-b border-line max-[760px]:hidden"><span className={isSaved(p.id) ? 'text-xs text-forest font-semibold' : 'text-muted'}>{isSaved(p.id) ? 'Saved' : '—'}</span></td>
                      <td className="px-2.5 py-[15px] border-b border-line max-[760px]:px-1.5">
                        <button
                          className="p-0 w-9 min-h-[36px] bg-transparent border border-transparent rounded-md cursor-pointer text-ink hover:border-brass hover:bg-[#f5ede0]"
                          onClick={() => setSelectedId(p.id)}
                          aria-label={`Select ${p.set_name} printing`}
                        >↗</button>
                      </td>
                    </tr>
                  ))}
                  {visible.length === 0 && (
                    <tr><td colSpan={5} className="px-2.5 py-[15px] border-b border-line"><span className="text-muted">No printings match this filter.</span></td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className={NOTE_BOX}>
              <div>
                <h3 className={H3}>A place for every printing.</h3>
                <p className="text-[13px] text-[#64695f] mt-[3px]">Create set dividers straight from your search results.</p>
              </div>
              <button className={cx(BTN, 'text-[13px]')} onClick={makeLabel}>Open Label Studio →</button>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-line mt-7 pt-4 flex justify-between gap-3 text-[11px] text-muted print:hidden max-[760px]:flex-col max-[760px]:text-[10px]">
        <span>CARD CLOUD WORKSHOP / Live card data via Scryfall</span>
        <span>Independent concept · not affiliated with Wizards of the Coast</span>
      </div>
    </section>
  )
}

export default CardFinder
