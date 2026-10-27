'use client'

import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { placeOrder } from '@/lib/actions'
import { t, type Lang } from '@/lib/i18n'
import { buildQuote, describeLine, explain, money } from '@/lib/pricing'
import type { Dish, Location, Promo, SessionUser, Settings } from '@/lib/types'
import { useCart } from '../cart-context'

export function CheckoutForm({
  lang,
  user,
  locations,
  initialLocationId,
  dishes,
  promos,
  settings,
  defaultTime,
  defaultPromo,
}: {
  lang: Lang
  user: SessionUser | null
  locations: Location[]
  initialLocationId: string
  dishes: Dish[]
  promos: Promo[]
  settings: Settings
  defaultTime: string
  defaultPromo: string
}) {
  const { items, clear } = useCart()
  const router = useRouter()
  const [locationId, setLocationId] = useState(initialLocationId)
  const location = locations.find((item) => item.id === locationId) ?? locations[0]
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('delivery')
  const [zone, setZone] = useState(location.zones[0]?.name ?? '')
  const [payment, setPayment] = useState<'card' | 'cash_delivery' | 'cash_pickup'>('card')
  const [promo, setPromo] = useState(defaultPromo)
  const [points, setPoints] = useState(0)
  const [useStamp, setUseStamp] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const lines = items.map(({ dishId, size, toppings, removed, instructions, quantity }) => ({
    dishId,
    size,
    toppings,
    removed,
    instructions,
    quantity,
  }))
  const trimmedPromo = promo.trim().toUpperCase()
  const promoMatches = trimmedPromo === '' || promos.some((item) => item.code.toUpperCase() === trimmedPromo)

  const quote = useMemo(
    () =>
      buildQuote({
        lines,
        dishes,
        settings,
        location,
        promos,
        fulfillment,
        zone,
        promoCode: promoMatches ? promo : '',
        redeemPoints: points,
        useStamp,
        pointsAvailable: user?.points ?? 0,
        stampsAvailable: user?.stamps ?? 0,
        isLoggedIn: Boolean(user),
      }),
    [dishes, fulfillment, lines, location, points, promo, promoMatches, promos, settings, useStamp, user, zone],
  )

  function chooseFulfillment(next: 'pickup' | 'delivery') {
    setFulfillment(next)
    setPayment((current) => (current === 'card' ? 'card' : next === 'delivery' ? 'cash_delivery' : 'cash_pickup'))
  }

  function chooseLocation(nextId: string) {
    const next = locations.find((item) => item.id === nextId)
    setLocationId(nextId)
    if (next && !next.zones.some((item) => item.name === zone)) setZone(next.zones[0]?.name ?? '')
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!quote.ok) {
      setError(explain(lang, quote.code, quote.detail))
      return
    }
    setPending(true)
    setError('')
    const formData = new FormData(event.currentTarget)
    formData.set('cart', JSON.stringify(lines))
    formData.set('fulfillment', fulfillment)
    formData.set('locationId', location.id)
    formData.set('zone', zone)
    formData.set('paymentMethod', payment)
    formData.set('promo', promo)
    formData.set('redeemPoints', String(points))
    if (useStamp) formData.set('useStamp', 'on')
    const result = await placeOrder(formData)
    if (!result.ok) {
      setError(explain(lang, result.code, result.detail))
      setPending(false)
      return
    }
    clear()
    router.push(`/orders/${result.orderId}`)
  }

  if (items.length === 0) {
    return (
      <div className="p-4 text-red-500 lg:px-20">
        <h1 className="text-5xl">{t(lang, 'checkout')}</h1>
        <p className="mt-4">{t(lang, 'cartEmpty')}</p>
        <Link className="mt-4 inline-block underline" href="/menu">
          {t(lang, 'browseMenu')}
        </Link>
      </div>
    )
  }

  const activeZone = location.zones.find((item) => item.name === zone)

  return (
    <form onSubmit={onSubmit} className="grid gap-6 p-4 text-red-500 lg:grid-cols-[2fr_1fr] lg:px-20 xl:px-40">
      <div className="flex flex-col gap-5">
        <h1 className="text-5xl">{t(lang, 'checkout')}</h1>
        {!user ? (
          <p>
            {t(lang, 'guestCheckout')}{' '}
            <Link className="underline" href="/login?next=/checkout">
              {t(lang, 'loginLink')}
            </Link>
          </p>
        ) : (
          <p>{t(lang, 'welcomeName', { name: user.name })}</p>
        )}

        <fieldset className="flex flex-col gap-2">
          <legend className="font-bold">{t(lang, 'fulfillment')}</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="fulfillment-ui" checked={fulfillment === 'pickup'} onChange={() => chooseFulfillment('pickup')} />
            {t(lang, 'pickup')}
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="fulfillment-ui" checked={fulfillment === 'delivery'} onChange={() => chooseFulfillment('delivery')} />
            {t(lang, 'deliveryOption')}
          </label>
        </fieldset>

        <label className="flex flex-col gap-1">
          {t(lang, 'whichLocation')}
          <select className="field" value={location.id} onChange={(event) => chooseLocation(event.target.value)}>
            {locations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm">
          {t(lang, 'rulesBody', {
            min: money(settings.minDeliverySubtotal),
            fee: money(settings.deliveryFee),
            free: money(settings.freeDeliveryOver),
            miles: location.deliveryRadiusMiles,
          })}
        </p>

        {fulfillment === 'delivery' ? (
          <>
            <label className="flex flex-col gap-1">
              {t(lang, 'zoneLabel')}
              <select className="field" value={zone} onChange={(event) => setZone(event.target.value)} required>
                {location.zones.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name} · {item.miles} mi · {item.minutes} {t(lang, 'minutes')}
                  </option>
                ))}
              </select>
            </label>
            {user && user.addresses.length > 0 ? (
              <label className="flex flex-col gap-1">
                {t(lang, 'useAddress')}
                <select
                  className="field"
                  defaultValue=""
                  onChange={(event) => {
                    const selected = user.addresses.find((item) => item.id === event.target.value)
                    if (!selected) return
                    const addressInput = document.getElementById('address') as HTMLInputElement | null
                    if (addressInput) addressInput.value = selected.line
                    if (location.zones.some((item) => item.name === selected.zone)) setZone(selected.zone)
                  }}
                >
                  <option value="">{t(lang, 'chooseArea')}</option>
                  {user.addresses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label} — {item.line}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="flex flex-col gap-1" htmlFor="address">
              {t(lang, 'address')}
              <input id="address" className="field" name="address" required defaultValue={user?.addresses[0]?.line ?? ''} autoComplete="street-address" />
            </label>
          </>
        ) : (
          <p>
            {t(lang, 'pickupAt')} {location.name}, {location.address}. {t(lang, 'pickupReady')}
          </p>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            {t(lang, 'nameOnOrder')}
            <input className="field" name="name" required defaultValue={user?.name ?? ''} autoComplete="name" />
          </label>
          <label className="flex flex-col gap-1">
            {t(lang, 'phoneOnOrder')}
            <input className="field" name="phone" type="tel" required defaultValue={user?.phone ?? ''} autoComplete="tel" />
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            {t(lang, 'emailOnOrder')}
            <input className="field" name="email" type="email" required defaultValue={user?.email ?? ''} autoComplete="email" />
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            {t(lang, 'when')}
            <input className="field" name="requestedTime" type="datetime-local" required defaultValue={defaultTime} />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          {t(lang, 'promo')}
          <input className="field" value={promo} onChange={(event) => setPromo(event.target.value)} placeholder={t(lang, 'enterPromo')} />
        </label>
        <p className="text-sm">{t(lang, 'homepageCode', { code: 'FRYSIDE' })}</p>

        {user ? (
          <div className="flex flex-col gap-2 rounded-md bg-fuchsia-50 p-3">
            <p>{t(lang, 'currentPoints', { count: user.points })}</p>
            <p>{t(lang, 'currentStamps', { count: user.stamps })}</p>
            <label className="flex flex-col gap-1">
              {t(lang, 'pointsToUse')}
              <input className="field" type="number" min={0} step={settings.redeemPointsPerDollar} value={points} onChange={(event) => setPoints(Number(event.target.value))} />
            </label>
            <p className="text-sm">{t(lang, 'redeemHint')}</p>
            {user.stamps >= settings.stampGoal ? (
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={useStamp} onChange={(event) => setUseStamp(event.target.checked)} />
                {t(lang, 'useStamp', { amount: String(settings.stampReward) })}
              </label>
            ) : null}
          </div>
        ) : null}

        <fieldset className="flex flex-col gap-2">
          <legend className="font-bold">{t(lang, 'payWith')}</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="pay-ui" checked={payment === 'card'} onChange={() => setPayment('card')} />
            {t(lang, 'card')}
          </label>
          {fulfillment === 'delivery' ? (
            <label className="flex items-center gap-2">
              <input type="radio" name="pay-ui" checked={payment === 'cash_delivery'} onChange={() => setPayment('cash_delivery')} />
              {t(lang, 'cashDelivery')}
            </label>
          ) : (
            <label className="flex items-center gap-2">
              <input type="radio" name="pay-ui" checked={payment === 'cash_pickup'} onChange={() => setPayment('cash_pickup')} />
              {t(lang, 'cashPickup')}
            </label>
          )}
        </fieldset>

        {payment === 'card' ? (
          <div className="grid gap-3 md:grid-cols-2">
            <p className="md:col-span-2 text-sm">{t(lang, 'demoPay')}</p>
            <label className="flex flex-col gap-1 md:col-span-2">
              {t(lang, 'cardName')}
              <input className="field" name="cardName" autoComplete="cc-name" required />
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              {t(lang, 'cardNumber')}
              <input className="field" name="cardNumber" inputMode="numeric" autoComplete="cc-number" required placeholder="4242 4242 4242 4242" />
            </label>
            <label className="flex flex-col gap-1">
              {t(lang, 'expiry')}
              <input className="field" name="expiry" autoComplete="cc-exp" required placeholder="12/28" />
            </label>
            <label className="flex flex-col gap-1">
              {t(lang, 'cvc')}
              <input className="field" name="cvc" inputMode="numeric" autoComplete="cc-csc" required placeholder="123" />
            </label>
          </div>
        ) : (
          <p>{t(lang, 'cashLater')}</p>
        )}

        {error || !quote.ok || !promoMatches ? (
          <p role="alert" className="rounded-md bg-red-100 px-3 py-2">
            {error || (!promoMatches ? explain(lang, 'promo') : !quote.ok ? explain(lang, quote.code, quote.detail) : '')}
          </p>
        ) : null}
        <button type="submit" disabled={pending || !quote.ok || !promoMatches} className="rounded-md bg-red-500 px-4 py-3 text-white disabled:opacity-60">
          {pending ? t(lang, 'processing') : t(lang, 'placeOrder')}
        </button>
        <p className="text-sm">{t(lang, 'placeHint')}</p>
      </div>

      <aside className="flex h-fit flex-col gap-3 border border-[#e6d8c8] bg-[#fffdf9] p-6">
        <h2 className="text-xl font-bold">{t(lang, 'summaryTitle')}</h2>
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.lineId}>
              {item.quantity} × {item.title}
              <span className="block text-sm">{describeLine(item, lang)}</span>
            </li>
          ))}
        </ul>
        {quote.ok ? (
          <>
            <p className="flex justify-between"><span>{t(lang, 'subtotal')}</span><span>{money(quote.subtotal)}</span></p>
            {quote.promoDiscount > 0 ? <p className="flex justify-between"><span>{t(lang, 'promoOff')}</span><span>-{money(quote.promoDiscount)}</span></p> : null}
            {quote.pointsDiscount > 0 ? <p className="flex justify-between"><span>{t(lang, 'pointsOff')}</span><span>-{money(quote.pointsDiscount)}</span></p> : null}
            {quote.stampDiscount > 0 ? <p className="flex justify-between"><span>{t(lang, 'stampOff')}</span><span>-{money(quote.stampDiscount)}</span></p> : null}
            <p className="flex justify-between"><span>{t(lang, 'fee')}</span><span>{quote.deliveryFee === 0 ? t(lang, 'free') : money(quote.deliveryFee)}</span></p>
            <p className="flex justify-between"><span>{t(lang, 'tax')}</span><span>{money(quote.tax)}</span></p>
            <p className="flex justify-between text-lg font-bold"><span>{t(lang, 'totalDue')}</span><span>{money(quote.total)}</span></p>
            <p>{t(lang, 'estimated', { minutes: fulfillment === 'delivery' ? activeZone?.minutes ?? quote.etaMinutes : settings.pickupMinutes })}</p>
          </>
        ) : (
          <p>{explain(lang, quote.code, quote.detail)}</p>
        )}
      </aside>
    </form>
  )
}
