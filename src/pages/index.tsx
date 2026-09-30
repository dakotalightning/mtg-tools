import Icon from '@/components/Icon'
import { useWorkshop } from '@/lib/workshop'
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
  const { isSaved, toggleSaved, saved, toast } = useWorkshop()

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
  }, [printings, filter, sort, isSaved, saved])

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
      <div className="page-head">
        <div>
          <div className="eyebrow">FIND · IDENTIFY · ORGANIZE</div>
          <h1>Every printing. One place.</h1>
          <p className="sub">Find the right set, then give it a home in your collection.</p>
        </div>
        <div className="row"><span className="code">01 / THE WORKSHOP</span></div>
      </div>

      <form
        className="search"
        onSubmit={(e) => { e.preventDefault(); search(query) }}
      >
        <Icon name="search" />
        <input
          id="card-search"
          aria-label="Search cards"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a card name…"
        />
        <span className="key">/</span>
        <button className="primary">{loading ? 'Searching…' : 'Find card'}</button>
      </form>

      <div className="filter-row">
        {([
          ['all', 'All printings'],
          ['saved', 'In my collection'],
          ['foil', 'Foil available'],
        ] as [Filter, string][]).map(([f, label]) => (
          <button
            key={f}
            className={`chip${filter === f ? ' selected' : ''}`}
            onClick={() => setFilter(f)}
          >
            {label}
          </button>
        ))}
        <span className="hint">Live data · Scryfall · set-first organization</span>
      </div>

      {empty && !loading && (
        <div className="empty">
          <h2>No card found for that name.</h2>
          <p className="sub">Try another name — spelling is fuzzy-matched.</p>
          <button
            style={{ marginTop: 16 }}
            onClick={() => { setQuery('Sol Ring'); search('Sol Ring') }}
          >
            Show Sol Ring
          </button>
        </div>
      )}

      {loading && !card && <div className="empty"><p className="sub">Searching Scryfall…</p></div>}

      {card && selected && (
        <div className="finder-layout">
          <div className="card-column">
            <div className="aspect-w-10 aspect-h-7 block w-full overflow-hidden rounded-[5%] border shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="art max-w-full max-h-full" src={artOf(selected)} alt={`Art for ${selected.name}`} />
            </div>
            <div>
              <div className="under-card">
                <span>{selected.set_name}</span>
                <span>{selected.set.toUpperCase()} · #{selected.collector_number}</span>
              </div>
              <div className="legal">
                {LEGAL_FORMATS.map((f) => (
                  <span key={f} style={{ textTransform: 'capitalize' }}>
                    {legalLabel(f, selected.legalities?.[f] || 'not_legal')}
                  </span>
                ))}
              </div>
              <div className="card-actions">
                <button className="primary" onClick={makeLabel}>Make label</button>
                <button onClick={savePrinting}>
                  {isSaved(selected.id) ? 'Saved ✓' : 'Save printing'}
                </button>
              </div>
              <p className="art-credit">Card data &amp; art via Scryfall.<br />Set symbols shown as generic marks.</p>
            </div>
          </div>

          <div>
            <div className="result-heading">
              <div>
                <h2>{card.name}</h2>
                <p className="sub">{card.type_line}</p>
              </div>
              <div className="stat">{printings.length} PRINTINGS</div>
            </div>

            <div className="tabs" aria-label="Printing sort">
              <button className={sort === 'set' ? 'on' : undefined} onClick={() => setSort('set')}>By set</button>
              <button className={sort === 'year' ? 'on' : undefined} onClick={() => setSort('year')}>Release order</button>
            </div>

            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>SET / EDITION</th>
                    <th>RARITY</th>
                    <th>NUMBER</th>
                    <th>COLLECTION</th>
                    <th><span aria-label="Select printing">↗</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((p) => (
                    <tr key={p.id} className={selectedId === p.id ? 'selected' : undefined}>
                      <td>
                        <div className="set">
                          <span className="set-icon" aria-label="Generic set placeholder">◇</span>
                          <div>
                            <strong>{p.set_name}</strong>
                            <small>{p.set.toUpperCase()} · {year(p.released_at)}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="rarity">
                          <i className="dot" style={{ background: p.rarity === 'mythic' ? '#9c4f42' : p.rarity === 'rare' ? '#ad7c34' : '#798187' }} />
                          <span style={{ textTransform: 'capitalize' }}>{p.rarity}</span>
                        </span>
                      </td>
                      <td><span className="code">#{p.collector_number}</span></td>
                      <td><span className={isSaved(p.id) ? 'owned' : 'muted'}>{isSaved(p.id) ? 'Saved' : '—'}</span></td>
                      <td>
                        <button
                          className="row-select"
                          onClick={() => setSelectedId(p.id)}
                          aria-label={`Select ${p.set_name} printing`}
                        >↗</button>
                      </td>
                    </tr>
                  ))}
                  {visible.length === 0 && (
                    <tr><td colSpan={5}><span className="muted">No printings match this filter.</span></td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="note-box">
              <div>
                <h3>A place for every printing.</h3>
                <p>Create set dividers straight from your search results.</p>
              </div>
              <button onClick={makeLabel}>Open Label Studio →</button>
            </div>
          </div>
        </div>
      )}

      <div className="footer">
        <span>CARD CLOUD WORKSHOP / Live card data via Scryfall</span>
        <span>Independent concept · not affiliated with Wizards of the Coast</span>
      </div>
    </section>
  )
}

export default CardFinder
