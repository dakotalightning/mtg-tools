import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { STORAGE_KEY } from './persistence'
import { ShoppingListProvider, useShoppingLists } from './ShoppingListProvider'

afterEach(cleanup)

const Consumer = () => {
  const s = useShoppingLists()
  if (!s.loaded) return <div>loading…</div>
  return (
    <div>
      <div data-testid="count">{s.lists.length}</div>
      <div data-testid="items">{s.currentList?.items.length ?? 0}</div>
      <button onClick={() => s.createList({ name: 'Trip' })}>create</button>
      <button onClick={() => s.addItem({ cardName: 'Sol Ring' })}>add</button>
      <ul>{s.lists.map((l) => <li key={l.id}>{l.name}</li>)}</ul>
    </div>
  )
}

const renderApp = () => render(<ShoppingListProvider><Consumer /></ShoppingListProvider>)

describe('ShoppingListProvider', () => {
  it('hydrates after mount without crashing', async () => {
    renderApp()
    // First render returns the loading branch (no window/localStorage read during SSR/render);
    // the store only loads in a mount effect, after which the hydrated UI appears.
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('0'))
  })

  it('creates a list and adds a card', async () => {
    renderApp()
    await waitFor(() => screen.getByTestId('count'))
    fireEvent.click(screen.getByText('create'))
    expect(screen.getByTestId('count')).toHaveTextContent('1')
    fireEvent.click(screen.getByText('add'))
    expect(screen.getByTestId('items')).toHaveTextContent('1')
  })

  it('retains data across a remount (persistence)', async () => {
    renderApp()
    await waitFor(() => screen.getByTestId('count'))
    fireEvent.click(screen.getByText('create'))
    expect(screen.getByTestId('count')).toHaveTextContent('1')
    cleanup()

    renderApp()
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'))
    expect(screen.getByText('Trip')).toBeInTheDocument()
  })

  it('reflects a change made in another tab', async () => {
    renderApp()
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('0'))

    const env = JSON.stringify({
      version: 1,
      updatedAt: 'x',
      lists: [{ id: 'other', name: 'Other tab list', items: [], createdAt: 'x', updatedAt: 'x' }],
    })
    act(() => {
      window.localStorage.setItem(STORAGE_KEY, env)
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: env }))
    })
    await waitFor(() => expect(screen.getByText('Other tab list')).toBeInTheDocument())
  })
})
