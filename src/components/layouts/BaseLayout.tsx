import { FC, PropsWithChildren } from "react"
import Image from 'next/image'
import Head from 'next/head'
import Link from "next/link"

type TLayout = {
  name?: string
}

const Layout: FC<PropsWithChildren<TLayout>> = ({ children, name }) => {
  return (
    <>
      <Head>
        <title>MTG Tools</title>
        <meta name="description" content="MTG Tools" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <nav className="bg-indigo-600 print:hidden">

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">

              <Link href="/" className="flex-shrink-0 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                </svg>
              </Link>
              <div className="md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link href="/finder" className="bg-indigo-700 text-white rounded-md px-3 py-2 text-sm font-medium">Card Finder</Link>
                  <Link href="/labels" className="bg-indigo-700 text-white rounded-md px-3 py-2 text-sm font-medium">Label Maker</Link>
                </div>
              </div>

            </div>
          </div>
        </div>

      </nav>

      {name && (
        <header className="bg-white shadow print:hidden">
          <div className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">{name}</h1>
          </div>
        </header>
      )}
      <main className="flex flex-1 min-h-full">
        <div className="mx-auto max-w-xl md:max-w-2xl lg:max-w-7xl sm:px-6 lg:px-8">{children}</div>
      </main>
      <footer className="bg-slate-800 text-slate-50 text-xs">
        <div className="mx-auto max-w-xl md:max-w-2xl lg:max-w-7xl sm:px-6 lg:px-8 py-4">Developed by dac0d3z</div>
      </footer>
    </>
  )
}

export default Layout
