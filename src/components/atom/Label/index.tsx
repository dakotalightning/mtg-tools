import { FC, useCallback, useLayoutEffect, useMemo, useState } from "react"
import { DateTime } from 'luxon'
import Image from 'next/image'

type TItem = {
  name: string
  code: string
  date: string
  icon: string
  iconFallback: string
  large?: boolean
}

const Label: FC<TItem> = ({ name, code, date, icon, iconFallback, large = false }) => {
  const [symbol, setSymbol] = useState(icon)

  const formatedDate = useMemo(() => DateTime.fromISO(date).toFormat('DD'), [date])

  const onImgError = useCallback(() => {
    setSymbol(iconFallback)
  }, [iconFallback])

  if (large) {
    return (
      <div className={`text-slate-800 text-left p-3 item h-20 flex justify-between items-center overflow-hidden`}>
        <div className="w-[197px] ">
          <div className="text-sm">
            {name}
          </div>
          <div className="text-xs text-slate-500">
            <>{code} - {date}</>
          </div>
        </div>
        <div className="h-[50px] w-[60px] flex justify-center items-center flex-col">
          <img className="max-w-full max-h-full" src={symbol} onError={onImgError} />
        </div>
      </div>
    )
  }

  return (
    <div className={`text-slate-800 bg-slate-50 text-left p-[2px] w-[185px] item h-[30px] flex justify-between items-center overflow-hidden`}>
      <div className="w-[140px] ">
        <div className="text-[13px] leading-[13px] truncate">
          {name}
        </div>
        <div className="text-[11px] leading-[11px] text-slate-500">
          <>{code} - {formatedDate}</>
        </div>
      </div>
      <div className="h-[28px] w-[38px] flex justify-center items-center flex-col shrink-0">
        <img className="max-w-full max-h-full" src={symbol} onError={onImgError} />
      </div>
    </div>
  )
}


export default Label
