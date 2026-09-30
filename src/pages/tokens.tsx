import Icon, { IconName } from '@/components/Icon'
import { useWorkshop } from '@/lib/workshop'
import { BTN, BTN_PRIMARY, CODE, cx, EYEBROW, H1, H3, NOTE_BOX, PAGE_HEAD, PANEL, SUB } from '@/lib/ui'

const FACE: Record<string, string> = {
  '': 'bg-[#e8eadf] text-[#527157]',
  amber: 'bg-[#eee5ce] text-[#947440]',
  blue: 'bg-[#dce8eb] text-[#366883]',
}

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
      <div className={PAGE_HEAD}>
        <div>
          <div className={EYEBROW}>BUILD YOUR TABLE KIT</div>
          <h1 className={H1}>Bring the right tokens.</h1>
          <p className={SUB}>A clean, ink-friendly companion for every creature and artifact you create.</p>
        </div>
      </div>

      <div className={cx(PANEL, '!px-5 !py-4 flex items-center justify-between gap-4 flex-wrap')}>
        <div>
          <h3 className={H3}>Starter token kit</h3>
          <p className="text-[13px] text-muted mt-[3px]">Three example templates · customizable in the full product</p>
        </div>
        <button className={BTN_PRIMARY} onClick={() => TOKENS.forEach((t) => addToQueue(`Token: ${t.name}`))}>
          Queue all three
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5 mt-6 max-[1100px]:gap-3 max-[760px]:grid-cols-1">
        {TOKENS.map((t) => (
          <article className="border border-[#cdc9be] rounded-lg bg-paper overflow-hidden" key={t.name}>
            <div className="px-[18px] py-4 flex justify-between items-center border-b border-line">
              <h3 className={H3}>{t.name}</h3>
              <span className="font-serif text-xl">{t.pt}</span>
            </div>
            <div className={cx('h-[180px] flex items-center justify-center max-[760px]:h-[140px]', FACE[t.face])}>
              <Icon name={t.icon} className="w-20 h-20 [stroke-width:1]" />
            </div>
            <div className="p-[18px]">
              <div className={EYEBROW}>{t.eyebrow}</div>
              <h3 className={H3}>{t.heading}</h3>
              <p className="text-muted text-[13px] mt-1.5 mb-5">
                {t.body.split('\n').map((line, i) => (
                  <span key={i}>{line}{i === 0 && <br />}</span>
                ))}
              </p>
              <button className={cx(BTN, 'w-full text-sm')} onClick={() => addToQueue(`Token: ${t.name}`)}>Add to print queue +</button>
            </div>
          </article>
        ))}
      </div>

      <div className={NOTE_BOX}>
        <div>
          <h3 className={H3}>Designed for your printer, not just your screen.</h3>
          <p className="text-[13px] text-[#64695f] mt-[3px]">Minimal line icons, spacious rules areas, and readable power / toughness.</p>
        </div>
        <span className={CODE}>LOW-INK EDITION</span>
      </div>
    </section>
  )
}

export default TokenLibrary
