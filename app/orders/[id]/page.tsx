import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ReorderButton } from '@/app/component/ReorderButton'
import { t } from '@/lib/i18n'
import { describeLine, money } from '@/lib/pricing'
import { getPageData } from '@/lib/session'

type Props = { params: Promise<{ id: string }> }

export default function OrderPage(props: Props) {
  return (
    <Suspense fallback={<p className="p-4 text-red-500">…</p>}>
      <OrderContent {...props} />
    </Suspense>
  )
}

async function OrderContent({ params }: Props) {
  const [{ id }, { db, lang, user }] = await Promise.all([params, getPageData()])
  const order = db.orders.find((item) => item.id === id)
  if (!order) notFound()
  const staff = user && user.role !== 'customer'
  if (order.userId && order.userId !== user?.id && !staff) {
    return <p className="p-4 text-red-500">{t(lang, 'notYourOrder')}</p>
  }
  const location = db.locations.find((item) => item.id === order.locationId)

  return (
    <div className="flex flex-col gap-4 p-4 text-red-500 lg:px-20 xl:px-40">
      <p className="text-sm uppercase">{t(lang, 'orderConfirmed')}</p>
      <h1 className="text-4xl font-bold">{order.number}</h1>
      <p>
        {t(lang, 'track')}: <strong>{t(lang, `status_${order.status}`)}</strong>
      </p>
      <p>{t(lang, 'confirmationHelp')}</p>
      <p>
        {t(lang, 'eta')}: {order.etaMinutes} {t(lang, 'minutes')}
      </p>
      <p>
        {order.fulfillment === 'delivery' ? t(lang, 'deliverTo') : t(lang, 'pickupAt')} {location?.name}. {order.address || location?.address}{' '}
        {order.zone}
      </p>
      <p>
        {t(lang, 'requested')}: {order.requestedTime.replace('T', ' ')}
      </p>
      <p>
        {order.paymentStatus === 'paid' ? t(lang, 'paymentPaid') : t(lang, 'paymentDue')}
        {order.cardLast4 ? ` · ${t(lang, 'last4', { last4: order.cardLast4 })}` : ''}
      </p>
      <ul className="flex flex-col gap-2">
        {order.items.map((item, index) => (
          <li key={`${item.dishId}-${index}`}>
            {item.quantity} × {item.title} — {money(item.unitPrice * item.quantity)}
            <span className="block text-sm">{describeLine(item, lang)}</span>
          </li>
        ))}
      </ul>
      <p className="flex justify-between"><span>{t(lang, 'subtotal')}</span><span>{money(order.subtotal)}</span></p>
      <p className="flex justify-between"><span>{t(lang, 'discount')}</span><span>-{money(order.discount)}</span></p>
      <p className="flex justify-between"><span>{t(lang, 'fee')}</span><span>{order.deliveryFee === 0 ? t(lang, 'free') : money(order.deliveryFee)}</span></p>
      <p className="flex justify-between"><span>{t(lang, 'tax')}</span><span>{money(order.tax)}</span></p>
      <p className="flex justify-between text-xl font-bold"><span>{t(lang, 'total')}</span><span>{money(order.total)}</span></p>
      {order.promoCode ? <p>{t(lang, 'code')}: {order.promoCode}</p> : null}
      <ReorderButton items={order.items} lang={lang} />
      <section>
        <h2 className="text-xl font-bold">{t(lang, 'notices')}</h2>
        <p className="text-sm">{t(lang, 'noticesNote')}</p>
        <ul className="mt-2 flex flex-col gap-2">
          {order.notices.map((notice) => (
            <li key={notice.id} className="rounded-md bg-fuchsia-50 p-3">
              <p className="font-bold">
                {notice.channel === 'email' ? t(lang, 'channelEmail') : t(lang, 'channelSms')} · {notice.to}
              </p>
              <p>{notice.body}</p>
            </li>
          ))}
        </ul>
      </section>
      <Link className="underline" href="/orders">
        {t(lang, 'ordersLink')}
      </Link>
    </div>
  )
}
