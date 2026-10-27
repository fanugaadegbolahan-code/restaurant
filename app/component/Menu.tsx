'use client'

import Link from 'next/link'
import { useState } from 'react'
import { logout } from '@/lib/actions'
import { t, type Lang } from '@/lib/i18n'
import type { SessionUser } from '@/lib/types'

const Menu = ({ lang, user }: { lang: Lang; user: SessionUser | null }) => {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const links = [
    { href: '/', label: t(lang, 'navHome') },
    { href: '/menu', label: t(lang, 'navMenu') },
    { href: '/reservations', label: t(lang, 'navReserve') },
    { href: '/contact', label: t(lang, 'navContact') },
    { href: '/cart', label: t(lang, 'navCart') },
  ]

  return (
    <div>
      <button
        type="button"
        aria-label={open ? t(lang, 'close') : t(lang, 'navMenu')}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="flex h-9 w-9 items-center justify-center"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open ? (
        <nav id="mobile-menu" aria-label="Mobile navigation" className="fixed inset-0 z-50 flex flex-col bg-[#1a1411] px-6 py-5 text-[#f6f1ea]">
          <button type="button" className="flex h-9 w-9 items-center justify-center" aria-label={t(lang, 'close')} onClick={close}>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <ul className="m-0 flex flex-1 list-none flex-col items-center justify-center gap-5 overflow-y-auto p-0 font-[family-name:var(--font-display)] text-4xl">
            {links.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={close}>
                  {item.label}
                </Link>
              </li>
            ))}
            {user ? (
              <>
                <li>
                  <Link href="/orders" onClick={close}>
                    {t(lang, 'navOrders')}
                  </Link>
                </li>
                <li>
                  <Link href="/account" onClick={close}>
                    {t(lang, 'navAccount')}
                  </Link>
                </li>
                {user.role !== 'customer' ? (
                  <li>
                    <Link href="/admin" onClick={close}>
                      {t(lang, 'navAdmin')}
                    </Link>
                  </li>
                ) : null}
              </>
            ) : (
              <li>
                <Link href="/login" onClick={close}>
                  {t(lang, 'navLogin')}
                </Link>
              </li>
            )}
            {user ? (
              <li>
                <form action={logout}>
                  <button type="submit" className="uppercase">
                    {t(lang, 'navLogout')}
                  </button>
                </form>
              </li>
            ) : null}
          </ul>
        </nav>
      ) : null}
    </div>
  )
}

export default Menu
