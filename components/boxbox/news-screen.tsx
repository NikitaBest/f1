'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react'
import { fetchNewsFeed, formatNewsTime, type NewsFeed, type NewsItem } from '@/lib/news'
import { Hero } from './art'

export function NewsScreen() {
  const [feed, setFeed] = useState<NewsFeed | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<NewsItem | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchNewsFeed()
      setFeed(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить новости')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  if (open) {
    return (
      <div className="scroll news">
        <div className="topbar">
          <button type="button" className="back" onClick={() => setOpen(null)}>
            <ArrowLeft size={18} aria-hidden="true" />
            Лента
          </button>
          <span className="eyebrow">{open.source}</span>
        </div>

        <p className="news-meta">
          {formatNewsTime(open.publishedAt)}
          {formatNewsTime(open.publishedAt) ? ' · ' : ''}
          {open.source}
        </p>
        <h1 className="disp news-title">{open.title}</h1>
        {open.summary ? <p className="news-body">{open.summary}</p> : null}

        <a className="btn" href={open.link} target="_blank" rel="noopener noreferrer">
          Читать полностью
          <ExternalLink size={18} aria-hidden="true" />
        </a>
        <p className="news-hint">Полный текст и фото — на {open.source}</p>
      </div>
    )
  }

  return (
    <div className="scroll news">
      <Hero
        image="/img/lights.jpg"
        pos="40%"
        eyebrow="Autosport · F1"
        title="Новости"
        sub="Свежая лента Формулы 1 на русском"
      />

      <div className="topbar" style={{ marginBottom: 12 }}>
        <span className="eyebrow" style={{ color: 'var(--ink-60)' }}>
          {feed ? `${feed.items.length} материалов` : 'Лента'}
        </span>
        <button
          type="button"
          className="btn sm ghost"
          disabled={loading}
          onClick={() => void load()}
          aria-label="Обновить новости"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : undefined} aria-hidden="true" />
        </button>
      </div>

      {error && <p className="err-note">{error}</p>}
      {loading && !feed && <p className="sub">Загружаем ленту…</p>}

      {!loading && feed && feed.items.length === 0 && (
        <div className="empty">
          <h2 className="disp">Тишина в паддоке</h2>
          <p>Пока нет материалов. Обнови ленту чуть позже.</p>
        </div>
      )}

      <ul className="news-list">
        {feed?.items.map((item, i) => (
          <li key={item.id}>
            <button type="button" className="news-card text" onClick={() => setOpen(item)}>
              <span className="news-idx num">{String(i + 1).padStart(2, '0')}</span>
              <span className="news-copy">
                <span className="news-when">{formatNewsTime(item.publishedAt) || item.source}</span>
                <span className="nm">{item.title}</span>
                {item.summary ? <span className="pl">{item.summary}</span> : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
