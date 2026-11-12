'use client'

import { useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

const CAP_HEIGHT = 0.69

export function GiantWord({
  text,
  width = 256,
  color = 'var(--ink)',
  max = 200,
}: {
  text: string
  width?: number
  color?: string
  max?: number
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const textRef = useRef<SVGTextElement>(null)

  useLayoutEffect(() => {
    const svg = svgRef.current
    const el = textRef.current
    if (!svg || !el) return
    let alive = true
    const fit = () => {
      if (!alive) return
      el.setAttribute('font-size', '100')
      const len = el.getComputedTextLength() || width
      const size = Math.min(max, (100 * width) / len)
      const h = Math.round(CAP_HEIGHT * size) + 2
      svg.setAttribute('viewBox', `0 0 ${width} ${h}`)
      el.setAttribute('font-size', size.toFixed(2))
      el.setAttribute('y', String(h - 1))
    }
    fit()
    document.fonts?.ready.then(fit)
    return () => {
      alive = false
    }
  }, [text, width, max])

  const upper = text.toUpperCase()
  return (
    <svg ref={svgRef} className="word" viewBox={`0 0 ${width} 44`} role="img" aria-label={upper}>
      <text ref={textRef} x={0} y={43} fontSize={60} style={{ fill: color }}>
        {upper}
      </text>
    </svg>
  )
}

export function Signature({ className }: { className?: string }) {
  return (
    <svg className={cn('sig', className)} viewBox="0 0 300 80" preserveAspectRatio="none" aria-hidden="true">
      <path d="M6 60C44 6 80 4 70 38c-6 20-30 34-10 32 26-3 40-48 66-44 16 3-6 34 10 38 22 4 48-40 68-36 14 3-2 24 12 27 20 3 44-16 82-30" />
    </svg>
  )
}

export function PosterCard({
  left,
  right,
  children,
  className,
}: {
  left: string
  right: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('poster grain', className)}>
      <i className="reg tl" aria-hidden="true" />
      <i className="reg tr" aria-hidden="true" />
      <i className="reg bl" aria-hidden="true" />
      <i className="reg br" aria-hidden="true" />
      <span className="vt l" aria-hidden="true">
        {left}
      </span>
      <span className="vt r" aria-hidden="true">
        {right}
      </span>
      {children}
    </div>
  )
}

export function Brand({ sub }: { sub: string }) {
  return (
    <header className="brand">
      <span className="logo">
        BOX<i>·</i>BOX
      </span>
      <span className="micro mute">{sub}</span>
    </header>
  )
}
