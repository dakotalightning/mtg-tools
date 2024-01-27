import { useCallback, useMemo, useState, Fragment, useEffect, ReactNode } from 'react'
import reactLogo from './assets/react.svg'
import useAsync from '../hooks/useAsync';
import * as R from 'ramda'
import { RARITY } from '../config/constants';
import dynamic from "next/dynamic";
import { DateTime } from 'luxon';
import { Switch } from '@headlessui/react'
import { TSet } from '@/types/set'

import Image from 'next/image';

import black from '../imgs/black.gif'
import blue from '../imgs/blue.gif'
import red from '../imgs/red.gif'
import green from '../imgs/green.gif'
import white from '../imgs/white.gif'

// import Label from '../components/atom/Label';
const Label = dynamic(() => import('../components/atom/Label'), { ssr: false });

import { BaseLayout, Card } from '@components'


const Arrow = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" height="1em" viewBox="0 0 512 512">
      <path className="fill-slate-600" d="M360.5 441.4c-7 6.6-17.2 8.4-26 4.6s-14.5-12.5-14.5-22l0-272c0-9.6 5.7-18.2 14.5-22s19-2 26 4.6l144 136c4.8 4.5 7.5 10.8 7.5 17.4s-2.7 12.9-7.5 17.4l-144 136z"/>
      <path className="fill-slate-400" d="M320 240v96H112C50.1 336 0 285.9 0 224V64C0 46.3 14.3 32 32 32H64c17.7 0 32 14.3 32 32V224c0 8.8 7.2 16 16 16H320z"/>
    </svg>
  )
}

const byBlock = R.groupBy((set: MtgSet) => {
  return set.block || set.set_type
});

const getImage = (set: TSet, rarity = 'c') => `https://gatherer.wizards.com/Handlers/Image.ashx?type=symbol&set=${set}&size=large&rarity=${rarity}`

const Set = ({ set, sets, subSets = [] }: { set: TSet, sets: TSet[], subSets?: TSet[] }) => {
  return (
    <div className="">
      <div className="flex gap-2 items-center px-3 py-2 border border-slate-300 -mt-[1px]">
        <div className="h-[10px] w-[20px] lg:h-[20px] lg:w-[30px] flex justify-center items-center flex-col shrink-0 mr-2">
          <img alt={set.name} src={set.icon_svg_uri} className="max-w-full max-h-full" />
        </div>
        {set.name}
        <div className="font-mono text-xs text-slate-500">{set.code}</div>
        <div>{set.released_at}</div>
      </div>
      {subSets.length > 0 && (
        <div className="flex">
          <div className="m-3">
            <Arrow />
          </div>
          <div className="w-full">
            {subSets.map((s) => (
              <Set sets={sets} key={s.id} set={s} subSets={sets.filter((v) => v.parent_set_code === s.code)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const Labels = () => {
  const [toggle, setToggle] = useState(false)
  const [showSettings, onToggleSettings] = useState(false)
  const [sets, setSets] = useState<TSet[]>([])
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    fetch('/api/sets', { cache: 'force-cache' })
        .then((response) => response.json())
        .then(({data}) => setSets(data));
  }, [])

  const filteredSets = useMemo(() => {
    return sets
      .filter((s) => !s.parent_set_code)
      .slice(0, 50)
  }, [sets])

  // use parent_set_code to create the tree of sets

  return (
    <BaseLayout>
      <div className="font-beleren">
        <div className="flex my-4 py-4">
          <Switch
            checked={enabled}
            onChange={setEnabled}
            className={`${enabled ? 'bg-sky' : 'bg-slate-400'}
            relative inline-flex h-[24px] w-[48px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white/75 shadow-inner`}
            >
            <span className="sr-only">Enable notifications</span>
            <span
              aria-hidden="true"
              className={`${enabled ? 'translate-x-6' : 'translate-x-0'}
                pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
            />
          </Switch>
        </div>
        <div className="w-full">
          {filteredSets.map((s) => (
            <Set sets={sets} key={s.id} set={s} subSets={sets.filter((v) => v.parent_set_code === s.code)} />
          ))}
        </div>
      </div>
    </BaseLayout>
  )
}

export default Labels
