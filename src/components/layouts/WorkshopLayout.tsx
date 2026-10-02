import { FC, PropsWithChildren, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Icon, { IconName, IconSprite } from '../Icon'
import { useWorkshop } from '@/lib/workshop'
import { BTN, BTN_PRIMARY, cx } from '@/lib/ui'

type NavItem = { href: string; label: string; icon: IconName }

const NAV: NavItem[] = [
  { href: '/', label: 'Card Finder', icon: 'search' },
  { href: '/shopping', label: 'Shopping lists', icon: 'list' },
  { href: '/labels', label: 'Label Studio', icon: 'label' },
  { href: '/tokens', label: 'Token Library', icon: 'token' },
  { href: '/counters', label: 'Counter Kit', icon: 'counter' },
  { href: '/design', label: 'Design system', icon: 'palette' },
]

const WorkshopLayout: FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter()
  const { queue, clearQueue, toastMessage } = useWorkshop()
  const dialogRef = useRef<HTMLDialogElement>(null)

  const current = NAV.find((n) => n.href === router.pathname) ?? NAV[0]

  const openQueue = () => dialogRef.current?.showModal()
  const closeQueue = () => dialogRef.current?.close()

  // Keyboard: "/" focuses card search from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '')
      if (e.key === '/' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) {
        e.preventDefault()
        if (router.pathname !== '/') router.push('/')
        else document.getElementById('card-search')?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [router])

  return (
    <>
      <Head>
        <title>Card Cloud — The Workshop</title>
        <meta name="description" content="Card Cloud — a print-first workshop for organizing your Magic collection." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <IconSprite />

      <div className="grid grid-cols-[226px_1fr] min-h-screen max-[1100px]:grid-cols-[190px_1fr] max-[760px]:block">
        <aside className="bg-night text-[#e6e9e7] px-[18px] py-[30px] flex flex-col border-r border-[#364147] print:hidden max-[1100px]:px-3 max-[1100px]:py-[26px] max-[760px]:block max-[760px]:p-4">
          <div className="flex items-center gap-3 px-2.5 mb-9 text-[21px] font-bold tracking-[-.7px] max-[1100px]:text-lg max-[1100px]:px-0 max-[760px]:mb-[18px]">
            <Icon name="cloud" className="text-gold w-8 h-8" />
            <div>card cloud<small className="block text-[11px] tracking-[2px] text-[#b9c3c5] font-medium">THE WORKSHOP</small></div>
          </div>

          <div className="text-[11px] tracking-[2px] text-[#aebbbf] px-[14px] mb-2.5 max-[760px]:hidden">YOUR WORKBENCH</div>

          <nav aria-label="Main navigation" className="grid gap-1.5 max-[760px]:grid-cols-2 max-[760px]:gap-1">
            {NAV.map((n) => {
              const active = n.href === current.href
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cx(
                    'flex items-center gap-3 border rounded-md min-h-[44px] text-left text-[15px] font-semibold p-3 no-underline cursor-pointer max-[760px]:text-[13px] max-[760px]:shrink-0',
                    active
                      ? 'bg-[#2e3a40] text-[#f1cf98] border-[#56605d]'
                      : 'border-transparent text-[#bec8cb] hover:bg-[#26353d] hover:text-white'
                  )}
                >
                  <Icon name={n.icon} className="max-[760px]:w-4 max-[760px]:h-4" />{n.label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto px-3 pt-[30px] max-[760px]:hidden">
            <div className="text-[13px] text-[#b7c3c5] border-t border-[#3d4a50] pt-5">Less time sorting.<br />More time playing.</div>
            <div className="flex gap-2.5 items-center mt-[22px] text-sm">
              <div className="w-[34px] h-[34px] grid place-items-center bg-[#d5b37c] text-[#263238] rounded-full font-bold text-xs">DL</div>
              <div>Dakota&apos;s workshop<small className="block text-[#aebbbf] text-xs">Personal collection</small></div>
            </div>
          </div>
        </aside>

        <div>
          <header className="h-[76px] border-b border-line flex items-center justify-between px-9 bg-[#faf8f2] gap-4 print:hidden max-[1100px]:px-6 max-[760px]:h-[60px] max-[760px]:px-5">
            <div className="text-sm text-muted max-[760px]:text-xs">Workshop <span className="mx-2.5">/</span> <b className="text-ink font-semibold">{current.label}</b></div>
            <div className="flex gap-4 items-center">
              <span className="text-[11px] tracking-[1.5px] text-[#766341] font-bold max-[760px]:hidden">LESS TIME SORTING</span>
              <button onClick={openQueue} className={cx(BTN, 'text-sm flex gap-2.5 items-center max-[760px]:text-xs max-[760px]:px-2.5 max-[760px]:py-[7px]')}>
                <Icon name="print" />Print queue <span className="font-mono text-xs bg-[#e9e7e0] px-1.5 py-[3px] rounded-[3px]">{queue.length}</span>
              </button>
            </div>
          </header>

          <main className="max-w-[1360px] mx-auto px-9 pt-[30px] pb-6 max-[1100px]:p-6 max-[760px]:px-5 max-[760px]:py-6 min-[1600px]:pt-10">{children}</main>
        </div>
      </div>

      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#203138] text-white px-[22px] py-3 rounded-lg shadow-[0_4px_20px_#0003] text-sm z-10 max-[760px]:w-[calc(100%-40px)] max-[760px]:text-center"
        role="status"
        hidden={!toastMessage}
      >
        {toastMessage}
      </div>

      <dialog ref={dialogRef} className="max-w-[520px] w-[calc(100%-32px)] p-7 border border-line rounded-lg bg-paper text-ink">
        <div className="text-[11px] font-bold tracking-[2px] text-[#806033] uppercase mb-[5px]">YOUR PRINT WORKSPACE</div>
        <h2 className="text-xl leading-tight mb-2">Print queue</h2>
        <p className="text-[15px] text-muted">Items queued during this session.</p>
        <ul className="pl-5 list-disc">
          {queue.length === 0 ? (
            <li className="py-2">Nothing queued yet. Add a divider or token to start.</li>
          ) : (
            queue.map((t, i) => <li key={`${t}-${i}`} className="py-2">{t}</li>)
          )}
        </ul>
        <p className="text-[13px] text-muted">
          Sheet arrangement and PDF output are concept features. You can export a single divider SVG from Label Studio.
        </p>
        <div className="flex gap-3 items-center justify-end mt-6">
          <button onClick={clearQueue} className={BTN}>Clear queue</button>
          <button onClick={closeQueue} className={BTN_PRIMARY}>Keep working</button>
        </div>
      </dialog>
    </>
  )
}

export default WorkshopLayout
