import CurrencyProvider from '@/lib/currency'
import SetProvider from '@/lib/sets'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SetProvider>
      <CurrencyProvider>
        <Component {...pageProps} />
      </CurrencyProvider>
    </SetProvider>
  )
}
