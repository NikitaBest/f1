'use client'

import { useEffect, useState, type CSSProperties, type ImgHTMLAttributes } from 'react'
import type { ThemeCrop } from '@/lib/themes'

function useImageReady(src: string) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    setReady(false)
    const img = new window.Image()
    img.onload = () => {
      if (!cancelled) setReady(true)
    }
    img.onerror = () => {
      if (!cancelled) setReady(true)
    }
    img.src = src
    if (img.complete && img.naturalWidth > 0) setReady(true)
    return () => {
      cancelled = true
    }
  }, [src])

  return ready
}

export function SoftImage({
  src,
  alt = '',
  className,
  style,
  ...rest
}: {
  src: string
  alt?: string
  className?: string
  style?: CSSProperties
} & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'className' | 'style'>) {
  const ready = useImageReady(src)

  return (
    <span className={`soft-img${ready ? ' is-ready' : ' is-wait'}${className ? ` ${className}` : ''}`} style={style}>
      {!ready ? (
        <span className="soft-img-shell" aria-hidden="true">
          <span className="soft-img-blur" />
          <span className="soft-img-spin" />
        </span>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`soft-img-el${ready ? ' is-on' : ''}`}
        decoding="async"
        {...rest}
      />
    </span>
  )
}

export function SoftCrop({
  spec,
  label,
  className,
}: {
  spec: ThemeCrop
  label?: string
  className?: string
}) {
  const ready = useImageReady(spec.img)
  const style = {
    '--img': `url("${spec.img}")`,
    '--iw': spec.iw,
    '--ih': spec.ih,
    '--cx': spec.cx,
    '--cy': spec.cy,
    '--cw': spec.cw,
    '--ch': spec.ch,
  } as CSSProperties

  return (
    <div
      className={`crop soft-crop${ready ? ' is-ready' : ' is-wait'}${className ? ` ${className}` : ''}`}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {!ready ? (
        <span className="soft-img-shell" aria-hidden="true">
          <span className="soft-img-blur" />
          <span className="soft-img-spin" />
        </span>
      ) : null}
    </div>
  )
}
