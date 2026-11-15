'use client'

import { pilotPhotoUrl } from '@/lib/pilots'

export function PilotAvatar({
  familyName,
  givenName,
  code,
  alt,
  className,
}: {
  familyName?: string
  givenName?: string
  code?: string
  alt?: string
  className?: string
}) {
  const src = pilotPhotoUrl({ familyName, givenName, code })
  if (!src) return null

  const label = alt ?? ([givenName, familyName].filter(Boolean).join(' ') || code || '')

  return (
    <span className={`av${className ? ` ${className}` : ''}`}>
      <img src={src} alt={label} loading="lazy" decoding="async" />
    </span>
  )
}
