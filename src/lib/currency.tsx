import { createContext, useEffect, useState, ReactNode, useContext } from 'react'

enum TCurrencySymbols {
  'CAD' = 'CAD',
  'USD' = 'USD'
}

export interface Currency {
  meta: Meta
  data: Data
}

export interface Meta {
  last_updated_at: string
}

export type Data = {
  [t in TCurrencySymbols]: CurrencySymbol
}

export interface CurrencySymbol {
  code: string
  value: number
}

type TCurrencyContext = {
  currency: Currency | null,
}

export const CurrencyContext = createContext<TCurrencyContext>({
  currency: null,
  // autocomplete: (query: string) => [],
  // search: (query: string) => [],
})

const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<Currency | null>(null)

  useEffect(() => {
    fetch('/api/currency', { cache: 'force-cache' })
      .then((resp) => resp.json())
      .then((data) => setData(data as Currency))
  }, [])

  return (
    <CurrencyContext.Provider value={{
      currency: data as Currency,
    }}>
      {children}
    </CurrencyContext.Provider>
  )

}

export default CurrencyProvider

export const useCurrency = (): TCurrencyContext => useContext(CurrencyContext)
