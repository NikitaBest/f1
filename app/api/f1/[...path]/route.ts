import { NextRequest, NextResponse } from 'next/server'

const UPSTREAM = 'https://api.jolpi.ca/ergast/f1'
const UA = 'BOXBOX/1.0 (+personal; vercel)'

export const revalidate = 300

type Params = { params: Promise<{ path: string[] }> }

async function proxy(req: NextRequest, { params }: Params) {
  const { path } = await params
  const segments = path.map((p) => encodeURIComponent(p)).join('/')
  const search = req.nextUrl.search || ''
  const url = `${UPSTREAM}/${segments}${search}`

  try {
    const upstream = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': UA,
      },
      next: { revalidate: 300 },
    })

    const body = await upstream.text()
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'F1 upstream unavailable', detail: error instanceof Error ? error.message : 'unknown' },
      { status: 502 },
    )
  }
}

export const GET = proxy
