'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { t, type Lang } from '@/lib/i18n'
import { describeLine } from '@/lib/pricing'
import type { OrderItem } from '@/lib/types'
import { useCart } from '../cart-context'

export function ReorderButton({ items, lang }: { items: OrderItem[]; lang: Lang }) {
  const { addItem } = useCart()
  const router = useRouter()
  const [note, setNote] = useState('')

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className="rounded-md bg-red-500 px-4 py-3 text-white"
        onClick={() => {
          items.forEach((item) => {
            addItem({
              dishId: item.dishId,
              title: item.title,
              img: item.img,
              size: item.size,
              toppings: item.toppings,
              removed: item.removed,
              instructions: item.instructions,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })
          })
          setNote(t(lang, 'reordered'))
          router.push('/cart')
        }}
      >
        {t(lang, 'reorder')}
      </button>
      <p className="sr-only" aria-live="polite">
        {note || items.map((item) => describeLine(item, lang)).join(', ')}
      </p>
    </div>
  )
}
