import type { CSSProperties, ReactNode } from 'react'
import type { ThemeCrop } from '@/lib/themes'

export function Crop({
  spec,
  label,
  className,
}: {
  spec: ThemeCrop
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
