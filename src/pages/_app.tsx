import SetProvider from '@/lib/sets'
import { ShoppingListProvider } from '@/lib/shopping/ShoppingListProvider'
import WorkshopProvider from '@/lib/workshop'
import '@/styles/globals.css'
import { WorkshopLayout } from '@components'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SetProvider>
      <WorkshopProvider>
        <ShoppingListProvider>
          <WorkshopLayout>
            <Component {...pageProps} />
          </WorkshopLayout>
        </ShoppingListProvider>
      </WorkshopProvider>
    </SetProvider>
  )
}
