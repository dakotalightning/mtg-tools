import { FC, PropsWithChildren, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Icon, { IconName, IconSprite } from '../Icon'
import { useWorkshop } from '@/lib/workshop'

type NavItem = { href: string; label: string; icon: IconName }

const NAV: NavItem[] = [
  { href: '/', label: 'Card Finder', icon: 'search' },
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

      <div className="shell">
        <aside className="sidebar">
          <div className="brand">
            <Icon name="cloud" />
            <div>card cloud<small>THE WORKSHOP</small></div>
          </div>
          <div className="nav-label">YOUR WORKBENCH</div>
          <nav aria-label="Main navigation">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={n.href === current.href ? 'active' : undefined}
              >
                <Icon name={n.icon} />{n.label}
              </Link>
            ))}
          </nav>
          <div className="side-foot">
            <div className="side-note">Less time sorting.<br />More time playing.</div>
            <div className="user">
              <div className="avatar">DL</div>
              <div>Dakota&apos;s workshop<small>Personal collection</small></div>
            </div>
          </div>
        </aside>

        <div>
          <header className="topbar">
            <div className="crumb">Workshop <span style={{ margin: '0 10px' }}>/</span> <b>{current.label}</b></div>
            <div className="top-actions">
              <span className="concept">LESS TIME SORTING</span>
              <button className="queue-button" onClick={openQueue}>
                <Icon name="print" />Print queue <span className="code">{queue.length}</span>
              </button>
            </div>
          </header>

          <main>{children}</main>
        </div>
      </div>

      <div className="toast" role="status" hidden={!toastMessage}>{toastMessage}</div>

      <dialog id="queue-dialog" ref={dialogRef}>
        <div className="eyebrow">YOUR PRINT WORKSPACE</div>
        <h2>Print queue</h2>
        <p className="sub">Items queued during this session.</p>
        <ul>
          {queue.length === 0 ? (
            <li>Nothing queued yet. Add a divider or token to start.</li>
          ) : (
            queue.map((t, i) => <li key={`${t}-${i}`}>{t}</li>)
          )}
        </ul>
        <p className="sub" style={{ fontSize: 13 }}>
          Sheet arrangement and PDF output are concept features. You can export a single divider SVG from Label Studio.
        </p>
        <div className="row">
          <button onClick={clearQueue}>Clear queue</button>
          <button className="primary" onClick={closeQueue}>Keep working</button>
        </div>
      </dialog>
    </>
  )
}

export default WorkshopLayout
