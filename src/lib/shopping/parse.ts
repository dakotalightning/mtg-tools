/**
 * Deck-list / shopping-list text parser.
 *
 * Handles lines such as:
 *   Sol Ring
 *   1 Sol Ring
 *   4 Llanowar Elves
 *   4x Lightning Bolt
 *   1 Rhystic Study [WOT]
 *   4 Lightning Bolt (CLB)
 *
 * It is intentionally structural only — it extracts quantity, name and an
 * optional set code. Whether a name actually resolves (or is ambiguous) is
 * decided later against Scryfall, not here.
 */

export type ParsedLine = {
  raw: string
  lineNumber: number
  quantity: number
  name: string
  setCode?: string
  error?: 'invalid-quantity' | 'missing-name'
}

const SET_TAIL = /[([]([A-Za-z0-9]{2,6})[)\]]\s*\d*\s*$/
const QTY_LEAD = /^(\d+)\s*[xX]?\s+/

export const parseLine = (raw: string, lineNumber: number): ParsedLine | null => {
  const trimmed = raw.trim()
  if (trimmed === '') return null // blank lines are skipped entirely

  let rest = trimmed
  let setCode: string | undefined

  const setMatch = rest.match(SET_TAIL)
  if (setMatch) {
    setCode = setMatch[1].toUpperCase()
    rest = rest.slice(0, setMatch.index).trim()
  }

  let quantity = 1
  let error: ParsedLine['error']
  const qtyMatch = rest.match(QTY_LEAD)
  if (qtyMatch) {
    quantity = parseInt(qtyMatch[1], 10)
    rest = rest.slice(qtyMatch[0].length).trim()
    if (!Number.isInteger(quantity) || quantity <= 0) error = 'invalid-quantity'
  }

  const name = rest.trim()
  if (name === '') return { raw, lineNumber, quantity: 1, name: '', setCode, error: 'missing-name' }

  return { raw, lineNumber, quantity: error ? 1 : quantity, name, setCode, error }
}

export const parseShoppingList = (text: string): ParsedLine[] =>
  text
    .split(/\r?\n/)
    .map((line, i) => parseLine(line, i + 1))
    .filter((l): l is ParsedLine => l !== null)

/** Merge duplicate parsed lines by case-insensitive name + set code, summing quantity. */
export const mergeParsedLines = (lines: ParsedLine[]): ParsedLine[] => {
  const byKey = new Map<string, ParsedLine>()
  const order: string[] = []
  for (const line of lines) {
    if (line.error) {
      // keep errored lines distinct so they can be reviewed individually
      const k = `err:${line.lineNumber}`
      byKey.set(k, line)
      order.push(k)
      continue
    }
    const key = `${line.name.toLowerCase()}|${line.setCode ?? ''}`
    const existing = byKey.get(key)
    if (existing) {
      existing.quantity += line.quantity
    } else {
      byKey.set(key, { ...line })
      order.push(key)
    }
  }
  return order.map((k) => byKey.get(k)!)
}
