import { CODE, cx, EYEBROW, H1, H2, PAGE_HEAD, PANEL, SUB } from '@/lib/ui'
import { CSSProperties } from 'react'

const SWATCHES = [
  { name: 'Midnight ink', code: '#172329 · navigation', paint: '#172329' },
  { name: 'Parchment', code: '#F4F1EA · canvas', paint: '#f4f1ea' },
  { name: 'Antique brass', code: '#E5BD78 · highlight', paint: '#e5bd78' },
  { name: 'Archive blue', code: '#30688C · category', paint: '#30688c' },
  { name: 'Forest green', code: '#3E6F57 · collection', paint: '#3e6f57' },
]

const MANA: { label: string; style: CSSProperties }[] = [
  { label: 'White', style: { background: '#f3e7c8' } },
  { label: 'Blue', style: { background: '#316a8c', color: '#fff' } },
  { label: 'Black', style: { background: '#3b4147', color: '#fff' } },
  { label: 'Red', style: { background: '#994d41', color: '#fff' } },
  { label: 'Green', style: { background: '#3e6f57', color: '#fff' } },
]

const DesignSystem = () => (
  <section>
    <div className={PAGE_HEAD}>
      <div>
        <div className={EYEBROW}>VISUAL DIRECTION / 01</div>
        <h1 className={H1}>The collector&apos;s workbench.</h1>
        <p className={SUB}>Quiet fantasy. Precision tooling. Tactile, print-first organization.</p>
      </div>
    </div>

    <div className="grid grid-cols-5 gap-4 my-6 max-[1100px]:gap-2 max-[760px]:grid-cols-2">
      {SWATCHES.map((s) => (
        <div className="border border-line rounded-lg overflow-hidden bg-paper" key={s.name}>
          <div className="h-[110px] max-[760px]:h-20" style={{ background: s.paint }} />
          <div className="p-[14px] text-[13px]">{s.name}<code className="block mt-1.5 text-xs text-muted">{s.code}</code></div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-[1.1fr_1fr] gap-6 max-[760px]:grid-cols-1">
      <div className={PANEL}>
        <div className={EYEBROW}>TYPOGRAPHY</div>
        <div className="border-b border-line pb-4 mb-4">
          <div className="font-serif text-4xl my-4 max-[760px]:text-[29px]">Every card has a home.</div>
          <p className={SUB}>Georgia · expressive editorial headings</p>
        </div>
        <h2 className={H2}>Practical tools. Clear information.</h2>
        <p className={SUB}>System sans · navigation, forms, and card data</p>
        <div className={cx(CODE, 'inline-block mt-5')}>C21 / #263 / 69 × 96 mm</div>
        <p className="text-[13px] text-muted mt-2">Monospace · identifiers and dimensions</p>
      </div>

      <div className={PANEL}>
        <div className={EYEBROW}>MATERIAL &amp; INTERACTION</div>
        <h2 className={H2}>Less decoration. More intention.</h2>
        <p className={SUB}>
          Warm paper surfaces, fine borders, squared controls, and subtle elevation for physical objects.
          Brass marks the active tool; color families help you sort.
        </p>
        <div className="flex gap-2.5 flex-wrap mt-5">
          {MANA.map((m) => (
            <span key={m.label} className="text-xs px-3 py-[7px] border border-[#d4cec0] rounded" style={m.style}>{m.label}</span>
          ))}
        </div>
        <p className="text-[13px] text-muted mt-5">
          Always pair color with labels and original line icons. No ornate chrome or official icon reproductions.
          Generic diamonds stand in for set symbols in this concept.
        </p>
      </div>
    </div>
  </section>
)

export default DesignSystem
