import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { t } from '@/lib/i18n'
import { money } from '@/lib/pricing'
import { getPageData } from '@/lib/session'

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="p-4 text-red-500">…</p>}>
      <OrdersContent />
    </Suspense>
  )
}

async function OrdersContent() {
  const { db, lang, user } = await getPageData()
  if (!user) redirect('/login?next=/orders')
  const staff = user.role !== 'customer'
  const orders = (staff ? db.orders : db.orders.filter((order) => order.userId === user.id)).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="p-4 text-red-500 lg:px-20 xl:px-40">
      <h1 className="mb-4 text-5xl">{t(lang, 'ordersHeading')}</h1>
      {staff ? <p className="mb-4">{t(lang, 'staffSeeAll')}</p> : null}
      {orders.length === 0 ? <p>{t(lang, 'noOrders')}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-3 text-left">
          <thead>
            <tr>
              <th>{t(lang, 'idLabel')}</th>
              <th>{t(lang, 'dateLabel')}</th>
              <th>{t(lang, 'priceLabel')}</th>
              <th className="hidden md:table-cell">{t(lang, 'products')}</th>
              <th>{t(lang, 'status')}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-[#e6d8c8]">
                <td className="px-1 py-4">
                  <Link className="underline" href={`/orders/${order.id}`}>
                    {order.number}
                  </Link>
                </td>
                <td className="px-1 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="px-1 py-4">{money(order.total)}</td>
                <td className="hidden px-1 py-4 md:table-cell">
                  {order.items.map((item) => `${item.title} (${item.quantity})`).join(', ')}
                </td>
                <td className="px-1 py-4">{t(lang, `status_${order.status}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
