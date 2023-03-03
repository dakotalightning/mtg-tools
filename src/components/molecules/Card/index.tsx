/* eslint-disable @next/next/no-img-element */
import { useCallback, useMemo, useState, Fragment, FC, useEffect } from 'react'

import Head from 'next/head'
import { BaseLayout } from '@components'
import { Formik, Field, Form, FormikHelpers } from 'formik';
import _ from 'lodash'
import mtgSetInfo from '@data/setInfoLight'

interface Card {
  id?: string
  name: string
  count?: string
  set: string
  collector_number: string
  set_name: string
  image_uris?: {
    small: string
    art_crop: string
    normal: string
  }
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

const legals = [
  'standard', 'pioneer', 'modern', 'legacy', 'vintage', 'commander',
  'alchemy', 'explorer', 'brawl', 'historic', 'pauper', 'penny'
]

const Card: FC<{ card: { data: Card[] } }> = ({ card }) => {
  const [active, setActive] = useState(0)
  const [activeSet, setActiveSet] = useState(null)

  const activeCard = useMemo<Card>(() => {
    return card.data[active]
  }, [active, card])

  return (
    <div key={activeCard.name} className="md:grid-cols-2 lg:grid-cols-3 grid p-10 bg-slate-100 rounded-md border border-slate-300 gap-x-4">
      <div className="col-span-1 md:col-span-2 lg:col-span-3 text-xl mb-4 border-b-2 font-beleren">{activeCard.name}</div>
      <div className="lg:col-span-2">
        <div className="lg:grid-cols-4 grid">
          <div className="lg:col-span-2">
            <div className="aspect-w-10 aspect-h-7 block w-full overflow-hidden rounded-2xl shadow-lg">
              <img alt={activeCard.name} className="max-w-full max-h-full" src={activeCard.image_uris?.normal} />
            </div>
            <div className="text-sm text-slate-500 mt-1 hidden md:block">Select a set on the right to see the card.</div>
          </div>

          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 md:my-4 lg:mx-8 gap-y-2">
              {legals.map((l) => (
                <div key={l} className="flex items-center text-[10px] uppercase gap-1">
                  <div className={`text-center ${activeCard.legalities[l] === 'legal' ? 'bg-blue-500' : 'bg-slate-500'} text-white w-[80px] py-[2px] rounded-sm`}>
                    {activeCard.legalities[l].replace('_', ' ')}
                  </div> {l}
                </div>
              ))}
            </div>

            <div className="lg:mx-8 my-2 mt-8">
              <div className="border-b-2 mb-2 font-beleren">Links</div>
              <a className="block text-slate-600 hover:text-blue-600 underline" href={`https://store.401games.ca/products/${_.kebabCase(activeCard.name)}-${activeCard.set}`} target="_blank">401 games</a>
              <a className="block text-slate-600 hover:text-blue-600 underline" href={`https://www.facetofacegames.com/${_.kebabCase(activeCard.name)}-${activeCard.collector_number}-${_.kebabCase(activeCard.set_name)}/`} target="_blank">Face to Face Games</a>
              <a className="block text-slate-600 hover:text-blue-600 underline" href={`https://www.cardkingdom.com/mtg/${_.kebabCase(activeCard.set_name)}/${_.kebabCase(activeCard.name)}`} target="_blank">Card Kingdom</a>
            </div>

          </div>
        </div>
      </div>
      <div>
        {card.data.filter((d) => !d.digital).map((d, i) => (
          <div key={d.id} onClick={() => setActive(i)} className="flex items-center border p-2 mb-1 bg-slate-700 hover:bg-slate-500 hover:cursor-pointer text-slate-100 rounded-md shadow-lg">
            <div className="h-[20px] w-[30px] lg:h-[30px] lg:w-[40px] flex justify-center items-center flex-col shrink-0 mr-2">
              <img
                alt={d.set_name}
                className="max-w-full max-h-full invert"
                src={mtgSetInfo[d.set as keyof typeof mtgSetInfo].svg} />
            </div>
            <div className="">
              <div className="flex items-center text-sm">
                {d.set_name} ({d.set.toUpperCase()})
              </div>
              <div className="text-xs lg:text-sm">
                #{d.collector_number} - {d.rarity}
              </div>
            </div>
            <div className="ml-auto lg:text-lg text-md">
              {d.prices.usd ? `${d.prices.usd}` : '-'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Card
