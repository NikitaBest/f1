'use client'

import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  )
}

export function PwaRegister() {
  useEffect(() => {
    if (isStandalone()) document.documentElement.classList.add('bb-pwa')

    if (!('serviceWorker' in navigator)) return

    let cancelled = false
    let refreshing = false

    const reloadOnce = () => {
      if (refreshing || cancelled) return
      refreshing = true
      window.location.reload()
    }

    const onControllerChange = () => reloadOnce()
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'BB_SW_UPDATED') reloadOnce()
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    navigator.serviceWorker.addEventListener('message', onMessage)

    const setup = async (reg: ServiceWorkerRegistration) => {
      const askSkip = () => reg.waiting?.postMessage('SKIP_WAITING')

      if (reg.waiting) askSkip()

      reg.addEventListener('updatefound', () => {
        const worker = reg.installing
        if (!worker) return
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) askSkip()
        })
      })

      const check = () => reg.update().catch(() => {})
      check()
      const timer = window.setInterval(check, 30_000)
      const onVisible = () => {
        if (document.visibilityState === 'visible') check()
      }
      window.addEventListener('focus', check)
      document.addEventListener('visibilitychange', onVisible)

      return () => {
        window.clearInterval(timer)
        window.removeEventListener('focus', check)
        document.removeEventListener('visibilitychange', onVisible)
      }
    }

    let cleanupUpdate: (() => void) | undefined

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then((reg) => setup(reg))
        .then((cleanup) => {
          if (cancelled) cleanup?.()
          else cleanupUpdate = cleanup
        })
        .catch(() => {})
    }

    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })

    return () => {
      cancelled = true
      cleanupUpdate?.()
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      navigator.serviceWorker.removeEventListener('message', onMessage)
    }
  }, [])

  return null
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (isStandalone()) setInstalled(true)

    const onPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferred(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = async () => {
    if (!deferred) return false
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    setDeferred(null)
    return outcome === 'accepted'
  }

  return { canInstall: Boolean(deferred) && !installed, installed, install }
}
