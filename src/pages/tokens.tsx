import Icon, { IconName } from '@/components/Icon'
import { useWorkshop } from '@/lib/workshop'

type Token = {
  name: string
  pt: string
  icon: IconName
  face: '' | 'amber' | 'blue'
  eyebrow: string
  heading: string
  body: string
}

const TOKENS: Token[] = [
  {
    name: 'Saproling', pt: '1 / 1', icon: 'leaf', face: '',
    eyebrow: 'TOKEN CREATURE', heading: 'Small creature. Big potential.',
    body: 'Green · Saproling\n63 × 88 mm printable template',
  },
  {
    name: 'Treasure', pt: '◇', icon: 'gem', face: 'amber',
    eyebrow: 'TOKEN ARTIFACT', heading: 'A little mana in reserve.',
    body: 'Colorless · Treasure\nSacrifice to add one mana of any color.',
  },
  {
    name: 'Construct', pt: '* / *', icon: 'gear', face: 'blue',
    eyebrow: 'TOKEN ARTIFACT CREATURE', heading: 'Made to grow with your board.',
    body: 'Colorless · Construct\nExample variable-power template',
  },
]

const TokenLibrary = () => {
  const { addToQueue } = useWorkshop()

  return (
    <section>
      <div className="page-head">
        <div>
          <div className="eyebrow">BUILD YOUR TABLE KIT</div>
          <h1>Bring the right tokens.</h1>
          <p className="sub">A clean, ink-friendly companion for every creature and artifact you create.</p>
        </div>
      </div>

      <div className="panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h3>Starter token kit</h3>
          <p className="sub" style={{ fontSize: 13, marginTop: 3 }}>Three example templates · customizable in the full product</p>
        </div>
        <button className="primary" onClick={() => TOKENS.forEach((t) => addToQueue(`Token: ${t.name}`))}>
          Queue all three
        </button>
      </div>

      <div className="token-grid">
        {TOKENS.map((t) => (
          <article className="token" key={t.name}>
            <div className="token-top">
              <h3>{t.name}</h3>
              <span className="pt">{t.pt}</span>
            </div>
            <div className={`token-face${t.face ? ' ' + t.face : ''}`}>
              <Icon name={t.icon} />
            </div>
            <div className="token-body">
              <div className="eyebrow">{t.eyebrow}</div>
              <h3>{t.heading}</h3>
              <p>
                {t.body.split('\n').map((line, i) => (
                  <span key={i}>{line}{i === 0 && <br />}</span>
                ))}
              </p>
              <button onClick={() => addToQueue(`Token: ${t.name}`)}>Add to print queue +</button>
            </div>
          </article>
        ))}
      </div>

      <div className="note-box">
        <div>
          <h3>Designed for your printer, not just your screen.</h3>
          <p>Minimal line icons, spacious rules areas, and readable power / toughness.</p>
        </div>
        <span className="code">LOW-INK EDITION</span>
      </div>
    </section>
  )
}

export default TokenLibrary
