import type { CSSProperties, ReactNode } from 'react'

type CropSpec = { img: string; iw: number; ih: number; cx: number; cy: number; cw: number; ch: number }

const POSTER_MAX = { img: '/img/poster-max.jpeg', iw: 736, ih: 1308 }
const POSTER_CAR = { img: '/img/poster-car.jpeg', iw: 736, ih: 1106 }

export const CROPS = {
  maxRed: { ...POSTER_MAX, cx: 100, cy: 490, cw: 548, ch: 730 },
  face: { ...POSTER_MAX, cx: 190, cy: 490, cw: 400, ch: 400 },
  car: { ...POSTER_CAR, cx: 15, cy: 505, cw: 690, ch: 245 },
  sig: { ...POSTER_CAR, cx: 295, cy: 848, cw: 140, ch: 55 },
  bulls: { ...POSTER_CAR, cx: 333, cy: 36, cw: 72, ch: 34 },
} satisfies Record<string, CropSpec>

export function Crop({
  spec,
  label,
  className,
}: {
  spec: CropSpec
  label?: string
  className?: string
}) {
  const style = {
    '--img': `url("${spec.img}")`,
    '--iw': spec.iw,
    '--ih': spec.ih,
    '--cx': spec.cx,
    '--cy': spec.cy,
    '--cw': spec.cw,
    '--ch': spec.ch,
  } as CSSProperties
  return (
    <div
      className={`crop ${className ?? ''}`}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  )
}

export function Ticker({ words, className }: { words: string[]; className?: string }) {
  const row = words.flatMap((w, i) => [<span key={`w${i}`}>{w}</span>, <i key={`d${i}`} />])
  return (
    <div className={`ticker ${className ?? ''}`} aria-hidden="true">
      <div>
        {row}
        {row.map((n, i) => (
          <span key={`r${i}`}>{n}</span>
        ))}
      </div>
    </div>
  )
}

export function Hero({
  image,
  pos,
  eyebrow,
  title,
  sub,
}: {
  image: string
  pos?: string
  eyebrow: string
  title: string
  sub?: ReactNode
}) {
  return (
    <header className="hbn" style={{ '--bg': `url("${image}")`, '--pos': pos } as CSSProperties}>
      <span className="eyebrow">{eyebrow}</span>
      <h1 className="disp page-title">{title}</h1>
      {sub && <p className="sub">{sub}</p>}
    </header>
  )
}

export function TopBar({ right }: { right?: ReactNode }) {
  return (
    <div className="topbar">
      <span className="logo">
        <Crop spec={CROPS.bulls} className="bulls" />
        Box<i />Box
      </span>
      {right}
    </div>
  )
}
