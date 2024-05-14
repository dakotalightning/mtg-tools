import { useCallback, useMemo, useState, Fragment, FC, useEffect } from 'react'

import Head from 'next/head'
import { BaseLayout, Card } from '@components'
import { Formik, Field, Form, FormikHelpers } from 'formik';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid'

interface Values {
  import: string
}

export interface CardsData {
  data: Card[]
}

const Page = () => {
  const [cards, setCards] = useState<CardsData[] | null>(null)
  const [loading, setLoading] = useState(false)

  if (cards !== null && !loading) {
    return (
      <BaseLayout>
        <div className="my-4 flex justify-between">
          <div className="flex gap-4">
            <button
              onClick={() => setCards(null)}
              type="button"
              className="rounded-md bg-white py-2 px-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Simple View
            </button>
            <button
              onClick={() => setCards(null)}
              type="button"
              className="rounded-md bg-white py-2 px-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Detail View
            </button>
          </div>
          <button
            onClick={() => setCards(null)}
            type="button"
            className="rounded-md bg-white py-2 px-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => (<Card key={c.data[0].name} card={c} />))}
        </div>
      </BaseLayout>
    )
  }

  return (
    <BaseLayout>

      <div className="font-beleren text-3xl mb-3 mx-4 sm:mx-0 mt-6">Card Finder</div>

      <div className="mx-4 mb-4 sm:mx-0">
        <p>Once you&apos;ve added the card, the app will display all the sets and prints of that card. This means you can easily see how many versions of a card you have, their different artwork, and the sets they belong to. This feature makes managing your collection more organized and finding cards easier.</p>
      </div>

      <Formik
        initialValues={{
          import: `Touch the Spirit Realm\nValorous Stance\nYotian Frontliner\nKarn's Bastion\nMages' Contest\nMana Geyser `,
        }}
        onSubmit={async (
          values: Values,
          { setSubmitting }: FormikHelpers<Values>
        ) => {
          setLoading(true)

          const cardPromises = values.import.split('\n').map((i) => {
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
              setCards(settled)
              setLoading(false)
            })

        }}
      >
        <Form className="space-y-8 divide-y divide-slate-300">
          <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
            <label htmlFor="import" className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5">
              Enter Cards
            </label>
            <div className="mt-2 sm:col-span-2 sm:mt-0">
              <Field
                as="textarea"
                id="import"
                name="import"
                className="block w-full max-w-lg rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:py-1.5 sm:text-sm sm:px-3 sm:leading-6"
                rows={20}
              />
            </div>
          </div>

          <div className="py-5">
            <div className="flex justify-end gap-x-3">
              <button
                type="submit"
                className="inline-flex justify-center rounded-md bg-indigo-600 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                disabled={loading}
              >
                {loading ? '...' : 'Find'}
              </button>
            </div>
          </div>

        </Form>
      </Formik>

    </BaseLayout>
  )
}

export default Page
