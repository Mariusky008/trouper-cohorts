import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Kudos — Ton identité de confiance',
  description: 'Construis ta réputation humaine avec les personnes qui te connaissent vraiment.',
  manifest: '/kudos-manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Kudos' },
  openGraph: {
    title: 'Kudos',
    description: 'Ton identité de confiance, vue par ceux qui te connaissent.',
    images: ['/og-kudos.png'],
  },
}

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function KudosLayout({ children }: { children: ReactNode }) {
  return (
    <div className="kudos-root">
      {children}
    </div>
  )
}
