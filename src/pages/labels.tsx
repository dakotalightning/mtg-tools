import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useWorkshop } from '@/lib/workshop'
import { BTN, BTN_PRIMARY, cx, EYEBROW, H1, PAGE_HEAD, PANEL, SUB } from '@/lib/ui'

const COLORS = [
  { value: '#316a8c', label: 'Blue / deep azure' },
  { value: '#3e6f57', label: 'Green / forest' },
  { value: '#994d41', label: 'Red / terracotta' },
  { value: '#3b4147', label: 'Black / charcoal' },
  { value: '#856632', label: 'White / warm ivory' },
  { value: '#886326', label: 'Multicolor / brass' },
]

const TEMPLATES = ['Set divider', 'Color divider', 'Type divider']
const POSITIONS = ['Center', 'Left', 'Right']

const esc = (t: string) =>
  t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c] as string))

const LabelStudio = () => {
  const router = useRouter()
  const { addToQueue, toast } = useWorkshop()

  const [template, setTemplate] = useState(TEMPLATES[0])
  const [text, setText] = useState('Commander 2021')
  const [code, setCode] = useState('C21')
  const [position, setPosition] = useState(POSITIONS[0])
  const [color, setColor] = useState(COLORS[0].value)
  const [cutLines, setCutLines] = useState(true)

  // Prefill from "Make label" on the Card Finder.
  useEffect(() => {
    if (!router.isReady) return
    const { text: qText, code: qCode } = router.query
    if (typeof qText === 'string') setText(qText.slice(0, 34))
    if (typeof qCode === 'string') setCode(qCode.slice(0, 6))
  }, [router.isReady, router.query])

  const family = (COLORS.find((c) => c.value === color)?.label || '').split(' / ')[0]
  const hierarchy = `${family.toUpperCase()} / ARTIFACT / SET`
  const tabStyle =
    position === 'Left'
      ? { marginLeft: 0, marginRight: 'auto' }
      : position === 'Right'
        ? { marginLeft: 'auto', marginRight: 0 }
        : { marginLeft: 'auto', marginRight: 'auto' }

  const exportSvg = () => {
    const x = position === 'Left' ? 0 : position === 'Right' ? 55 : 27.5
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="69mm" height="104mm" viewBox="0 0 69 104">
<path d="M0 8H${x}V2Q${x} 0 ${x + 2} 0H${x + 12}Q${x + 14} 0 ${x + 14} 2V8H69V104H0Z" fill="#fffdf8" stroke="#7d827b" stroke-width=".25" ${cutLines ? 'stroke-dasharray="1 1"' : ''}/>
<rect x="${x}" y="1" width="14" height="7" fill="${color}"/>
<text x="${x + 7}" y="5.5" text-anchor="middle" font-family="Arial" font-size="2.6" fill="white">${esc(code)}</text>
<rect y="8" width="69" height="1.2" fill="${color}"/>
<text x="7" y="26" font-family="Arial" font-size="3" fill="#626b6e">${esc(template.toUpperCase())}</text>
<foreignObject x="7" y="33" width="55" height="30">
<div xmlns="http://www.w3.org/1999/xhtml" style="font:6px Georgia;color:#202a30;overflow-wrap:anywhere">${esc(text)}</div>
</foreignObject>
<path d="M7 68H62" stroke="#dedbd2" stroke-width=".3"/>
<text x="7" y="78" font-family="Arial" font-size="2.8" fill="#626b6e">${esc(hierarchy)}</text>
<text x="7" y="96" font-family="Arial" font-size="2" fill="#626b6e">CARD CLOUD / WORKSHOP</text>
</svg>`
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
    a.download = 'card-cloud-divider.svg'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    toast('Divider SVG exported — print at actual size')
  }

  const fieldLabel = 'block my-4 text-[13px] font-semibold'
  const fieldControl = 'block w-full mt-1.5 px-3 py-2.5 border border-[#c9c7be] rounded-[5px] bg-[#fffdf9] min-h-[44px] text-ink'

  return (
    <section>
      <div className={PAGE_HEAD}>
        <div>
          <div className={EYEBROW}>DESIGN · ARRANGE · PRINT</div>
          <h1 className={H1}>A little order for your collection.</h1>
          <p className={SUB}>Readable labels. Staggered tabs. A system that grows with your cards.</p>
        </div>
      </div>

      <div className="grid grid-cols-[300px_1fr] gap-6 max-[1100px]:grid-cols-[260px_1fr] max-[760px]:grid-cols-1">
        <div className={PANEL}>
          <div className={cx(EYEBROW, '!mb-4')}>DIVIDER SETTINGS</div>

          <label className={fieldLabel}>Template
            <select value={template} onChange={(e) => setTemplate(e.target.value)} className={fieldControl}>
              {TEMPLATES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>

          <label className={fieldLabel}>Label text
            <input value={text} maxLength={34} onChange={(e) => setText(e.target.value)} className={fieldControl} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className={cx(fieldLabel, '!my-0 mb-4')}>Set code
              <input value={code} maxLength={6} onChange={(e) => setCode(e.target.value)} className={fieldControl} />
            </label>
            <label className={cx(fieldLabel, '!my-0 mb-4')}>Tab position
              <select value={position} onChange={(e) => setPosition(e.target.value)} className={fieldControl}>
                {POSITIONS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
          </div>

          <label className={fieldLabel}>Color family
            <select value={color} onChange={(e) => setColor(e.target.value)} className={fieldControl}>
              {COLORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>

          <div className="flex justify-between items-center text-[13px] my-4">
            <label htmlFor="cut-lines">Show cut guides</label>
            <input type="checkbox" id="cut-lines" checked={cutLines} onChange={(e) => setCutLines(e.target.checked)} className="accent-forest w-5 h-5" />
          </div>

          <div className="border-t border-line pt-4 text-xs text-muted">
            Sleeved-card body: 69 × 96 mm<br />Set tab: 14 × 8 mm<br />Print at 100% / actual size
          </div>

          <button
            className={cx(BTN_PRIMARY, 'w-full mt-5')}
            onClick={() => addToQueue(`Divider: ${text || 'Untitled'}`)}
          >
            Add divider to print queue
          </button>
        </div>

        <div>
          <div className="bg-[#e5e2d9] border border-[#d4d0c6] rounded-lg overflow-hidden">
            <div className="flex justify-between items-center px-5 py-[14px] border-b border-[#d4d0c6] text-[13px] text-[#606761]">
              <span>LIVE PREVIEW</span>
              <span>Front face · enlarged view</span>
            </div>
            <div className="px-9 py-10 flex justify-center gap-6 items-center min-h-[458px] [background-image:radial-gradient(#bcbcb2_0.6px,transparent_.6px)] [background-size:12px_12px] max-[1100px]:px-4 max-[1100px]:py-9 max-[760px]:min-h-[400px]">
              <div className="w-[230px] shrink-0 relative [filter:drop-shadow(0_9px_7px_#272f2920)]">
                <div className="h-[27px] w-[47px] text-white p-1 text-center rounded-t-[5px] text-xs tracking-[1px]" style={{ background: color, ...tabStyle }}>{code || 'SET'}</div>
                <div className="bg-[#fdfbf5] h-[320px] relative border border-[#b8b7aa] border-t-4 px-5 py-[26px] text-left rounded-[3px]" style={{ borderTopColor: color, borderStyle: cutLines ? 'dashed' : 'solid' }}>
                  <div className="text-[38px] mb-3" style={{ color }}>◇</div>
                  <small className="text-[11px] tracking-[2px] text-[#626d70]">{template.toUpperCase()}</small>
                  <h2 className="font-serif text-[23px] leading-[1.2] [overflow-wrap:anywhere] mb-2.5 mt-3">{text || 'Your label'}</h2>
                  <div className="h-px bg-[#d6d4c7] my-4" />
                  <div className="text-xs text-[#55646a]">{hierarchy}</div>
                  <div className="absolute bottom-[14px] left-5 [font:9px_monospace] text-[#626b6e]">
                    CARD CLOUD · WORKSHOP
                  </div>
                </div>
                <div className="text-center font-mono text-xs text-[#606960] mt-4">← 69 mm body →</div>
              </div>
              <div>
                <div className="px-[15px] py-5 bg-paper w-[140px] h-[190px] border border-[#cfc9ba] shadow-[0_5px_10px_#0000000b] grid grid-cols-2 gap-[9px] rotate-[4deg] max-[1100px]:hidden" aria-label="Illustration of a printable divider sheet">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <i key={i} className="border border-dashed border-[#a3b0b0] rounded-[2px] [background:linear-gradient(#366b89_0_12%,#e8ebdf_12%)]" />
                  ))}
                </div>
                <p className="text-center text-xs text-muted max-[1100px]:hidden">Build a print sheet</p>
              </div>
            </div>
            <div className="text-xs text-[#606761] text-center p-[14px] border-t border-[#d4d0c6]">Color → Type → Set · Tab position makes the hierarchy visible.</div>
          </div>

          <div className="flex gap-4 mt-[18px] items-center justify-between text-[13px] max-[760px]:flex-col max-[760px]:items-start">
            <span className="text-muted">Editable vector export · physical dimensions</span>
            <button className={BTN} onClick={exportSvg}>Download divider SVG ↓</button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LabelStudio
