import { describe, expect, it } from 'vitest'
import { mergeParsedLines, parseShoppingList } from './parse'

describe('parseShoppingList', () => {
  it('parses a card name only', () => {
    expect(parseShoppingList('Sol Ring')).toEqual([
      { raw: 'Sol Ring', lineNumber: 1, quantity: 1, name: 'Sol Ring', setCode: undefined, error: undefined },
    ])
  })

  it('parses quantity plus name', () => {
    const [line] = parseShoppingList('4 Llanowar Elves')
    expect(line).toMatchObject({ quantity: 4, name: 'Llanowar Elves' })
  })

  it('parses the "4x" quantity form', () => {
    const [line] = parseShoppingList('4x Lightning Bolt')
    expect(line).toMatchObject({ quantity: 4, name: 'Lightning Bolt' })
  })

  it('parses a bracketed set code', () => {
    const [line] = parseShoppingList('1 Rhystic Study [WOT]')
    expect(line).toMatchObject({ quantity: 1, name: 'Rhystic Study', setCode: 'WOT' })
  })

  it('parses a parenthesized set code', () => {
    const [line] = parseShoppingList('4 Lightning Bolt (CLB)')
    expect(line).toMatchObject({ quantity: 4, name: 'Lightning Bolt', setCode: 'CLB' })
  })

  it('skips blank lines', () => {
    expect(parseShoppingList('Sol Ring\n\n   \n4 Llanowar Elves')).toHaveLength(2)
  })

  it('flags invalid quantities', () => {
    const [line] = parseShoppingList('0 Sol Ring')
    expect(line.error).toBe('invalid-quantity')
  })

  it('flags a missing name', () => {
    const [line] = parseShoppingList('[WOT]')
    expect(line.error).toBe('missing-name')
  })
})

describe('mergeParsedLines', () => {
  it('merges duplicate lines by name + set, summing quantity', () => {
    const merged = mergeParsedLines(parseShoppingList('2 Sol Ring\n1 Sol Ring\n4 Llanowar Elves'))
    expect(merged).toHaveLength(2)
    expect(merged.find((l) => l.name === 'Sol Ring')?.quantity).toBe(3)
  })

  it('keeps different set codes separate', () => {
    const merged = mergeParsedLines(parseShoppingList('1 Rhystic Study [WOT]\n1 Rhystic Study'))
    expect(merged).toHaveLength(2)
  })

  it('keeps errored lines distinct for review', () => {
    const merged = mergeParsedLines(parseShoppingList('0 Sol Ring\n0 Sol Ring'))
    expect(merged).toHaveLength(2)
  })
})
