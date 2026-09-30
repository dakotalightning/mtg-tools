const SWATCHES = [
  { name: 'Midnight ink', code: '#172329 · navigation', paint: '#172329' },
  { name: 'Parchment', code: '#F4F1EA · canvas', paint: '#f4f1ea' },
  { name: 'Antique brass', code: '#E5BD78 · highlight', paint: '#e5bd78' },
  { name: 'Archive blue', code: '#30688C · category', paint: '#30688c' },
  { name: 'Forest green', code: '#3E6F57 · collection', paint: '#3e6f57' },
]

const MANA = [
  { label: 'White', style: { background: '#f3e7c8' } },
  { label: 'Blue', style: { background: '#316a8c', color: '#fff' } },
  { label: 'Black', style: { background: '#3b4147', color: '#fff' } },
  { label: 'Red', style: { background: '#994d41', color: '#fff' } },
  { label: 'Green', style: { background: '#3e6f57', color: '#fff' } },
]

const DesignSystem = () => (
  <section>
    <div className="page-head">
      <div>
        <div className="eyebrow">VISUAL DIRECTION / 01</div>
        <h1>The collector&apos;s workbench.</h1>
        <p className="sub">Quiet fantasy. Precision tooling. Tactile, print-first organization.</p>
      </div>
    </div>

    <div className="swatches">
      {SWATCHES.map((s) => (
        <div className="swatch" key={s.name}>
          <div className="paint" style={{ background: s.paint }} />
          <div className="caption">{s.name}<code>{s.code}</code></div>
        </div>
      ))}
    </div>

    <div className="style-grid">
      <div className="panel">
        <div className="eyebrow">TYPOGRAPHY</div>
        <div className="type-demo">
          <div className="style-heading">Every card has a home.</div>
          <p className="sub">Georgia · expressive editorial headings</p>
        </div>
        <h2>Practical tools. Clear information.</h2>
        <p className="sub">System sans · navigation, forms, and card data</p>
        <div className="code" style={{ display: 'inline-block', marginTop: 20 }}>C21 / #263 / 69 × 96 mm</div>
        <p className="sub" style={{ fontSize: 13, marginTop: 8 }}>Monospace · identifiers and dimensions</p>
      </div>

      <div className="panel">
        <div className="eyebrow">MATERIAL &amp; INTERACTION</div>
        <h2>Less decoration. More intention.</h2>
        <p className="sub">
          Warm paper surfaces, fine borders, squared controls, and subtle elevation for physical objects.
          Brass marks the active tool; color families help you sort.
        </p>
        <div className="mana-colors">
          {MANA.map((m) => <span key={m.label} style={m.style}>{m.label}</span>)}
        </div>
        <p className="sub" style={{ fontSize: 13, marginTop: 20 }}>
          Always pair color with labels and original line icons. No ornate chrome or official icon reproductions.
          Generic diamonds stand in for set symbols in this concept.
        </p>
      </div>
    </div>
  </section>
)

export default DesignSystem
