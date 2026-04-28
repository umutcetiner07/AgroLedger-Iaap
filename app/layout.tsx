import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'

const manrope = Manrope({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AgrOracle - Kazakhstan\'s AI-Powered Smart Farming Network',
  description: 'Kazakistan için geliştirilen AI destekli akıllı sulama ve tedarik zinciri finansmanı ekosistemi. Gerçek zamanlı su tasarrufu takibi ve anomali tespiti.',
  keywords: ['akıllı sulama', 'yapay zeka', 'su tasarrufu', 'tarım teknolojisi', 'Kazakistan', 'Smart Farming Network'],
  authors: [{ name: 'Umut Cetiner' }],
  openGraph: {
    title: 'AgrOracle - Kazakhstan\'s AI-Powered Smart Farming Network',
    description: 'Kazakistan tarımı için geliştirilen AI destekli sulama optimizasyonu platformu',
    url: 'https://kazakhagro.com',
    siteName: 'AgrOracle',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'AgrOracle Dashboard',
      },
    ],
    locale: 'tr_TR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={manrope.className}>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js')
              }
            `,
          }}
        />
      </body>
    </html>
  )
}