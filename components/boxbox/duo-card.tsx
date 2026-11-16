'use client'

import { useTheme } from '@/lib/store'
import { driverDisplayName, isFavDriver, isFavTeam } from '@/lib/themes'
import type { F1LiveState } from '@/lib/use-f1-live'
import { Crop } from './art'
import { SoftImage } from './soft-image'

export function DuoCard({
  live,
  onOpenDriver,
  onOpenTeam,
  onOpenCar,
}: {
  live: F1LiveState
  onOpenDriver?: () => void
  onOpenTeam?: () => void
  onOpenCar?: () => void
}) {
  const theme = useTheme()
  const d = live.drivers.find((r) => isFavDriver(theme, r.Driver.code, r.Driver.familyName))
  const t = live.constructors.find((r) => isFavTeam(theme, r.Constructor.name))
  const dash = live.loading ? '…' : '—'
  const name = driverDisplayName(theme)

  return (
    <section className="duo" aria-label="Любимый гонщик и команда">
      <div className="duo-grid">
        <button type="button" className="duo-d" onClick={onOpenDriver} aria-label={`Open ${name}`}>
          <Crop spec={theme.portraitCrop} label={name} />
          <span className={`bb-flag ${theme.flagClass}`} aria-hidden="true">
            {theme.flag}
          </span>
          <span className="no disp" aria-hidden="true">
            {theme.number}
          </span>
          <div className="cap">
            <span className="eyebrow">Driver</span>
            <b className="disp">
              {theme.givenName}
              <br />
              {theme.familyName}
            </b>
          </div>
        </button>
        <button type="button" className="duo-t" onClick={onOpenTeam} aria-label={`Открыть ${theme.teamName}`}>
          <SoftImage className="duo-t-bg" src={theme.assets.logo} alt="" aria-hidden="true" />
          <div className="duo-t-veil" aria-hidden="true" />
          <div className="cap">
            <span className="eyebrow">Team</span>
            <b className="disp">
              {theme.teamTitle[0]}
              <br />
              {theme.teamTitle[1]}
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
        </button>
      </div>
      <button type="button" className="duo-car" onClick={onOpenCar} aria-label={`Открыть ${theme.carCode}`}>
        <span className="ghost disp" aria-hidden="true">
          {theme.carGhost}
        </span>
        {theme.sigCrop ? (
          <div className="sig-dark">
            <Crop spec={theme.sigCrop} />
          </div>
        ) : null}
        <Crop spec={theme.carCrop} label={`Болид ${theme.teamShort}`} />
      </button>
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
