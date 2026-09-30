import { useState } from 'react'
import { useWorkshop } from '@/lib/workshop'
import { BTN, CODE, cx, EYEBROW, H1, H3, NOTE_BOX, PAGE_HEAD, SUB } from '@/lib/ui'

const NAMES = ['Dakota', 'Player two', 'Player three', 'Player four']
const START = 40

// Per-seat paper tints (mockup used :nth-child colours)
const SEAT = [
  'bg-[#e3ebe2] border-[#c9cfc9]',
  'bg-[#dce8ed] border-[#bdccd4]',
  'bg-[#eee1da] border-[#d7c7bd]',
  'bg-[#e6e0ed] border-[#cfc6d8]',
]

const CounterKit = () => {
  const { toast } = useWorkshop()
  const [life, setLife] = useState<number[]>([START, START, START, START])

  const change = (i: number, delta: number) =>
    setLife((prev) => prev.map((v, idx) => (idx === i ? v + delta : v)))

  const reset = () => {
    setLife([START, START, START, START])
    toast('All players reset to 40 life')
  }

  const stepBtn = 'w-12 h-12 p-0 border border-[#b4bdb5] bg-white/30 text-[25px] rounded-md cursor-pointer hover:border-brass'

  return (
    <section>
      <div className={PAGE_HEAD}>
        <div>
          <div className={EYEBROW}>GAME NIGHT, SIMPLIFIED</div>
          <h1 className={H1}>Keep your eyes on the game.</h1>
          <p className={SUB}>A calm four-player Commander table. Tap to adjust life totals.</p>
        </div>
        <button className={BTN} onClick={reset}>Reset to 40</button>
      </div>

      <div className="grid grid-cols-2 gap-[18px] max-[760px]:grid-cols-1">
        {NAMES.map((name, i) => (
          <article className={cx('border rounded-[10px] p-[22px]', SEAT[i])} key={name}>
            <div className="flex justify-between items-center text-sm font-semibold">
              <span>{name}</span>
              <small className="text-xs font-normal">PLAYER 0{i + 1}</small>
            </div>
            <div className="flex justify-between items-center py-4">
              <button className={stepBtn} onClick={() => change(i, -1)} aria-label={`Decrease ${name}'s life`}>−</button>
              <output className="font-serif font-normal text-[64px] leading-[1.3]" aria-label={`${name}'s life total`}>{life[i]}</output>
              <button className={stepBtn} onClick={() => change(i, 1)} aria-label={`Increase ${name}'s life`}>+</button>
            </div>
            <div className="flex justify-between border-t border-[#56655433] pt-3 text-xs">
              <span>Poison <b>0</b></span>
              <span>Commander damage <b>0</b></span>
            </div>
          </article>
        ))}
      </div>

      <div className={NOTE_BOX}>
        <div>
          <h3 className={H3}>Your table, your counters.</h3>
          <p className="text-[13px] text-[#64695f] mt-[3px]">Life controls work in this prototype. Commander damage and other counters are visual placeholders.</p>
        </div>
        <span className={CODE}>COMMANDER · 4 PLAYERS</span>
      </div>
    </section>
  )
}

export default CounterKit
