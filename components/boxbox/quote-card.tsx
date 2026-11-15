'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/lib/store'
import { driverDisplayName } from '@/lib/themes'

const INTERVAL_MS = 6500

export function QuoteCard() {
  const theme = useTheme()
  const quotes = theme.quotes
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setIndex(0)
    setVisible(true)
  }, [theme.id])

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || quotes.length < 2) return

    let fadeOut: ReturnType<typeof setTimeout> | undefined
    const tick = setInterval(() => {
      setVisible(false)
      fadeOut = setTimeout(() => {
        setIndex((i) => (i + 1) % quotes.length)
        setVisible(true)
      }, 420)
    }, INTERVAL_MS)

    return () => {
      clearInterval(tick)
      if (fadeOut) clearTimeout(fadeOut)
    }
  }, [quotes])

  return (
    <figure className="quote">
      <div className={`quote-swap${visible ? ' is-on' : ''}`}>
        <blockquote className="disp q">{quotes[index] ?? quotes[0]}</blockquote>
        <figcaption className="by">{driverDisplayName(theme)}</figcaption>
      </div>
    </figure>
  )
}
