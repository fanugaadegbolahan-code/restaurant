'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { t, type Lang } from '@/lib/i18n'
import { money } from '@/lib/pricing'
import type { Dish } from '@/lib/types'

type PriceBand = 'any' | 'under' | 'mid' | 'over'

export function MenuBrowser({
  dishes,
  lang,
  initialQuery = '',
}: {
  dishes: Dish[]
  lang: Lang
  initialQuery?: string
}) {
  const [query, setQuery] = useState(initialQuery)
  const [vegetarian, setVegetarian] = useState(false)
  const [spicy, setSpicy] = useState(false)
  const [popular, setPopular] = useState(false)
  const [band, setBand] = useState<PriceBand>('any')

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return dishes.filter((dish) => {
      if (needle && !`${dish.title} ${dish.desc}`.toLowerCase().includes(needle)) return false
      if (vegetarian && !dish.vegetarian) return false
      if (spicy && !dish.spicy) return false
      if (popular && !dish.popular) return false
      if (band === 'under' && dish.price >= 20) return false
      if (band === 'mid' && (dish.price < 20 || dish.price > 30)) return false
      if (band === 'over' && dish.price <= 30) return false
      return true
    })
  }, [band, dishes, popular, query, spicy, vegetarian])

  return (
    <div className="flex flex-col gap-6 p-4 text-red-500 lg:px-20 xl:px-40">
      <form
        className="grid gap-4 border border-[#e6d8c8] bg-[#fffdf9] p-5 md:grid-cols-2"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="font-bold">{t(lang, 'searchLabel')}</span>
          <input className="field" value={query} placeholder={t(lang, 'searchPlaceholder')} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <fieldset>
          <legend className="mb-2 text-[0.68rem] uppercase tracking-[0.16em] text-[#8a7352]">{t(lang, 'filters')}</legend>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={vegetarian} onChange={(event) => setVegetarian(event.target.checked)} />
              {t(lang, 'vegOnly')}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={spicy} onChange={(event) => setSpicy(event.target.checked)} />
              {t(lang, 'spicyOnly')}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={popular} onChange={(event) => setPopular(event.target.checked)} />
              {t(lang, 'popularOnly')}
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-[0.68rem] uppercase tracking-[0.16em] text-[#8a7352]">{t(lang, 'filterPrice')}</legend>
          <div className="flex flex-col gap-2">
            {(['any', 'under', 'mid', 'over'] as PriceBand[]).map((option) => (
              <label key={option} className="flex items-center gap-2">
                <input type="radio" name="price" checked={band === option} onChange={() => setBand(option)} />
                {t(lang, option === 'any' ? 'any' : option)}
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="button"
          className="justify-self-start underline"
          onClick={() => {
            setQuery('')
            setVegetarian(false)
            setSpicy(false)
            setPopular(false)
            setBand('any')
          }}
        >
          {t(lang, 'clearFilters')}
        </button>
      </form>

      <p>{t(lang, 'resultCount', { count: visible.length })}</p>
      {visible.length === 0 ? <p>{t(lang, 'noDishes')}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((dish) => (
          <Link key={dish.id} href={`/product/${dish.id}`} className="flex flex-col gap-3 border border-[#e6d8c8] bg-[#fffdf9] p-5 transition-colors hover:border-[#b08958]">
            <div className="relative h-56 w-full">
              <Image src={dish.img} alt={dish.title} fill className="object-contain" sizes="(max-width: 768px) 100vw, 33vw" />
            </div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-3xl">{dish.title}</h2>
              <p className="pt-2 text-sm tracking-[0.12em] text-[#6d6258]">{money(dish.price)}</p>
            </div>
            <p>{dish.desc}</p>
            <p className="flex flex-wrap gap-2 text-sm">
              {dish.vegetarian ? <span className="rounded-full bg-green-100 px-2 py-1 text-green-800">{t(lang, 'vegetarian')}</span> : null}
              {dish.spicy ? <span className="rounded-full bg-orange-100 px-2 py-1 text-orange-800">{t(lang, 'spicy')}</span> : null}
              {dish.popular ? <span className="rounded-full bg-red-100 px-2 py-1">{t(lang, 'popular')}</span> : null}
              {dish.soldOut ? <span className="rounded-full bg-gray-200 px-2 py-1 text-gray-700">{t(lang, 'soldOutBadge')}</span> : null}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
