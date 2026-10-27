import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Cormorant_Garamond, Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import NotificationPage from './component/notification'
import Navbar from './component/Navbar'
import Footer from './component/Footer'
import { HtmlLang, Providers } from './providers'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const display = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600'],
})

export const metadata: Metadata = {
  title: 'Massino',
  description: 'Order pizza, burgers, and pasta from Massino in Lagos. Pickup, delivery, and table reservations.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-[#fffdf9] focus:px-3 focus:py-2 focus:text-[#2c241f]"
        >
          Skip to content
        </a>
        <Providers>
          <HtmlLang />
          <Suspense fallback={<div className="h-10 w-full bg-[#1a1411]" />}>
            <NotificationPage />
          </Suspense>
          <Suspense fallback={<div className="h-20 border-b border-[#e6d8c8] md:h-32" />}>
            <Navbar />
          </Suspense>
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
