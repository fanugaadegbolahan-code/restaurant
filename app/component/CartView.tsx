'use client'

import Image from 'next/image'
import Link from 'next/link'
import { t, type Lang } from '@/lib/i18n'
import { describeLine, money, unitPrice } from '@/lib/pricing'
import type { Dish } from '@/lib/types'
import { useCart } from '../cart-context'

export function CartView({ dishes, lang }: { dishes: Dish[]; lang: Lang }) {
  const { items, ready, updateQty, removeItem } = useCart()

  if (!ready) return <p className="p-4 text-red-500">{t(lang, 'cartTitle')}</p>
  if (items.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-start justify-center gap-4 p-4 text-red-500 lg:px-20">
        <h1 className="text-5xl">{t(lang, 'cartTitle')}</h1>
        <p>{t(lang, 'cartEmpty')}</p>
        <Link className="rounded-md bg-red-500 px-4 py-3 text-white" href="/menu">
          {t(lang, 'browseMenu')}
        </Link>
      </div>
    )
  }

  const rows = items.map((item) => {
    const dish = dishes.find((entry) => entry.id === item.dishId)
    const price = dish && !dish.soldOut ? unitPrice(dish, item.size, item.toppings) : null
    return { item, dish, price }
  })
  const subtotal = rows.reduce((sum, row) => sum + (row.price ?? 0) * row.item.quantity, 0)

  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col text-red-500 lg:flex-row">
      <div className="flex flex-col gap-6 px-4 py-12 md:px-10 lg:w-2/3">
        <h1 className="text-5xl">{t(lang, 'cartTitle')}</h1>
        {rows.map(({ item, dish, price }) => (
          <div key={item.lineId} className="flex flex-col gap-3 border-b border-red-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Image src={item.img || dish?.img || '/pizza%20A.jpg'} alt="" width={80} height={80} className="h-20 w-20 object-contain" />
              <div>
                <h2 className="text-3xl">{item.title}</h2>
                <p>{describeLine(item, lang)}</p>
                {price === null ? <p>{t(lang, dish?.soldOut ? 'soldOut' : 'productMissing')}</p> : <p>{money(price)}</p>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3" aria-label={t(lang, 'changeQty')}>
                <button type="button" aria-label={t(lang, 'decrease')} onClick={() => updateQty(item.lineId, item.quantity - 1)}>
                  −
                </button>
                <span>{item.quantity}</span>
                <button type="button" aria-label={t(lang, 'increase')} onClick={() => updateQty(item.lineId, item.quantity + 1)}>
                  +
                </button>
              </div>
              <p className="min-w-20 font-bold">{price === null ? '—' : money(price * item.quantity)}</p>
              <button type="button" aria-label={t(lang, 'removeLine', { name: item.title })} onClick={() => removeItem(item.lineId)}>
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
      <aside className="flex flex-col gap-4 border-t border-[#e6d8c8] bg-[#fffdf9] p-6 lg:w-1/3 lg:border-t-0 lg:border-l">
        <div className="flex justify-between">
          <span>{t(lang, 'subtotal')}</span>
          <span>{money(subtotal)}</span>
        </div>
        <p className="text-sm">{t(lang, 'includeTax', { rate: '7.5' })}</p>
        <Link className="rounded-md bg-red-500 px-4 py-3 text-center text-white" href="/checkout">
          {t(lang, 'goCheckout')}
        </Link>
      </aside>
    </div>
  )
}
