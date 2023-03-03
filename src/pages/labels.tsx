import { useCallback, useMemo, useState, Fragment } from 'react'
import reactLogo from './assets/react.svg'
import useAsync from '../hooks/useAsync';
import * as R from 'ramda'
import mtgSets from '../data/sets'
import { RARITY } from '../config/constants';
import dynamic from "next/dynamic";

// import Label from '../components/atom/Label';
const Label = dynamic(() => import('../components/atom/Label'), { ssr: false });

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

const byBlock = R.groupBy((set: MtgSet) => {
  return set.block || set.set_type
});

const getImage = (set: TSet, rarity = 'c') => `https://gatherer.wizards.com/Handlers/Image.ashx?type=symbol&set=${set}&size=large&rarity=${rarity}`

const have = ["onc","brc","dmc","ncc","ori","m15","m14","m13","clb","one","bro","dmu","snc","neo","vow","mid","afr","stx","khm","thb","hou","akh","aer","kld","emn","soi","bfz","dtk","frf","ktk","jou","bng","ths","dgm","gtc","rtr","lrw","unf","brr","bot","sta",'dmr', '2x2', '2xm', 'uma', 'a25', 'ima', 'mm3', 'ema', 'mm2']
// const have = ["one", "bro", 'dmu', 'snc', 'neo', 'afr', 'stx', 'dmr', 'unf', 'bot', 'sta', 'bbr', 'vow', 'mid']

const labels = [
  { name: 'Instants' },
  { name: 'Enchanments' },
  { name: 'Sorcery' },
  { name: 'Lands' },
  { name: 'Lands' },
]

// wizards proper code
const override = {
  UNF: 'UNFS'
}

const Group = ({ items, toggle }: { items: MtgSet[], toggle: boolean }) => {
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
            iconFallback={item.icon_svg_uri}
            name={item.name}
          />
        })
      })}
    </>
  )
}

const Labels = () => {
  const [toggle, setToggle] = useState(false)
  const [showSettings, onToggleSettings] = useState(false)
  const [toPrint, setToPrint] = useState(have)
  // const { execute, status, value, error } = useAsync(() => fetch('https://api.scryfall.com/sets'), false);

  let setsToPrint = mtgSets.data.filter((i) => toPrint.includes(i.code))
      .sort((a, b) => a.released_at - b.released_at)
  let grouped = byBlock(setsToPrint)

  const onRemove = useCallback((code: string) => {
    setToPrint((items) => items.filter((i) => i !== code))
  }, [setToPrint])

  return (
    <BaseLayout>
      <div className="flex text-center mx-auto">
        {showSettings && (
          <div className="print:hidden p-3">
            {setsToPrint.map((s) => (
              <div key={s.code}>
                <button onClick={() => onRemove(s.code)} className="text-sm hover:text-slate-700 hover:bg-slate-200 w-full">
                  <div className="flex">
                    <div className="h-[20px] w-[30px] flex justify-center items-center flex-col shrink-0 mr-2">
                      <img className="max-w-full max-h-full" src={s.icon_svg_uri} />
                    </div>
                    {s.name} - {s.released_at}
                  </div>
                </button>
              </div>
            ))}
            <pre className="w-[500px] break-all whitespace-pre-line bg-slate-800 text-slate-400 rounded-lg p-4"><code>{JSON.stringify(toPrint)}</code></pre>
          </div>
        )}
        <div className={`mx-auto text-center ${toggle ? 'w-[960px]' : 'w-[925px]'} height-[750px] py-5`}>
          <div className="flex justify-center gap-4">
            <button onClick={() => setToggle(!toggle)} className="inline-flex justify-center rounded-md bg-slate-600 py-2 px-3 text-sm font-semibold text-slate-100 shadow-sm hover:bg-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 print:hidden">
              {toggle ? 'Show Small' : 'Show Large'}
            </button>
            <button onClick={() => onToggleSettings(!showSettings)} className="inline-flex justify-center rounded-md bg-slate-600 py-2 px-3 text-sm font-semibold text-slate-100 shadow-sm hover:bg-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 print:hidden">
              {toggle ? 'Hide Settings' : 'Show Settings'}
            </button>
          </div>

          <div className={`grid ${toggle ? 'grid-cols-4' : 'grid-cols-5'} divide-x divide-y divide-dashed divide-slate-400 print:hidden`}>
            {Object.keys(grouped).map((key) => (
              <Fragment key={key}>
                <div className={`text-md border-b py-4 my-4 w-full ${toggle ? 'col-span-4' : 'col-span-5'} print:hidden`}>{key}</div>
                <Group key={key} items={grouped[key]} toggle={toggle} />
              </Fragment>
            ))}
          </div>

          <div className={`grid print-it ${toggle ? 'print-large grid-cols-4' : 'print-small grid-cols-5'} divide-x divide-y divide-dashed divide-slate-400 print:grid hidden`}>
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
