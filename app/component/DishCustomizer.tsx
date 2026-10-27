'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { t, type Lang } from '@/lib/i18n'
import { money, unitPrice } from '@/lib/pricing'
import type { Dish } from '@/lib/types'
import { useCart } from '../cart-context'

export function DishCustomizer({ dish, lang }: { dish: Dish; lang: Lang }) {
  const { addItem } = useCart()
  const [size, setSize] = useState(dish.sizes[0]?.title ?? '')
  const [toppings, setToppings] = useState<string[]>([])
  const [removed, setRemoved] = useState<string[]>([])
  const [instructions, setInstructions] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')

  const price = useMemo(() => unitPrice(dish, size, toppings), [dish, size, toppings])
  const total = price === null ? 0 : price * quantity

  function toggle(list: string[], value: string, setList: (next: string[]) => void) {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value])
  }

  if (dish.soldOut || price === null) {
    return <p className="rounded-md bg-red-100 px-3 py-2">{t(lang, 'soldOut')}</p>
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        addItem({
          dishId: dish.id,
          title: dish.title,
          img: dish.img,
          size,
          toppings,
          removed,
          instructions,
          quantity,
          unitPrice: price,
        })
        setNote(t(lang, 'added'))
      }}
    >
      <p className="text-2xl font-bold">
        {money(total)} <span className="text-base font-normal">({money(price)} {t(lang, 'each')})</span>
      </p>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-2 font-bold">{t(lang, 'chooseSize')}</legend>
        {dish.sizes.map((option) => (
          <label key={option.title} className={`cursor-pointer rounded-full px-4 py-2 ring-1 ring-[#d9cbb8] ${size === option.title ? 'bg-[#2c241f] text-[#f6f1ea]' : 'bg-[#fffdf9]'}`}>
            <input className="sr-only" type="radio" name="size" checked={size === option.title} onChange={() => setSize(option.title)} />
            {option.title}
            {option.additionalPrice > 0 ? ` +${money(option.additionalPrice)}` : ''}
          </label>
        ))}
      </fieldset>

      {dish.toppings.length > 0 && (
        <fieldset>
          <legend className="mb-2 font-bold">{t(lang, 'extras')}</legend>
          <div className="flex flex-col gap-2">
            {dish.toppings.map((option) => (
              <label key={option.title} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={toppings.includes(option.title)}
                  onChange={() => toggle(toppings, option.title, setToppings)}
                />
                <span>
                  {option.title} (+{money(option.price)})
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {dish.ingredients.length > 0 && (
        <fieldset>
          <legend className="mb-2 font-bold">{t(lang, 'without')}</legend>
          <div className="flex flex-col gap-2">
            {dish.ingredients.map((option) => (
              <label key={option} className="flex items-center gap-2">
                <input type="checkbox" checked={removed.includes(option)} onChange={() => toggle(removed, option, setRemoved)} />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <label className="flex flex-col gap-1">
        <span className="font-bold">{t(lang, 'note')}</span>
        <input className="field" maxLength={140} value={instructions} placeholder={t(lang, 'instructionsPlaceholder')} onChange={(event) => setInstructions(event.target.value)} />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center justify-between gap-4 border border-[#e6d8c8] bg-[#fffdf9] px-3 py-2">
          <span>{t(lang, 'quantity')}</span>
          <div className="flex items-center gap-3">
            <button type="button" aria-label={t(lang, 'decrease')} onClick={() => setQuantity((current) => Math.max(1, current - 1))}>
              −
            </button>
            <span>{quantity}</span>
            <button type="button" aria-label={t(lang, 'increase')} onClick={() => setQuantity((current) => Math.min(20, current + 1))}>
              +
            </button>
          </div>
        </div>
        <button type="submit" className="bg-red-500 px-4 py-3 uppercase text-white">
          {t(lang, 'addButton')}
        </button>
      </div>
      <p aria-live="polite" className="min-h-6">
        {note}{' '}
        {note ? (
          <Link className="underline" href="/cart">
            {t(lang, 'goCart')}
          </Link>
        ) : null}
      </p>
    </form>
  )
}
