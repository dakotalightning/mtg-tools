import { FC, useCallback, useLayoutEffect, useMemo, useState } from "react"
import { DateTime } from 'luxon'

type TItem = {
  name: string
  code: string
  date: string
  icon: string
  iconFallback: string
  large?: boolean
  rarity: string
}

const Label: FC<TItem> = ({ name, code, date, icon, iconFallback, large = false, rarity }) => {
  const [symbol, setSymbol] = useState(icon)
  const [medium, setMedium] = useState(false)

  const formatedDate = useMemo(() => DateTime.fromISO(date).toFormat('DD'), [date])

  const onImgError = useCallback(async () => {
    const img = new Image
    img.onload = () => {
      setSymbol(`/api/setImage?set=${code}&rarity=${rarity}`)
    }
    img.onerror = () => {
      setSymbol(iconFallback)
    }
    img.src = `/api/setImage?set=${code}&rarity=${rarity}`
  }, [iconFallback, code, rarity])

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
        <div className="h-[50px] w-[60px] flex justify-center items-center flex-col shrink-0">
          <img className="max-w-full max-h-full" src={symbol} onError={onImgError} />
        </div>
      </div>
    )
  }

  return (
    <div className={`text-slate-800 bg-slate-50 text-left p-[2px] w-[185px] print:w-[175px] item h-[30px] flex justify-between items-center overflow-hidden`}>
      <div className="shrink truncate mr-1">
        <div className="text-[13px] leading-[13px] truncate">
          {name}
        </div>
        <div className="text-[11px] leading-[11px] text-slate-500">
          <>{code} - {formatedDate}</>
        </div>
      </div>
      <div className="h-[24px] w-[34px] flex justify-center items-center flex-col shrink-0">
        <img className="max-w-full max-h-full" src={symbol} onError={onImgError} />
      </div>
    </div>
  )
}


export default Label
