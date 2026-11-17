import { NextRequest, NextResponse } from 'next/server'

const ALLOWED = new Set(['livetiming.formula1.com'])

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url') ?? ''
  let target: URL
  try {
    target = new URL(raw)
  } catch {
    return NextResponse.json({ error: 'bad url' }, { status: 400 })
  }

  if (target.protocol !== 'https:' || !ALLOWED.has(target.hostname)) {
    return NextResponse.json({ error: 'host not allowed' }, { status: 400 })
  }
  if (!target.pathname.toLowerCase().endsWith('.mp3')) {
    return NextResponse.json({ error: 'not audio' }, { status: 400 })
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: { Accept: 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8' },
      // Аудио не кэшируем агрессивно на edge — файлы небольшие, но путь длинный
      next: { revalidate: 86_400 },
    })
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: 'upstream failed' }, { status: 502 })
    }

    const headers = new Headers()
    headers.set('Content-Type', upstream.headers.get('content-type') || 'audio/mpeg')
    const len = upstream.headers.get('content-length')
    if (len) headers.set('Content-Length', len)
    headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
    headers.set('Accept-Ranges', 'none')

    return new NextResponse(upstream.body, { status: 200, headers })
  } catch {
    return NextResponse.json({ error: 'proxy failed' }, { status: 502 })
  }
}
