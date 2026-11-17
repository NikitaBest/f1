import type { CSSProperties, ReactNode } from 'react'

export const cssVars = (vars: Record<string, string | number>) => vars as CSSProperties

export function WxHead({
  eyebrow,
  title,
  aside,
}: {
  eyebrow: string
  title: string
  aside?: ReactNode
}) {
  return (
    <header className="wx-head">
      <div>
        <span className="wx-eyebrow">{eyebrow}</span>
        <h4 className="wx-title">{title}</h4>
      </div>
      {aside ? <div className="wx-aside">{aside}</div> : null}
    </header>
  )
}

export function WxEmpty({ children }: { children: ReactNode }) {
  return <p className="wx-empty">{children}</p>
}

export function WxLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="wx wx-loading" aria-busy="true" aria-label="Загрузка">
      <i className="wx-skel wx-skel-head" />
      {Array.from({ length: rows }, (_, i) => (
        <i key={i} className="wx-skel" style={{ animationDelay: `${i * 90}ms` }} />
      ))}
    </div>
  )
}

export function timeOf(iso: string, seconds = false) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    ...(seconds ? { second: '2-digit' } : {}),
  })
}
