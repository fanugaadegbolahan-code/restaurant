import { Suspense } from 'react'
import Link from 'next/link'
import { getPageData } from '@/lib/session'
import { t } from '@/lib/i18n'

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="h-40" />}>
      <MenuContent />
    </Suspense>
  )
}

async function MenuContent() {
  const { db, lang } = await getPageData()
  return (
    <div className="flex flex-col">
      <form action="/menu/all" className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="menu-search">
          {t(lang, 'searchLabel')}
        </label>
        <input id="menu-search" className="field" name="q" placeholder={t(lang, 'searchPlaceholder')} />
        <button type="submit" className="rounded-md bg-red-500 px-4 py-2 text-white">
          {t(lang, 'menuSearch')}
        </button>
        <Link href="/menu/all" className="self-center underline">
          {t(lang, 'allDishes')}
        </Link>
      </form>
      <div className="grid min-h-[70vh] md:grid-cols-3">
        {db.categories.map((category) => (
          <Link
            href={`/menu/${category.slug}`}
            key={category.id}
            className="group relative flex min-h-72 flex-col items-center justify-center gap-4 overflow-hidden bg-cover bg-center p-10 text-[#f6f1ea]"
            style={{ backgroundImage: `url("${category.img}")` }}
          >
            <span className="absolute inset-0 bg-[#1a1411]/55 transition-colors group-hover:bg-[#1a1411]/40" />
            <span className="relative flex flex-col items-center gap-3 text-center">
              <h1 className="text-5xl text-[#f6f1ea]">{category.title}</h1>
              <p className="max-w-xs text-sm leading-6 text-[#f3e7d6]">{category.desc}</p>
              <span className="mt-2 rounded-full bg-[#f6f1ea] px-5 py-3 text-[0.72rem] uppercase tracking-[0.16em] text-[#1a1411]">{t(lang, 'explore')}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
