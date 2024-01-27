import Head from 'next/head'
import { BaseLayout } from '@components'
import Link from 'next/link'

export default function Home() {
  return (
    <BaseLayout>

      <div className="font-beleren text-4xl mb-3 mx-4 sm:mx-0 mt-6">MTG Tools</div>

      <div className="mx-4 mb-4 sm:mx-0">
        <p>Welcome to MTG Tools. Thank you for visiting our website, which provides a range of useful tools for Magic the Gathering enthusiasts. We are continuously working on improving and expanding our collection of tools to better serve our users. We appreciate your patience and support as we strive to make this website the ultimate resource for all your Magic the Gathering needs.</p>
      </div>

      <div className="bg-slate-700 w-20 h-20"></div>
      <div className="bg-sky w-20 h-20"></div>
      <div className="bg-peach w-20 h-20"></div>
      <div className="bg-yellow w-20 h-20"></div>


      <div className="grid md:grid-cols-2 grid-cols-1 gap-4 mx-4 sm:mx-0">
        <Link href="/finder"
          className="hover:bg-indigo-700 bg-slate-300 text-center text-indigo-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium"
        >
          <span className="m-5 block">Card Finder</span>
        </Link>

        <Link href="/labels"
          className="hover:bg-indigo-700 bg-slate-300 text-center text-indigo-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium"
        >
          <span className="m-5 block">Label Maker</span>
        </Link>
      </div>

    </BaseLayout>
  )
}
