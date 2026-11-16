'use client'

import { teamLogoUrl } from '@/lib/teams'

export function TeamAvatar({ name, className }: { name?: string; className?: string }) {
  const src = teamLogoUrl(name)
  if (!src || !name) return null

  return (
    <span className={`av av-team${className ? ` ${className}` : ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={name} loading="lazy" decoding="async" />
    </span>
  )
}
