'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { CartProvider } from './cart-context'

export function Providers({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>
}

export function HtmlLang() {
  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )massimo_lang=([^;]+)/)
    document.documentElement.lang = match?.[1] === 'it' ? 'it' : 'en'
  }, [])
  return null
}
