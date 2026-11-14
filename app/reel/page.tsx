import type { Metadata } from 'next'
import { ReelDemo } from '@/components/boxbox/reel-demo'

export const metadata: Metadata = {
  title: 'BOX·BOX — Reel',
  robots: { index: false, follow: false },
}

export default function ReelPage() {
  return (
    <main className="bb-stage">
      <ReelDemo />
    </main>
  )
}
