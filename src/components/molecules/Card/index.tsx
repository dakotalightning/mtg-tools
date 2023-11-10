/* eslint-disable @next/next/no-img-element */
import { useCallback, useMemo, useState, Fragment, FC, useEffect } from 'react'

import Head from 'next/head'
import { BaseLayout } from '@components'
import { Formik, Field, Form, FormikHelpers } from 'formik';
import _ from 'lodash'
import { useSetData } from '@/lib/sets'
import { useCurrency } from '@/lib/currency'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { DateTime } from 'luxon';
const ICON_FALLBACK = 'https://svgs.scryfall.io/sets/planeswalker.svg?1699246800'

type TImageUris = {
  small: string
  art_crop: string
  normal: string
}

type TCardFaces = {
  image_uris: TImageUris
}

interface Card {
  id?: string
  name: string
  count?: string
  set: string
  collector_number: string
  set_name: string
  image_uris?: TImageUris
  card_faces?: TCardFaces[]
  released_at: string
  layout: string
  data: {
    [k: string]: any
  }
  legalities: {
    [k: string]: string
  }
  rarity: string
  prices: {
    usd: string
  }
  digital: boolean
}

const sortByRelease = (a: Card, b: Card) => {
  const ad = DateTime.fromFormat(a.released_at, 'y-MM-dd')
  const bd = DateTime.fromFormat(b.released_at, 'y-MM-dd')
  return bd.diff(ad).as('days')
}

const legals = [
  'standard', 'pioneer', 'modern', 'legacy', 'vintage', 'commander',
  'alchemy', 'explorer', 'brawl', 'historic', 'pauper', 'penny'
]

const CanadianDollar = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'CAD',
});

const Card: FC<{ card: { data: Card[] } }> = ({ card }) => {
  const [active, setActive] = useState(0)
  const [activeSet, setActiveSet] = useState(null)
  const { icons } = useSetData()
  const { currency } = useCurrency()

  const prints = useMemo<Card[]>(() => {
    return card.data.filter((d) => !d.digital && d.layout !== 'art_series').sort(sortByRelease)
  }, [card.data])

  const activeCard = useMemo<Card>(() => {
    return prints[active]
  }, [active, prints])

  return (
    <div key={activeCard.name} className="mb-4">
      <div className="flex flex-col mx-4 sm:mx-0 sm:flex-row gap-4">

        <div className="aspect-w-10 aspect-h-7 block w-full overflow-hidden rounded-[5%] border shadow-lg">
          {activeCard.image_uris
            ? <img alt={activeCard.name} className="max-w-full max-h-full" src={activeCard.image_uris?.normal} />
            : <img alt={activeCard.name} className="max-w-full max-h-full"
            src={activeCard.card_faces?.[0]?.image_uris.normal} />
          }
        </div>

        <div className="relative w-full sm:w-[600px] h-[400px] sm:h-auto">
          <div className="absolute top-0 bottom-0 overflow-hidden overflow-y-scroll w-full">
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-xl mb-4 border-b-2 font-beleren">
              {activeCard.name}
            </div>

            <div className="">
              {prints.map((d, i) => (
                <div key={d.id} onClick={() => setActive(i)}
                  className={`flex items-center border p-2 mb-1 relative
                  ${activeCard.id === d.id
                    ? 'bg-mtg'
                    : 'bg-slate-500 hover:bg-slate-800 text-slate-200'}
                  hover:cursor-pointer  shadow-sm`}>
                  <div className="h-[20px] w-[30px] lg:h-[30px] lg:w-[40px] flex justify-center items-center flex-col shrink-0 mr-2">
                    <img
                      alt={d.set_name}
                      className="max-w-full max-h-full invert"
                      src={icons[d.set] as unknown as string || ICON_FALLBACK} />
                  </div>
                  <div className="">
                    <div className="flex items-center text-xs">
                      {d.set.toUpperCase()} - {d.set_name}
                    </div>
                    <div className="text-xs">
                      #{d.collector_number} - {d.rarity.toUpperCase()}
                    </div>
                  </div>
                  {d.prices.usd ?
                    <div className=" absolute text-xs bg-black text-white py-1 px-2 right-0 bottom-0">
                      {CanadianDollar.format(parseFloat(d.prices.usd) * (currency ? currency.data.CAD.value : 1))}
                    </div>
                  : '' }

                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
      <div>

        <div className="">
          <div className="mx-4 lg:mx-0 my-2 mt-4">
            <div className="border-b-2 mb-2 font-beleren">Legalities</div>
          </div>
          <div className="grid grid-cols-2 md:my-4 sm:mx-0 mx-4 gap-y-2 gap-4">
            {legals.map((l) => (
              <div key={l} className="flex items-center font-semibold text-[11px] uppercase">
                <div className={`text-center
                  ${
                    activeCard.legalities[l] === 'legal'
                      ? 'bg-[#6424d2] text-white'
                      : 'bg-slate-300 text-[#6424d2]'
                    } w-full py-[3px]`}>
                  {l}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:mx-0 mx-4 my-2 mt-4">
            <div className="border-b-2 mb-2 font-beleren">Links</div>
            <a className="block text-sm text-slate-600 hover:text-blue-600 underline"
              href={`https://store.401games.ca/products/${_.kebabCase(activeCard.name)}-${activeCard.set}`} target="_blank">401 games</a>
            <a className="block text-sm text-slate-600 hover:text-blue-600 underline"
              href={`https://www.facetofacegames.com/${_.kebabCase(activeCard.name)}-${activeCard.collector_number}-${_.kebabCase(activeCard.set_name)}/`} target="_blank">Face to Face Games</a>
            <a className="block text-sm text-slate-600 hover:text-blue-600 underline"
              href={`https://www.cardkingdom.com/mtg/${_.kebabCase(activeCard.set_name)}/${_.kebabCase(activeCard.name)}`} target="_blank">Card Kingdom</a>
          </div>

        </div>

      </div>
    </div>
  )
}

export default Card
