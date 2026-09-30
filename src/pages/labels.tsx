import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useWorkshop } from '@/lib/workshop'

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

  return (
    <section>
      <div className="page-head">
        <div>
          <div className="eyebrow">DESIGN · ARRANGE · PRINT</div>
          <h1>A little order for your collection.</h1>
          <p className="sub">Readable labels. Staggered tabs. A system that grows with your cards.</p>
        </div>
      </div>

      <div className="editor-layout">
        <div className="panel">
          <div className="eyebrow">DIVIDER SETTINGS</div>

          <label className="field">Template
            <select value={template} onChange={(e) => setTemplate(e.target.value)}>
              {TEMPLATES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>

          <label className="field">Label text
            <input value={text} maxLength={34} onChange={(e) => setText(e.target.value)} />
          </label>

          <div className="field-grid">
            <label className="field">Set code
              <input value={code} maxLength={6} onChange={(e) => setCode(e.target.value)} />
            </label>
            <label className="field">Tab position
              <select value={position} onChange={(e) => setPosition(e.target.value)}>
                {POSITIONS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
          </div>

          <label className="field">Color family
            <select value={color} onChange={(e) => setColor(e.target.value)}>
              {COLORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>

          <div className="switchline">
            <label htmlFor="cut-lines">Show cut guides</label>
            <input type="checkbox" id="cut-lines" checked={cutLines} onChange={(e) => setCutLines(e.target.checked)} />
          </div>

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16, fontSize: 12, color: 'var(--muted)' }}>
            Sleeved-card body: 69 × 96 mm<br />Set tab: 14 × 8 mm<br />Print at 100% / actual size
          </div>

          <button
            className="primary"
            style={{ width: '100%', marginTop: 20 }}
            onClick={() => addToQueue(`Divider: ${text || 'Untitled'}`)}
          >
            Add divider to print queue
          </button>
        </div>

        <div>
          <div className="stage">
            <div className="stagebar">
              <span>LIVE PREVIEW</span>
              <span>Front face · enlarged view</span>
            </div>
            <div className="stageinner">
              <div className="divider">
                <div className="divider-tab" style={{ background: color, ...tabStyle }}>{code || 'SET'}</div>
                <div className="divider-body" style={{ borderTopColor: color, borderStyle: cutLines ? 'dashed' : 'solid' }}>
                  <div className="big-symbol" style={{ color }}>◇</div>
                  <small>{template.toUpperCase()}</small>
                  <h2 style={{ marginTop: 12 }}>{text || 'Your label'}</h2>
                  <div className="rule" />
                  <div className="hierarchy">{hierarchy}</div>
                  <div style={{ position: 'absolute', bottom: 14, left: 20, font: '9px monospace', color: '#626b6e' }}>
                    CARD CLOUD · WORKSHOP
                  </div>
                </div>
                <div className="dimension">← 69 mm body →</div>
              </div>
              <div>
                <div className="paper-mini" aria-label="Illustration of a printable divider sheet">
                  {Array.from({ length: 6 }).map((_, i) => <i key={i} />)}
                </div>
                <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>Build a print sheet</p>
              </div>
            </div>
            <div className="stagenote">Color → Type → Set · Tab position makes the hierarchy visible.</div>
          </div>

          <div className="print-bottom">
            <span className="muted">Editable vector export · physical dimensions</span>
            <button onClick={exportSvg}>Download divider SVG ↓</button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LabelStudio
