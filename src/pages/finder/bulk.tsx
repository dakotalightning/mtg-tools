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
        <div className="my-4 text-right">
          <button
            onClick={() => setCards(null)}
            type="button"
            className="rounded-md bg-white py-2 px-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
        <div className="flex flex-col gap-4 pb-8">
          {cards.map((c) => (<Card key={c.data[0].name} card={c} />))}
        </div>
      </BaseLayout>
    )
  }

  return (
    <BaseLayout>

    <div className="rounded-md bg-yellow-50 p-4 mt-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">Attention needed</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              Only use if you know what you are doing. Add card names per line. Use the exact card name.
            </p>
          </div>
        </div>
      </div>
    </div>

      <Formik
        initialValues={{
          import: `Touch the Spirit Realm\nValorous Stance\nYotian Frontliner`,
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
            return fetch(`https://api.scryfall.com/cards/search?${params}`)
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
                rows={30}
              />
            </div>
          </div>

          <div className="pt-5">
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
