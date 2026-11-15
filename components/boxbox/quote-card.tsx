'use client'

import { useEffect, useState } from 'react'

const QUOTES = [
  'Тебе не нужно быть идеальным. Нужно быть лучшим в этот день.',
  'Единственное место, которое имеет значение — первое.',
  'Именно когда ты вне зоны комфорта, ты действительно растёшь.',
  'Если бы у моей мамы были яйца, она была бы моим папой.',
  'Simply lovely.',
] as const

const INTERVAL_MS = 6500

export function QuoteCard() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    let fadeOut: ReturnType<typeof setTimeout> | undefined
    const tick = setInterval(() => {
      setVisible(false)
      fadeOut = setTimeout(() => {
        setIndex((i) => (i + 1) % QUOTES.length)
        setVisible(true)
      }, 420)
    }, INTERVAL_MS)

    return () => {
      clearInterval(tick)
      if (fadeOut) clearTimeout(fadeOut)
    }
  }, [])

  return (
    <figure className="quote">
      <div className={`quote-swap${visible ? ' is-on' : ''}`}>
        <blockquote className="disp q">{QUOTES[index]}</blockquote>
        <figcaption className="by">Max Verstappen</figcaption>
      </div>
    </figure>
  )
}
