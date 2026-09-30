import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import WorkshopProvider from '@/lib/workshop'
import { WorkshopLayout } from '@components'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WorkshopProvider>
      <WorkshopLayout>
        <Component {...pageProps} />
      </WorkshopLayout>
    </WorkshopProvider>
  )
}
