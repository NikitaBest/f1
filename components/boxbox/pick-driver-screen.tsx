'use client'

import type { CSSProperties } from 'react'
import { ArrowLeft } from 'lucide-react'
import { actions, useTheme } from '@/lib/store'
import { THEME_LIST, driverDisplayName, type ThemeId } from '@/lib/themes'
import { SoftImage } from './soft-image'

const THEME_COLORS: Record<ThemeId, { navy: string; accent: string; sun: string }> = {
  verstappen: { navy: '#0a1033', accent: '#e3101e', sun: '#ffc20e' },
  antonelli: { navy: '#0c0f12', accent: '#00a19c', sun: '#c5ccd6' },
}

export function PickDriverScreen({ onBack }: { onBack: () => void }) {
  const current = useTheme()

  return (
    <div className="scroll pick-drv">
      <div className="topbar">
        <button type="button" className="back" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden="true" />
          Паддок
        </button>
        <span className="eyebrow">Theme</span>
      </div>

      <header className="pick-drv-head">
        <span className="eyebrow">Paddock</span>
        <h1 className="disp">Выбери гонщика</h1>
        <p>Тема приложения, гараж и данные сезона переключатся под выбранного пилота.</p>
      </header>

      <div className="pick-drv-list" role="listbox" aria-label="Любимый гонщик">
        {THEME_LIST.map((t, i) => {
          const active = t.id === current.id
          const colors = THEME_COLORS[t.id]
          return (
            <button
              key={t.id}
              type="button"
              role="option"
              aria-selected={active}
              className={`pick-drv-card${active ? ' is-on' : ''}`}
              style={
                {
                  '--pick-navy': colors.navy,
                  '--pick-accent': colors.accent,
                  '--pick-sun': colors.sun,
                  animationDelay: `${i * 70}ms`,
                } as CSSProperties
              }
              onClick={() => {
                if (t.id === current.id) {
                  onBack()
                  return
                }
                actions.setFavTheme(t.id)
              }}
            >
              <SoftImage className="pick-drv-photo" src={t.assets.portrait} alt="" />
              <div className="pick-drv-veil" aria-hidden="true" />
              <span className={`pick-drv-flag ${t.flagClass}`} aria-hidden="true" />
              <span className="pick-drv-no disp" aria-hidden="true">
                {t.number}
              </span>
              <div className="pick-drv-cap">
                <span className="eyebrow">{t.teamShort}</span>
                <b className="disp">
                  {t.givenName}
                  <br />
                  {t.familyName}
                </b>
                <span className="pick-drv-cta">{active ? 'Сейчас выбран' : 'Выбрать'}</span>
              </div>
            </button>
          )
        })}
      </div>

      <p className="pick-drv-note">
        Сейчас: <b>{driverDisplayName(current)}</b> · {current.teamShort}
      </p>
    </div>
  )
}
