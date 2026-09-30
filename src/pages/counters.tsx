import { useState } from 'react'
import { useWorkshop } from '@/lib/workshop'

const NAMES = ['Dakota', 'Player two', 'Player three', 'Player four']
const START = 40

const CounterKit = () => {
  const { toast } = useWorkshop()
  const [life, setLife] = useState<number[]>([START, START, START, START])

  const change = (i: number, delta: number) =>
    setLife((prev) => prev.map((v, idx) => (idx === i ? v + delta : v)))

  const reset = () => {
    setLife([START, START, START, START])
    toast('All players reset to 40 life')
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <div className="eyebrow">GAME NIGHT, SIMPLIFIED</div>
          <h1>Keep your eyes on the game.</h1>
          <p className="sub">A calm four-player Commander table. Tap to adjust life totals.</p>
        </div>
        <button onClick={reset}>Reset to 40</button>
      </div>

      <div className="counter-grid">
        {NAMES.map((name, i) => (
          <article className="player" key={name}>
            <div className="player-head">
              <span>{name}</span>
              <small>PLAYER 0{i + 1}</small>
            </div>
            <div className="life">
              <button onClick={() => change(i, -1)} aria-label={`Decrease ${name}'s life`}>−</button>
              <output aria-label={`${name}'s life total`}>{life[i]}</output>
              <button onClick={() => change(i, 1)} aria-label={`Increase ${name}'s life`}>+</button>
            </div>
            <div className="player-extra">
              <span>Poison <b>0</b></span>
              <span>Commander damage <b>0</b></span>
            </div>
          </article>
        ))}
      </div>

      <div className="note-box">
        <div>
          <h3>Your table, your counters.</h3>
          <p>Life controls work in this prototype. Commander damage and other counters are visual placeholders.</p>
        </div>
        <span className="code">COMMANDER · 4 PLAYERS</span>
      </div>
    </section>
  )
}

export default CounterKit
