import { NextResponse } from 'next/server'
import type { NewsFeed, NewsItem } from '@/lib/news'

export const revalidate = 600

const FEED_URL = 'https://autosport.com.ru/rss/f1.xml'
const UA = 'BOXBOX/1.0 (+personal; vercel)'
const SOURCE = 'Autosport.com.ru'

function decodeEntities(input: string) {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

function tag(block: string, name: string) {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i')
  const m = block.match(re)
  return m ? decodeEntities(m[1].trim()) : ''
}

function stripHtml(html: string) {
  return decodeEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractImage(block: string, descriptionHtml: string) {
  const enclosure = block.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*>/i)
  if (enclosure?.[1]) return enclosure[1]
  const media = block.match(/<media:content[^>]+url=["']([^"']+)["'][^>]*>/i)
  if (media?.[1]) return media[1]
  const img = descriptionHtml.match(/<img[^>]+src=["']([^"']+)["']/i)
  return img?.[1]
}

function toId(link: string, index: number) {
  try {
    const u = new URL(link)
    return u.pathname.replace(/^\//, '').replace(/\//g, '-') || `item-${index}`
  } catch {
    return `item-${index}`
  }
}

function parseFeed(xml: string): NewsFeed {
  const channel = xml.match(/<channel>([\s\S]*?)<\/channel>/i)?.[1] ?? xml
  const title = tag(channel, 'title') || 'Новости Формулы 1'
  const items: NewsItem[] = []

  for (const match of channel.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
    const block = match[1]
    const itemTitle = stripHtml(tag(block, 'title'))
    const link = tag(block, 'link') || tag(block, 'guid')
    if (!itemTitle || !link) continue

    const rawDescription = tag(block, 'description')
    const summary = stripHtml(rawDescription)
    const publishedRaw = tag(block, 'pubDate')
    const publishedAt = publishedRaw ? new Date(publishedRaw).toISOString() : null
    const image = extractImage(block, rawDescription)

    items.push({
      id: toId(link, items.length),
      title: itemTitle,
      link,
      summary,
      image: image?.startsWith('http') ? image : undefined,
      publishedAt: publishedAt && !Number.isNaN(Date.parse(publishedAt)) ? publishedAt : null,
      source: SOURCE,
    })

    if (items.length >= 40) break
  }

  return {
    title,
    source: SOURCE,
    fetchedAt: new Date().toISOString(),
    items,
  }
}

export async function GET() {
  try {
    const upstream = await fetch(FEED_URL, {
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
        'User-Agent': UA,
      },
      next: { revalidate: 600 },
    })

    if (!upstream.ok) {
      return NextResponse.json(
        { error: 'News feed unavailable', status: upstream.status },
        { status: 502 },
      )
    }

    const xml = await upstream.text()
    const feed = parseFeed(xml)
    return NextResponse.json(feed, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'News feed unavailable', detail: error instanceof Error ? error.message : 'unknown' },
      { status: 502 },
    )
  }
}
