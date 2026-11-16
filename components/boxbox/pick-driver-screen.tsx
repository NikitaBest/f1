'use client'

import type { CSSProperties } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { actions, useTheme } from '@/lib/store'
import { THEME_LIST, driverDisplayName, type ThemeId } from '@/lib/themes'
import { SoftImage } from './soft-image'

const THEME_COLORS: Record<ThemeId, { navy: string; accent: string; sun: string }> = {
  verstappen: { navy: '#0a1033', accent: '#e3101e', sun: '#ffc20e' },
  antonelli: { navy: '#0c0f12', accent: '#00a19c', sun: '#c5ccd6' },
  russell: { navy: '#0c0f12', accent: '#00a19c', sun: '#c5ccd6' },
  leclerc: { navy: '#14060a', accent: '#e10600', sun: '#fff200' },
  hamilton: { navy: '#14060a', accent: '#e10600', sun: '#fff200' },
  norris: { navy: '#0b0b0b', accent: '#ff8700', sun: '#ffc38a' },
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
        <h1 className="disp">Выбери гонщика</h1>
        <p>Тема, гараж и сезон подстроятся под пилота.</p>
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
                  animationDelay: `${i * 55}ms`,
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
              <span className="pick-drv-shot">
                <SoftImage className="pick-drv-photo" src={t.assets.portrait} alt="" />
                <span className={`pick-drv-flag ${t.flagClass}`} aria-hidden="true" />
              </span>
              <span className="pick-drv-meta">
                <span className="pick-drv-no disp" aria-hidden="true">
                  {String(t.number).padStart(2, '0')}
                </span>
                <span className="eyebrow">{t.teamShort}</span>
                <b className="disp pick-drv-name">{driverDisplayName(t)}</b>
                <span className="pick-drv-cta">
                  {active ? (
                    <>
                      <Check size={14} aria-hidden="true" />
                      Выбран
                    </>
                  ) : (
                    'Выбрать'
                  )}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
