import { useCallback, useMemo, useState, Fragment, FC } from 'react'
import * as R from 'ramda'
import mtgSets from '../data/sets'
import { RARITY } from '../config/constants';
import dynamic from "next/dynamic";
import { DateTime } from 'luxon'

import Image from 'next/image';

import { BaseLayout, Card } from '@components'

type TSet = {
  block: string
  type: string
}

type MtgSet = {
  object:          string;
  id:              string;
  code:            string;
  name:            string;
  uri:             string;
  scryfall_uri:    string;
  search_uri:      string;
  released_at:     string;
  set_type:        string;
  card_count:      number;
  parent_set_code?: string;
  digital:         boolean;
  nonfoil_only:    boolean;
  foil_only:       boolean;
  icon_svg_uri:    string;
  block?:    string;
}

type TSetLabel = {
  name: string,
  icon: string,
  code: string,
  date: string,
}

const formats = {
  standard: ['one', 'bro', 'dmu', 'snc', 'neo', 'mid', 'vow'],
  pioneer: ["one","bro","dmu","snc","neo","vow","mid","afr","khm","znr","thb","eld","m20","war","rna","grn","m19","dom","rix","xln","hou","akh","aer","kld","emn","soi","ogw","bfz","ori","dtk","frf","ktk","m15","jou","bng","ths","m14","dgm","gtc","rtr"]
}

const formatData = {
  standard: mtgSets.data.filter((i) => formats.standard.includes(i.code))
    .sort((a, b) => b.released_at.localeCompare(a.released_at)),
  pioneer: mtgSets.data.filter((i) => formats.pioneer.includes(i.code))
    .sort((a, b) => b.released_at.localeCompare(a.released_at))
}

const SetLabel: FC<TSetLabel> = ({ name, icon, code, date }) => {

  const formatedDate = useMemo(() => {
    if (typeof window !== 'undefined') {
      return DateTime.fromISO(date).toFormat('DD')
    }
  }, [date])

  return (
    <div className={`text-slate-800 bg-slate-50 text-left p-[3px] w-full item h-[20px] flex justify-between items-center overflow-hidden`}>
      <div className="w-[197px]">
        <div className="text-[13px] leading-[13px] truncate">
          {name}
        </div>
        {/* <div className="text-[11px] leading-[11px] text-slate-500">
          <>{code} - {formatedDate}</>
        </div> */}
      </div>
      <div className="h-[18px] w-[28px] flex justify-center items-center flex-col shrink-0">
        <img className="max-w-full max-h-full" src={icon} />
      </div>
    </div>
  )
}

const Labels = () => {

  return (
    <BaseLayout>
      <div className="flex text-center mx-auto font-beleren">
        <div className={`mx-auto text-center w-[960px] height-[750px] py-5`}>

          <div className="grid grid-cols-4">
            {Object.keys(formatData).map((s) => (
              <div key={s}>
                <div className="uppercase my-3">{s}</div>
                <div className="grid grid-cols-1 divide-y divide-dashed divide-slate-400">
                  {formatData[s as keyof typeof formatData].map((item) => {
                    const finalCode = item.code.toUpperCase()

                    return <SetLabel
                      key={finalCode}
                      code={finalCode}
                      date={item.released_at}
                      icon={item.icon_svg_uri}
                      name={item.name}
                    />
                  })}
                </div>
              </div>
            ))}
          </div>


        </div>
      </div>
    </BaseLayout>
  )
}

export default Labels
