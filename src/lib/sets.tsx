import { createContext, useEffect, useState, ReactNode, useContext } from 'react'
import Fuse from 'fuse.js'

import setsData from '@data/sets.json'

type TSet = {
  id: string
  code: string
  mtgo_code: string
  arena_code: string
  tcgplayer_id: number
  name: string
  uri: string
  scryfall_uri: string
  search_uri: string
  released_at: string
  set_type: string
  card_count: number
  printed_size: number
  digital: boolean
  nonfoil_only: boolean
  foil_only: boolean
  block_code: string
  block: string
  icon_svg_uri: string
}

type TSetIcons = Record<string, TSet>

type TSetContext = {
  sets: TSet[],
  icons: TSetIcons,
  // autocomplete: (query: string) => TSet[],
  // search: (query: string) => TSet[],
}

export const SetContext = createContext<TSetContext>({
  sets: [],
  icons: {},
  // autocomplete: (query: string) => [],
  // search: (query: string) => [],
})

const SetProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<TSetIcons>({})

  useEffect(() => {
    const dataObject = setsData.data.reduce((p, c, i, a) => ({
      ...p,
      [c.code]: c.icon_svg_uri
    }), {})
    console.log('set data', dataObject)
    setData(dataObject)
  }, [])

  return (
    <SetContext.Provider value={{
      sets: setsData.data as TSet[],
      icons: data,
    }}>
      {children}
    </SetContext.Provider>
  )

}

export default SetProvider

export const useSetData = (): TSetContext => useContext(SetContext)
