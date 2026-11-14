'use client'

import type { F1LiveState } from '@/lib/use-f1-live'
import { CROPS, Crop } from './art'

export const isFavDriver = (code?: string, family?: string) => code === 'VER' || family === 'Verstappen'
export const isFavTeam = (name?: string) => !!name && /red bull/i.test(name) && !/racing bulls|rb f1/i.test(name)

export function DuoCard({ live, onOpenDriver }: { live: F1LiveState; onOpenDriver?: () => void }) {
  const d = live.drivers.find((r) => isFavDriver(r.Driver.code, r.Driver.familyName))
  const t = live.constructors.find((r) => isFavTeam(r.Constructor.name))
  const dash = live.loading ? '…' : '—'

  return (
    <section className="duo" aria-label="Любимый гонщик и команда">
      <div className="duo-grid">
        <button type="button" className="duo-d" onClick={onOpenDriver} aria-label="Открыть Макса Ферстаппена">
          <Crop spec={CROPS.maxRed} label="Макс Ферстаппен" />
          <span className="flag-nl" aria-hidden="true" />
          <span className="no disp" aria-hidden="true">
            3
          </span>
          <div className="cap">
            <span className="eyebrow">Гонщик</span>
            <b className="disp">
              Макс
              <br />
              Ферстаппен
            </b>
          </div>
        </button>
        <div className="duo-t">
          <img className="duo-t-bg" src="/img/rb-logo.jpeg" alt="" aria-hidden="true" />
          <div className="duo-t-veil" aria-hidden="true" />
          <div className="cap">
            <span className="eyebrow">Команда</span>
            <b className="disp">
              Red Bull
              <br />
              Racing
            </b>
            <div className="tst">
              <span>
                <b className="num">{t ? `P${t.position}` : dash}</b>Кубок
              </span>
              <span>
                <b className="num">{t?.points ?? dash}</b>Очки
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="duo-car">
        <span className="ghost disp" aria-hidden="true">
          RB
        </span>
        <div className="sig-dark">
          <Crop spec={CROPS.sig} />
        </div>
        <Crop spec={CROPS.car} label="Болид Red Bull Racing" />
      </div>
      <div className="duo-bar">
        <div className="stat">
          <b className="num">{d ? `P${d.position}` : dash}</b>
          <span>Личный зачёт</span>
        </div>
        <div className="stat">
          <b className="num">{d?.points ?? dash}</b>
          <span>Очки</span>
        </div>
        <div className="stat">
          <b className="num">{d?.wins ?? dash}</b>
          <span>Победы</span>
        </div>
      </div>
    </section>
  )
}
