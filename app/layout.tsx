import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Oswald } from 'next/font/google'
import { PwaRegister } from '@/components/pwa-register'
import './globals.css'

const condensed = Oswald({
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '600', '700'],
  variable: '--font-condensed',
})
const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-body' })

export const metadata: Metadata = {
  title: 'BOX·BOX — личный календарь Формулы 1',
  description:
    'Создавай свой календарь Формулы 1: этапы, даты, места и спринт-уикенды в стиле Oracle Red Bull Racing.',
  applicationName: 'BOX·BOX',
  generator: 'v0.app',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'BOX·BOX',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0a1033',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${condensed.variable} ${inter.variable} bg-background`} suppressHydrationWarning>
      <head>
        {/* Явно для iOS PWA: контент до физического низа экрана */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#0a1033" />
        <script
          dangerouslySetInnerHTML={{
            // iOS PWA: visualViewport/dvh exclude bottom safe-area; 100vh includes it.
            __html: `(function(){function iosPwa(){var n=window.navigator;var s=window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches||n.standalone===true;var ios=/iPad|iPhone|iPod/.test(n.userAgent)||(n.platform==='MacIntel'&&n.maxTouchPoints>1);return s&&ios;}function measure(){if(iosPwa()){var p=document.createElement('div');p.style.cssText='position:fixed;top:0;left:0;height:100vh;width:0;visibility:hidden;pointer-events:none';document.documentElement.appendChild(p);var h=p.offsetHeight;p.remove();return Math.round(h);}var vv=window.visualViewport;return Math.round((vv&&vv.height)||window.innerHeight);}function sync(){document.documentElement.style.setProperty('--app-height',measure()+'px');}sync();setTimeout(sync,50);setTimeout(sync,300);if(window.visualViewport){window.visualViewport.addEventListener('resize',sync);window.visualViewport.addEventListener('scroll',sync);}window.addEventListener('resize',sync);window.addEventListener('pageshow',sync);})();`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        <PwaRegister />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
