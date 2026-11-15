'use client'

import { ArrowLeft } from 'lucide-react'
import { useTheme } from '@/lib/store'
import { Crop } from './art'

export function CarScreen({ onBack }: { onBack: () => void }) {
  const theme = useTheme()

  return (
    <div className="scroll car">
      <div className="topbar">
        <button type="button" className="back" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden="true" />
          Garage
        </button>
        <span className="eyebrow">Car · 2026</span>
      </div>

      <header className="car-hero" aria-label={`${theme.teamShort} ${theme.carCode}`}>
        <img
          className="car-hero-img"
          src={theme.assets.carTop}
          alt={`${theme.teamShort} ${theme.carCode}`}
        />
        <div className="car-hero-veil" aria-hidden="true" />
        <div className="car-hero-cap">
          <span className="eyebrow">{theme.teamShort}</span>
          <h1 className="disp">{theme.carCode}</h1>
          <p>{theme.carBlurb}</p>
        </div>
      </header>

      <div className="car-tagline">
        <span className="eyebrow">Machine</span>
        <p className="disp">{theme.carTagline}</p>
      </div>

      <div className="sec-title">
        <h2 className="disp">Specs</h2>
        <span className="eyebrow">Garage sheet</span>
      </div>
      <dl className="car-specs">
        {theme.specs.map((s) => (
          <div key={s.k} className="kv">
            <dt>{s.k}</dt>
            <dd>
              <b>{s.v}</b>
            </dd>
          </div>
        ))}
      </dl>

      <div className="sec-title">
        <h2 className="disp">Anatomy</h2>
        <span className="eyebrow">Four zones</span>
      </div>
      <ol className="car-zones">
        {theme.zones.map((z) => (
          <li key={z.code}>
            <span className="zn num">{z.code}</span>
            <div>
              <b className="disp">{z.title}</b>
              <p>{z.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="sec-title">
        <h2 className="disp">Side view</h2>
        <span className="eyebrow">Profile</span>
      </div>
      <div className="car-side">
        <span className="ghost disp" aria-hidden="true">
          {theme.carCode}
        </span>
        <Crop spec={theme.carCrop} label={`${theme.teamShort} ${theme.carCode}`} />
      </div>

      <p className="car-note">{theme.carNote}</p>
    </div>
  )
}
