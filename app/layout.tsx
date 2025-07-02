import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { QueryProvider } from '@/lib/query-provider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Unheard Radio - Discover Obscure Underground Radio Stations Worldwide',
  description: 'Anti-algorithm radio discovery platform. Find the world\'s most obscure, underground radio stations with zero listeners. Stream live broadcasts from forgotten corners of the globe.',
  keywords: 'radio, obscure radio, underground radio, radio discovery, live radio, streaming radio, zero listeners, anti-algorithm, radio browser, global radio, experimental radio, rare radio stations',
  authors: [{ name: 'Z13labs' }],
  creator: 'Z13labs',
  publisher: 'Unheard Radio',
  category: 'Music & Audio',
  robots: 'index, follow',
  openGraph: {
    title: 'Unheard Radio - Discover Obscure Radio Stations',
    description: 'Your portal to the strange side of sound. Stream live radio from the world\'s most overlooked stations.',
    url: 'https://unheardradio.io',
    siteName: 'Unheard Radio',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Unheard Radio - Discover Obscure Radio Stations',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unheard Radio - Discover Obscure Radio Stations',
    description: 'Anti-algorithm radio discovery. Find stations with zero listeners.',
    creator: '@z13labs',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-black text-vdu-green antialiased`}>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  )
}