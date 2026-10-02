import { useCallback, useEffect, useRef, useState } from 'react'
import { enrichCards, fetchPrintings, ScryCard } from './cards'
import { ShoppingListItem } from './types'

type EnrichState = {
  byId: Map<string, ScryCard>
  byName: Map<string, ScryCard>
}

/**
 * Enriches a list's items with live Scryfall data. Base cards are fetched in
 * one batched /cards/collection call; printing lists are fetched per unique
 * oracle id on demand (memoized), never once per rendered row.
 */
export const useCardEnrichment = (items: ShoppingListItem[]) => {
  const [base, setBase] = useState<EnrichState>({ byId: new Map(), byName: new Map() })
  const [printings, setPrintings] = useState<Record<string, ScryCard[]>>({})
  const [enriching, setEnriching] = useState(false)
  const [error, setError] = useState(false)
  const [nonce, setNonce] = useState(0)
  const inflight = useRef<Set<string>>(new Set())

  // Stable signature of the identities we need to enrich.
  const signature = items
    .map((it) => it.cardId || it.cardName.toLowerCase())
    .sort()
    .join('|')

  useEffect(() => {
    let cancelled = false
    const seen = new Set<string>()
    const identifiers: ({ id: string } | { name: string })[] = []
    for (const it of items) {
      const key = it.cardId ? `id:${it.cardId}` : `name:${it.cardName.toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)
      identifiers.push(it.cardId ? { id: it.cardId } : { name: it.cardName })
    }
    if (identifiers.length === 0) {
      setBase({ byId: new Map(), byName: new Map() })
      return
    }
    setEnriching(true)
    setError(false)
    enrichCards(identifiers)
      .then((res) => {
        if (cancelled) return
        setBase(res)
        if (res.byId.size === 0 && res.byName.size === 0) setError(true)
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setEnriching(false))
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, nonce])

  const getCard = useCallback(
    (item: ShoppingListItem): ScryCard | undefined =>
      (item.cardId && base.byId.get(item.cardId)) || base.byName.get(item.cardName.toLowerCase()) || undefined,
    [base]
  )

  const printingKey = (item: ShoppingListItem, card?: ScryCard) =>
    item.oracleCardId || card?.oracle_id || item.cardName.toLowerCase()

  const ensurePrintings = useCallback(
    (item: ShoppingListItem) => {
      const card = (item.cardId && base.byId.get(item.cardId)) || base.byName.get(item.cardName.toLowerCase())
      if (!card) return
      const key = printingKey(item, card)
      if (printings[key] || inflight.current.has(key)) return
      inflight.current.add(key)
      fetchPrintings(card)
        .then((list) => setPrintings((p) => ({ ...p, [key]: list })))
        .finally(() => inflight.current.delete(key))
    },
    [base, printings]
  )

  const getPrintings = useCallback(
    (item: ShoppingListItem): ScryCard[] | undefined => {
      const card = (item.cardId && base.byId.get(item.cardId)) || base.byName.get(item.cardName.toLowerCase())
      return printings[printingKey(item, card)]
    },
    [base, printings]
  )

  const retry = useCallback(() => setNonce((n) => n + 1), [])

  return { getCard, getPrintings, ensurePrintings, enriching, error, retry }
}
