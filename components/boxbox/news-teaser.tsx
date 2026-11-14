'use client'

import { useEffect, useState } from 'react'
import { fetchNewsFeed, formatNewsTime, type NewsItem } from '@/lib/news'

export function NewsTeaser({ onOpenAll }: { onOpenAll?: () => void }) {
  const [items, setItems] = useState<NewsItem[]>([])
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const feed = await fetchNewsFeed()
        if (!cancelled) setItems(feed.items.slice(0, 3))
      } catch {
        if (!cancelled) setFailed(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (failed || items.length === 0) return null

  return (
    <section className="news-teaser" aria-label="Последние новости">
      <div className="sec-title">
        <h2 className="disp">News</h2>
        <button type="button" className="eyebrow news-teaser-all" onClick={onOpenAll}>
          Все →
        </button>
      </div>
      <ul className="news-teaser-list">
        {items.map((item, i) => (
          <li key={item.id}>
            <a className="news-teaser-row" href={item.link} target="_blank" rel="noopener noreferrer">
              <span className="news-idx num">{String(i + 1).padStart(2, '0')}</span>
              <span className="news-copy">
                <span className="news-when">{formatNewsTime(item.publishedAt) || item.source}</span>
                <span className="nm">{item.title}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
