'use client'

import Link from 'next/link'
import { t, type Lang } from '@/lib/i18n'
import { useCart } from '../cart-context'

const Carticon = ({ lang }: { lang: Lang }) => {
  const { count } = useCart()
  return (
    <Link href="/cart" aria-label={`${t(lang, 'navCart')} (${count})`} className="flex items-center gap-2 text-[0.68rem] uppercase">
      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.6L22 7H6" />
        <circle cx="10" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
      </svg>
      <span className="hidden md:inline" aria-hidden="true">
        {t(lang, 'navCart')} ({count})
      </span>
    </Link>
  )
}

export default Carticon
