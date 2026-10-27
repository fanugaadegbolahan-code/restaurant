'use client'

import { useState } from 'react'
import Link from 'next/link'
import { t, type Lang } from '@/lib/i18n'
import { unitPrice } from '@/lib/pricing'
import type { Dish } from '@/lib/types'
import { useCart } from '../cart-context'

export function AddToCart({ dish, lang }: { dish: Dish; lang: Lang }) {
  const { addItem } = useCart()
  const [note, setNote] = useState('')
  const size = dish.sizes[0]?.title ?? ''
  const price = unitPrice(dish, size, [])

  if (dish.soldOut || price === null) {
    return <p className="rounded-md bg-red-100 px-3 py-2 text-sm">{t(lang, 'soldOut')}</p>
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        className="rounded-md bg-red-500 px-4 py-2 text-white"
        onClick={() => {
          addItem({
            dishId: dish.id,
            title: dish.title,
            img: dish.img,
            size,
            toppings: [],
            removed: [],
            instructions: '',
            quantity: 1,
            unitPrice: price,
          })
          setNote(t(lang, 'added'))
        }}
      >
        {t(lang, 'addToCart')}
      </button>
      <p aria-live="polite" className="min-h-5 text-sm">
        {note}
      </p>
    </div>
  )
}
