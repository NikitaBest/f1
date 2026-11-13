import type { CSSProperties, ReactNode } from 'react'

type CropSpec = { img: string; iw: number; ih: number; cx: number; cy: number; cw: number; ch: number }

const POSTER_MAX = { img: '/img/poster-max.jpeg', iw: 736, ih: 1308 }
const MAX_PORTRAIT = { img: '/img/max-portrait.jpeg', iw: 736, ih: 1307 }
const POSTER_CAR = { img: '/img/poster-car.jpeg', iw: 736, ih: 1106 }
const RB_CAR = { img: '/img/rb-car.jpeg', iw: 640, ih: 800 }

export const CROPS = {
  maxRed: { ...MAX_PORTRAIT, cx: 40, cy: 40, cw: 656, ch: 820 },
  face: { ...POSTER_MAX, cx: 190, cy: 490, cw: 400, ch: 400 },
  car: { ...RB_CAR, cx: 8, cy: 330, cw: 624, ch: 160 },
  sig: { ...POSTER_CAR, cx: 295, cy: 848, cw: 140, ch: 55 },
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
        Box<i />Box
      </span>
      {right}
    </div>
  )
}
