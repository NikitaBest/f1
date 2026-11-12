import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Fira_Sans_Extra_Condensed, Inter } from 'next/font/google'
import './globals.css'

const condensed = Fira_Sans_Extra_Condensed({
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '600', '700', '800', '900'],
  variable: '--font-condensed',
})
const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-body' })

export const metadata: Metadata = {
  title: 'BOX·BOX — личный календарь Формулы 1',
  description:
    'Создавай свой календарь Формулы 1: этапы, даты, места, спринт-уикенды и напоминания о сессиях в стиле Oracle Red Bull Racing.',
  generator: 'v0.app',
  appleWebApp: { capable: true, title: 'BOX·BOX', statusBarStyle: 'black-translucent' },
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#070A24',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${condensed.variable} ${inter.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
