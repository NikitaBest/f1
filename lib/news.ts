export type NewsItem = {
  id: string
  title: string
  link: string
  summary: string
  image?: string
  publishedAt: string | null
  source: string
}

export type NewsFeed = {
  title: string
  source: string
  fetchedAt: string
  items: NewsItem[]
}

export async function fetchNewsFeed(): Promise<NewsFeed> {
  const res = await fetch('/api/news', { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`News API ${res.status}`)
  return res.json() as Promise<NewsFeed>
}

export function formatNewsTime(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('ru', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}
