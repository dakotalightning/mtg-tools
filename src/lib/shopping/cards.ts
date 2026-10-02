/**
 * Scryfall access for the shopping feature. The shopping list stores only
 * stable ids + tiny snapshots; everything visual is re-fetched here.
 *
 * - Name resolution distinguishes exact / fuzzy / ambiguous / unresolved.
 * - Base-card enrichment is batched through POST /cards/collection (75/req).
 * - Printing lists are fetched per unique oracle id and memoized, never per row.
 */

const API = 'https://api.scryfall.com'

export type ScryImageUris = { small?: string; normal?: string; art_crop?: string }

export type ScryCard = {
  id: string
  oracle_id?: string
  name: string
  set: string
  set_name: string
  collector_number: string
  rarity: string
  released_at: string
  type_line?: string
  mana_cost?: string
  image_uris?: ScryImageUris
  card_faces?: { image_uris?: ScryImageUris }[]
  prices?: { usd?: string | null; usd_foil?: string | null }
  finishes?: string[]
  digital: boolean
  layout: string
  prints_search_uri?: string
}

export const cardImage = (c?: ScryCard, size: 'small' | 'normal' = 'small') =>
  c?.image_uris?.[size] || c?.card_faces?.[0]?.image_uris?.[size] || c?.image_uris?.art_crop

export const cardPrice = (c?: ScryCard) => {
  const usd = c?.prices?.usd ?? c?.prices?.usd_foil
  return usd ? `$${usd}` : undefined
}

export type Resolution =
  | { status: 'resolved'; card: ScryCard }
  | { status: 'ambiguous'; suggestions: string[] }
  | { status: 'unresolved' }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Resolve a name to a card: exact first, then fuzzy; report ambiguity. */
export const resolveCardByName = async (name: string, setCode?: string): Promise<Resolution> => {
  const q = name.trim()
  if (!q) return { status: 'unresolved' }

  const setQ = setCode ? `&set=${encodeURIComponent(setCode.toLowerCase())}` : ''
  try {
    const exact = await fetch(`${API}/cards/named?exact=${encodeURIComponent(q)}${setQ}`, { cache: 'force-cache' })
    if (exact.ok) return { status: 'resolved', card: await exact.json() }

    const fuzzy = await fetch(`${API}/cards/named?fuzzy=${encodeURIComponent(q)}${setQ}`, { cache: 'force-cache' })
    if (fuzzy.ok) return { status: 'resolved', card: await fuzzy.json() }

    const err = await fuzzy.json().catch(() => null)
    const detail: string = err?.details || ''
    if (/too many cards match|more than one/i.test(detail)) {
      const ac = await fetch(`${API}/cards/autocomplete?q=${encodeURIComponent(q)}`, { cache: 'force-cache' })
      const sug = ac.ok ? (await ac.json()).data ?? [] : []
      return { status: 'ambiguous', suggestions: sug.slice(0, 8) }
    }
    return { status: 'unresolved' }
  } catch {
    return { status: 'unresolved' }
  }
}

type Identifier = { id: string } | { name: string }

/** Batched base-card enrichment. Returns cards keyed by id and by lowercased name. */
export const enrichCards = async (
  identifiers: Identifier[]
): Promise<{ byId: Map<string, ScryCard>; byName: Map<string, ScryCard> }> => {
  const byId = new Map<string, ScryCard>()
  const byName = new Map<string, ScryCard>()
  if (identifiers.length === 0) return { byId, byName }

  for (let i = 0; i < identifiers.length; i += 75) {
    const batch = identifiers.slice(i, i + 75)
    try {
      const res = await fetch(`${API}/cards/collection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifiers: batch }),
      })
      if (!res.ok) continue
      const data = await res.json()
      for (const card of (data.data ?? []) as ScryCard[]) {
        byId.set(card.id, card)
        byName.set(card.name.toLowerCase(), card)
      }
    } catch {
      /* leave this batch unenriched; UI falls back to snapshots */
    }
    if (i + 75 < identifiers.length) await sleep(90) // be polite to the API
  }
  return { byId, byName }
}

// Memoized printings by oracle id so repeated renders never re-fetch.
const printingsCache = new Map<string, ScryCard[]>()

export const fetchPrintings = async (card: ScryCard): Promise<ScryCard[]> => {
  const key = card.oracle_id || card.name.toLowerCase()
  const cached = printingsCache.get(key)
  if (cached) return cached
  const uri =
    card.prints_search_uri ||
    `${API}/cards/search?q=${encodeURIComponent(`!"${card.name}"`)}&unique=prints&include_extras=true`
  try {
    const res = await fetch(uri, { cache: 'force-cache' })
    if (!res.ok) return [card]
    const data = await res.json()
    const list = ((data.data ?? [card]) as ScryCard[])
      .filter((p) => !p.digital && p.layout !== 'art_series')
      .sort((a, b) => b.released_at.localeCompare(a.released_at))
    printingsCache.set(key, list)
    return list
  } catch {
    return [card]
  }
}
