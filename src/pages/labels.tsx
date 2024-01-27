import { useCallback, useMemo, useState, Fragment, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import useAsync from '../hooks/useAsync';
import * as R from 'ramda'
import mtgSets from '@data/sets.json'
import { RARITY } from '../config/constants';
import dynamic from "next/dynamic";
import { DateTime } from 'luxon';
import { Combobox } from '@headlessui/react'

import Image from 'next/image';
import { TSet } from '@/types/set'

import black from '../imgs/black.gif'
import blue from '../imgs/blue.gif'
import red from '../imgs/red.gif'
import green from '../imgs/green.gif'
import white from '../imgs/white.gif'

// import Label from '../components/atom/Label';
const Label = dynamic(() => import('../components/atom/Label'), { ssr: false });

import { BaseLayout, Card } from '@components'

type TSetGroup = {
  block: string
  type: string
}

const byBlock = R.groupBy((set: TSet) => {
  return set.block || set.set_type
});

const getImage = (set: TSetGroup, rarity = 'c') => `https://gatherer.wizards.com/Handlers/Image.ashx?type=symbol&set=${set}&size=large&rarity=${rarity}`

const getFallbackImage = (set: TSet, rarity = 'c') => {
  if (set.icon_svg_uri.includes('star')) {
    return `https://gatherer.wizards.com/Handlers/Image.ashx?type=symbol&set=sld&size=large&rarity=${rarity}`
  }
  return set.icon_svg_uri
}

const labels = [
  { name: 'Instants' },
  { name: 'Enchanments' },
  { name: 'Sorcery' },
  { name: 'Lands' },
  { name: 'Standard' },
  { name: 'Legacy' },
  { name: 'Tokens' },
  { name: 'Modern' },
  { name: 'Vintage' },
  { name: 'Pioner' },
  { name: 'Common' },
  { name: 'Uncommon' },
  { name: 'Rare' },
  { name: 'Mythic Rare' },
]

// wizards proper code
const override = {
  UNF: 'UNFS'
}

const Group = ({ items, toggle }: { items: TSet[], toggle: boolean }) => {
  return (
    <>
      {items.map((item, index) => {
        return RARITY.map((r: string, rIndex) => {
          const finalCode = item.code.toUpperCase()
          // @ts-ignore
          const code = override[finalCode] || finalCode

          return <Label
            large={toggle}
            key={`${code}-${r}`}
            code={code}
            date={item.released_at}
            icon={getImage(code, r)}
            rarity={r}
            iconFallback={getFallbackImage(item, r)}
            name={item.name}
          />
        })
      })}
    </>
  )
}

enum EType {
  white = 'White',
  blue = 'Blue',
  black = 'Black',
  red = 'Red',
  green = 'Green',
}

const CardLabelType = ({ type }: { type?: EType }) => {
  switch (type) {
    case EType.black:
      return <Image className="max-w-full max-h-full" alt={type} src={black} />
    case EType.blue:
      return <Image className="max-w-full max-h-full" alt={type} src={blue} />
    case EType.white:
      return <Image className="max-w-full max-h-full" alt={type} src={white} />
    case EType.red:
      return <Image className="max-w-full max-h-full" alt={type} src={red} />
    case EType.green:
      return <Image className="max-w-full max-h-full" alt={type} src={green} />
    default:
      return null
  }
}

const CardLabels = ({ name, type }: { name?: string, type?: EType }) => {
  return (
    <div className={`text-slate-800 bg-slate-50 text-left p-[2px] w-[185px] item h-[30px] flex justify-between items-center overflow-hidden`}>
      <div className="w-[140px] ">
        <div className="text-[13px] leading-[13px] truncate">
          {type ? type : name}
        </div>
      </div>
      {type && (
        <div className="h-[24px] w-[24px] flex justify-center items-center flex-col shrink-0">
          <CardLabelType type={type} />
        </div>
      )}
    </div>
  )
}

const sortByRelease = (a: TSet, b: TSet) => {
  const ad = DateTime.fromFormat(a.released_at, 'y-MM-dd')
  const bd = DateTime.fromFormat(b.released_at, 'y-MM-dd')
  return bd.diff(ad).as('days')
}

const showLatest = (s: TSet) => {
  const d = DateTime.fromFormat(s.released_at, 'y-MM-dd')
  return d.diffNow('years').years >= -2
}

const setTypes = ['expansion', 'commander', 'promo', 'draft_innovation', 'masters', 'masterpiece', 'memorabilia', 'promos', 'funny', 'minigame', 'box', 'arsenal', 'core', 'spellbook', 'planechase', 'duel_deck', 'from_the_vault', 'archenemy', 'starter', 'premium_deck', 'vanguard']

const DEFAULT_HIDDEN_SET_TYPES = [
  'masterpiece', 'memorabilia', 'promos', 'funny', 'minigame', 'box', 'arsenal', 'spellbook', 'planechase', 'duel_deck', 'from_the_vault', 'archenemy', 'starter', 'premium_deck', 'vanguard', 'promo'
]

const Labels = () => {
  const [toggle, setToggle] = useState(false)
  const [showSettings, onToggleSettings] = useState(false)
  const [data, setData] = useState<TSet[]>([])
  const [addedSets, setAddedSets] = useState<TSet[]>([])
  const [filteredSets, setFilteredSets] = useState<string[]>([])
  const [hiddenSetTypes, setHiddenSetTypes] = useState(DEFAULT_HIDDEN_SET_TYPES)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch('/api/sets', { cache: 'force-cache' })
      .then((response) => response.json())
      .then(({data} : { data: TSet[]}) => {
        return setData(data.filter((s: TSet) => !s.digital && s.set_type !== 'token'))
      })
  }, [])

  const toPrint = useMemo(() => {
    const filteredBySetType = data
      .filter((s) => !hiddenSetTypes.includes(s.set_type) && !filteredSets.includes(s.id))
      .filter(showLatest)
    return [...filteredBySetType, ...addedSets].sort(sortByRelease)
  }, [data, addedSets, hiddenSetTypes, filteredSets])

  const grouped = useMemo(() => byBlock(toPrint), [toPrint])

  const onRemove = useCallback((set: TSet) => {

    setFilteredSets((s) => [...s, set.id])
  }, [])

  const onSelectSet = useCallback((set: TSet) => {
    setAddedSets((s) => [...s, set])
  }, [])

  const filteredQuerySets =
    query.length < 3
      ? []
      : query.length <= 4
        ? data.filter((set) => set.code.toLowerCase() === query.toLowerCase()).slice(0, 12)
        : data.filter((set) => set.name.toLowerCase().includes(query.toLowerCase())).slice(0, 12)

  return (
    <BaseLayout>
      <div className="flex text-center mx-auto font-beleren">
        <div className={`mx-auto text-center ${toggle ? 'w-[960px]' : 'w-[925px]'} height-[750px] py-5 print:py-0 print:w-full`}>
          <div className="flex justify-center gap-4 print:hidden">

            <Combobox onChange={onSelectSet} as="div" className="relative w-full text-left">
              <Combobox.Input placeholder="Search here to add a set by name or code" className="block w-full flex-1 border rounded border-slate-300 bg-slate-100 py-1.5 pl-2 text-slate-900 placeholder:text-slate-400 focus:ring-0 outline-slate-800 sm:text-sm sm:leading-6" onChange={(event) => setQuery(event.target.value)} />
              <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                {filteredQuerySets.map((set) => (
                  <Combobox.Option key={set.id} value={set} className="relative cursor-pointer select-none px-4 py-2 text-slate-700 hover:bg-slate-600 hover:text-slate-100">
                    {set.name} - {set.code}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </Combobox>

            <button onClick={() => setToggle(!toggle)} className="inline-flex items-center justify-center rounded-md bg-slate-600 py-2 px-3 text-sm font-semibold text-slate-100 shadow-sm hover:bg-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 print:hidden">
              {toggle ? 'Show Small' : 'Show Large'}
            </button>
            <button onClick={() => onToggleSettings(!showSettings)} className="inline-flex items-center justify-center rounded-md bg-slate-600 py-2 px-3 text-sm font-semibold text-slate-100 shadow-sm hover:bg-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 print:hidden">
              {toggle ? 'Hide Settings' : 'Show Settings'}
            </button>
          </div>
          {showSettings && (
            <div className="print:hidden p-3">
              {toPrint.map((s) => (
                <div key={s.code}>
                  <button
                    onClick={() => onRemove(s)}
                    className="text-sm py-1 px-2 hover:text-slate-700 hover:bg-slate-300 w-full hover:line-through"
                  >
                    <div className="flex text-left">
                      <div className="h-[20px] w-[30px] flex justify-center items-center flex-col shrink-0 mr-2">
                        <img className="max-w-full max-h-full" src={s.icon_svg_uri} />
                      </div>
                      <div>
                        {s.name} - {s.code}
                        <div>{DateTime.fromISO(s.released_at).toFormat('DD')}</div>
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* <div className={`grid ${toggle ? 'grid-cols-4' : 'grid-cols-5'} divide-x divide-y divide-dashed divide-slate-400`}>
            <CardLabels type={EType.black} />
            <CardLabels type={EType.blue} />
            <CardLabels type={EType.red} />
            <CardLabels type={EType.white} />
            <CardLabels type={EType.green} />

            {labels.map((k) => <CardLabels key={k.name} name={k.name} />)}
          </div> */}

          <div className={`grid ${toggle ? 'grid-cols-4' : 'grid-cols-3'} divide-x divide-y divide-dashed divide-slate-400 print:hidden`}>
            {Object.keys(grouped).map((key) => (
              <Fragment key={key}>
                <div className={`text-md border-b py-4 my-4 w-full ${toggle ? 'col-span-4' : 'col-span-5'} print:hidden`}>{key.toLocaleUpperCase()}</div>
                <Group key={key} items={grouped[key]} toggle={toggle} />
              </Fragment>
            ))}
          </div>

          <div className={`grid print-it ${toggle ? 'print-large grid-cols-4' : 'print-small grid-cols-4'} divide-x divide-y divide-dashed divide-slate-400 print:grid hidden`}>
            {Object.keys(grouped).map((key) => (
              <Fragment key={key}>
                <Group key={key} items={grouped[key]} toggle={toggle} />
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </BaseLayout>
  )
}

export default Labels
