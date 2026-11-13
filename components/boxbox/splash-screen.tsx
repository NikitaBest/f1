'use client'

import { ArrowRight } from 'lucide-react'
import { Ticker } from './art'

export function SplashScreen({ onStart }: { onStart: () => void }) {
  const season = new Date().getFullYear()
  return (
    <div className="splash">
      <div className="splash-img" role="img" aria-label="Шлем Макса Ферстаппена с номером 3 и красным львом" />
      <span className="splash-vert disp" aria-hidden="true">
        Verstappen
      </span>
      <div className="splash-fade" />
      <Ticker className="splash-tick" words={['Box box', 'Oracle Red Bull Racing', 'Max Verstappen', `Сезон ${season}`]} />
      <div className="splash-top">
        <span className="chip">Сезон {season}</span>
        <span className="eyebrow" style={{ color: 'var(--sun)' }}>
          Red Bull Racing
        </span>
      </div>
      <div className="splash-body">
        <h1 className="disp">
          Box<span>·</span>Box
        </h1>
        <p>Каждый уикенд под твоим контролем. Макс и Red Bull — рядом с календарём.</p>
        <button type="button" className="btn" onClick={onStart}>
          Начать сезон
          <ArrowRight size={20} strokeWidth={2.6} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
