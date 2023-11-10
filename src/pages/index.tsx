import Head from 'next/head'
import { BaseLayout } from '@components'
import Link from 'next/link'

export default function Home() {
  return (
    <BaseLayout>

      <div className="font-beleren text-4xl mb-3 mx-4 mt-4">MTG Tools</div>

      <div className="grid md:grid-cols-2 grid-cols-1 gap-4 mx-4">
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
