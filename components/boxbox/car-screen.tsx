'use client'

import { ArrowLeft } from 'lucide-react'
import { CROPS, Crop } from './art'

const ZONES = [
  {
    code: '01',
    title: 'Nose & front wing',
    text: 'Узкий нос и переднее крыло задают поток воздуха на весь болид. В регламенте 2026 активная аэродинамика помогает и в квалифае, и в гонке — меньше лобового сопротивления на прямой, больше прижима в повороте.',
  },
  {
    code: '02',
    title: 'Cockpit',
    text: 'Кабина вокруг Max и его напарника: halo, руль с десятками настроек и телеметрия команды. Отсюда RB22 чувствует трассу — от стартовых огней до последнего круга.',
  },
  {
    code: '03',
    title: 'Power unit',
    text: 'Силовая установка новой эры: больше электричества, другая архитектура и союз Red Bull Powertrains с Ford. Меньше «чистого» ДВС — больше гибридной ярости на выходе из медленных зон.',
  },
  {
    code: '04',
    title: 'Rear wing & DRS',
    text: 'Заднее крыло и активные элементы закрывают картину. На прямой RB22 «расправляется», в связке поворотов снова прижимается к асфальту — классический Red Bull баланс атаки.',
  },
] as const

const SPECS = [
  { k: 'Chassis', v: 'RB22' },
  { k: 'Team', v: 'Oracle Red Bull Racing' },
  { k: 'Era', v: '2026 regulations' },
  { k: 'Power', v: 'RBPT × Ford' },
  { k: 'Tyres', v: 'Pirelli' },
  { k: 'Focus', v: 'New era · new fight' },
] as const

export function CarScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="scroll car">
      <div className="topbar">
        <button type="button" className="back" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden="true" />
          Garage
        </button>
        <span className="eyebrow">Car · 2026</span>
      </div>

      <header className="car-hero" aria-label="Red Bull Racing RB22 сверху">
        <img className="car-hero-img" src="/img/rb22-top.jpeg" alt="Red Bull Racing RB22 — вид сверху" />
        <div className="car-hero-veil" aria-hidden="true" />
        <div className="car-hero-cap">
          <span className="eyebrow">Oracle Red Bull Racing</span>
          <h1 className="disp">RB22</h1>
          <p>New era, new fight — болид сезона 2026 в ливрее быка.</p>
        </div>
      </header>

      <div className="car-tagline">
        <span className="eyebrow">Machine</span>
        <p className="disp">Built to hunt.</p>
      </div>

      <div className="sec-title">
        <h2 className="disp">Specs</h2>
        <span className="eyebrow">Garage sheet</span>
      </div>
      <dl className="car-specs">
        {SPECS.map((s) => (
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
        {ZONES.map((z) => (
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
          RB22
        </span>
        <Crop spec={CROPS.car} label="Red Bull Racing RB22 сбоку" />
      </div>

      <p className="car-note">
        RB22 — ответ Milton Keynes на новый технический цикл Формулы 1: легче на взгляд, злее в гибриде, всё ещё с жёлтым быком на спине.
      </p>
    </div>
  )
}
