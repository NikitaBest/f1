import type { CSSProperties, ReactNode } from 'react'

export { SoftCrop as Crop } from './soft-image'

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
  compact,
}: {
  image: string
  pos?: string
  eyebrow: string
  title: string
  sub?: ReactNode
  compact?: boolean
}) {
  return (
    <header
      className={`hbn${compact ? ' compact' : ''}`}
      style={{ '--bg': `url("${image}")`, '--pos': pos } as CSSProperties}
    >
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
