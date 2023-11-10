import { useCallback, useMemo, useState, Fragment, FC, useEffect } from 'react'

import Link from 'next/link'
import { BaseLayout, Card } from '@components'
import { Combobox, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { CardsData } from './bulk'

const Page = () => {
  const [loading, setLoading] = useState(false)
  const [cardResults, setCardResults] = useState([])
  const [cards, setCards] = useState<string[]>([])
  const [foundCards, setFoundCards] = useState<CardsData[]>([])

  const getCards = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    if (q.length > 2) {
      const params = new URLSearchParams({
        q,
      })
      return fetch(`https://api.scryfall.com/cards/autocomplete?${params}`, { cache: 'force-cache' })
        .then((response) => response.json())
        .then((data) => data)
        .then((d) => setCardResults(d.data))
    }
  }, [])

  const onSelectCard = useCallback<(card: string) => void>((card) => {
    setCards((c) => [...c, card])
    setCardResults([])
  }, [])

  const onRemove = useCallback<(card: string) => void>((card) => {
    setCards((c) => c.filter((cc) => cc !== card))
  }, [])

  const findCards = useCallback(() => {
    setLoading(true)
    const cardPromises = cards.map((i) => {
      const params = new URLSearchParams({
        q: i,
        unique: 'prints',
        include_extras: 'true'
      })
      return fetch(`https://api.scryfall.com/cards/search?${params}`, { cache: 'force-cache' })
        .then((response) => response.json())
        .then((data) => data);
    })

    Promise.allSettled(cardPromises).
      then((results) => {
        const settled = results.map((result) => {
          if(result.status === 'fulfilled') {
            return result.value
          }
          return result.reason
        })
        setFoundCards(settled)
        setLoading(false)
      })
  }, [cards])

  if (foundCards.length > 0 && !loading) {
    return (
      <BaseLayout>
        <div className="my-4 text-right">
          <button
            onClick={() => setFoundCards([])}
            type="button"
            className="rounded-md bg-white py-2 px-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
        <div className="flex flex-col gap-4 pb-8">
          {foundCards.map((c) => (<Card key={c.data[0].name} card={c} />))}
        </div>
      </BaseLayout>
    )
  }

  return (
    <BaseLayout>

      <div className="space-y-8 divide-y divide-slate-300 p-4">
        <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
          <div>
            <label htmlFor="search" className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5">
              Add Card
            </label>
            <p className="mt-2 text-sm text-gray-500">Click <Link className="underline" href="/finder/bulk">Here to add bulk.</Link></p>
          </div>
          <div className="mt-2 sm:col-span-2 sm:mt-0">
            <Combobox value={null} onChange={onSelectCard}>
              <div className="relative mt-1">
                <div className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0">
                  <Combobox.Input
                    disabled={loading}
                    onChange={getCards}
                    className="block w-full max-w-lg rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:px-3 sm:leading-6" />
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                    // afterLeave={() => setQuery('')}
                  >
                    <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {cardResults.length === 0 ? (
                          <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                            Nothing found.
                          </div>
                        ) : cardResults.map((card) => (
                        <Combobox.Option
                          key={card}
                          value={card}
                          className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-teal-600 text-white' : 'text-gray-900'
                          }`
                        }>
                          {card}
                        </Combobox.Option>
                      ))}
                    </Combobox.Options>
                  </Transition>
                </div>
              </div>
            </Combobox>
            <p className="mt-2 text-sm text-gray-500 ml-3">Start typing to search for a card.</p>
          </div>
        </div>

        <div className="pt-5">
          {cards.length > 0 && (
            <>
              <div className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5 mb-2">Cards to find</div>
              <div className="flex flex-col items-start gap-1">
                {cards.map((c) => (
                  <div className="bg-slate-500 text-slate-100 px-3 py-1 rounded-md text-sm flex items-center" key={c}>
                    {c}
                    <button onClick={() => onRemove(c)}><XMarkIcon className="h-6 w-6 text-slate-300 ml-3 -mr-1" /></button>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex justify-end gap-x-3">
            {cards.length > 0 && (
              <button
                onClick={() => setCards([])}
                type="button"
                className="rounded-md bg-white py-2 px-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Clear
              </button>
            )}
            <button
              onClick={findCards}
              type="button"
              className="inline-flex justify-center rounded-md bg-indigo-600 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              disabled={cards.length === 0 || loading}
            >
              {loading ? '...' : 'Find'}
            </button>
          </div>
        </div>

      </div>

    </BaseLayout>
  )
}

export default Page
