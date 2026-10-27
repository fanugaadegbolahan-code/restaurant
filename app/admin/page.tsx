import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { saveDish, toggleSoldOut, updateOrderStatus, updateReservation } from '@/lib/actions'
import { t } from '@/lib/i18n'
import { money } from '@/lib/pricing'
import { menuImages } from '@/lib/seed'
import { getPageData } from '@/lib/session'
import type { Dish, Order, OrderStatus, ReservationStatus, Role } from '@/lib/types'

const orderChoices: Record<Role, OrderStatus[]> = {
  customer: [],
  kitchen: ['preparing', 'ready'],
  front: ['received', 'on_the_way', 'completed', 'cancelled'],
  admin: ['received', 'preparing', 'ready', 'on_the_way', 'completed', 'cancelled'],
}

const reservationChoices: ReservationStatus[] = ['requested', 'confirmed', 'seated', 'cancelled']

export default function AdminPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  return (
    <Suspense fallback={<p className="p-4 text-red-500">…</p>}>
      <AdminContent searchParams={searchParams} />
    </Suspense>
  )
}

async function AdminContent({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [query, { db, lang, user }] = await Promise.all([searchParams, getPageData()])
  if (!user) redirect('/login?next=/admin')
  if (user.role === 'customer') redirect('/')
  const canMenu = user.role === 'admin'
  const canFront = user.role === 'admin' || user.role === 'front'
  const orders = db.orders.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="flex flex-col gap-10 p-4 text-red-500 lg:px-20 xl:px-40">
      <header>
        <h1 className="text-5xl">{t(lang, 'adminTitle')}</h1>
        <p className="mt-2">{t(lang, 'adminNote')}</p>
        <p className="mt-1">
          {user.name} · {t(lang, `role_${user.role}`)}
        </p>
        {query.saved ? <p role="status">{t(lang, 'savedOk')}</p> : null}
        {query.error ? <p role="alert">{t(lang, 'errorForm')}</p> : null}
      </header>

      <section>
        <h2 className="text-2xl font-bold">{t(lang, 'adminOrders')}</h2>
        <ul className="mt-4 flex flex-col gap-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-md border border-red-200 p-3">
              <p className="font-bold">
                {order.number} · {money(order.total)} · {t(lang, `status_${order.status}`)}
              </p>
              <p>
                {order.customerName} · {order.fulfillment} · {order.locationId} · {order.paymentMethod}
              </p>
              <p>{order.items.map((item) => `${item.quantity}× ${item.title}`).join(', ')}</p>
              <form action={updateOrderStatus} className="mt-2 flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={order.id} />
                <label className="sr-only" htmlFor={`status-${order.id}`}>
                  {t(lang, 'status')}
                </label>
                <select id={`status-${order.id}`} name="status" className="field max-w-xs" defaultValue={order.status}>
                  {orderChoices[user.role].includes(order.status) ? null : (
                    <option value={order.status}>{t(lang, `status_${order.status}`)}</option>
                  )}
                  {orderChoices[user.role].map((status) => (
                    <option key={status} value={status}>
                      {t(lang, `status_${status}`)}
                    </option>
                  ))}
                </select>
                <button type="submit" className="rounded-md bg-red-500 px-3 py-2 text-white">
                  {t(lang, 'updateStatus')}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      {canFront ? (
        <section>
          <h2 className="text-2xl font-bold">{t(lang, 'adminReservations')}</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {db.reservations.map((reservation) => (
              <li key={reservation.id} className="rounded-md border border-red-200 p-3">
                <p className="font-bold">
                  {reservation.name} · {t(lang, 'tableFor', { count: reservation.partySize })}
                </p>
                <p>
                  {reservation.date} {reservation.time} · {reservation.locationId} · {reservation.phone}
                </p>
                {reservation.notes ? <p>{reservation.notes}</p> : null}
                <form action={updateReservation} className="mt-2 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={reservation.id} />
                  <select name="status" className="field max-w-xs" defaultValue={reservation.status}>
                    {reservationChoices.map((status) => (
                      <option key={status} value={status}>
                        {t(lang, `res_${status}`)}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="rounded-md bg-red-500 px-3 py-2 text-white">
                    {t(lang, 'updateStatus')}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {canMenu ? (
        <>
          <section>
            <h2 className="text-2xl font-bold">{t(lang, 'adminMenu')}</h2>
            <DishForm categories={db.categories} />
            <ul className="mt-6 flex flex-col gap-4">
              {db.dishes.map((dish) => (
                <li key={dish.id} className="rounded-md border border-red-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-bold">
                      {dish.title} · {money(dish.price)} {dish.soldOut ? `· ${t(lang, 'soldOut')}` : ''}
                    </p>
                    <form action={toggleSoldOut}>
                      <input type="hidden" name="id" value={dish.id} />
                      <button type="submit" className="underline">
                        {dish.soldOut ? t(lang, 'markAvailable') : t(lang, 'markSoldOut')}
                      </button>
                    </form>
                  </div>
                  <details className="mt-2">
                    <summary>{t(lang, 'editProfile')}</summary>
                    <DishForm categories={db.categories} dish={dish} />
                  </details>
                </li>
              ))}
            </ul>
          </section>
          <Reports orders={db.orders} />
          <section>
            <h2 className="text-2xl font-bold">{t(lang, 'adminMessages')}</h2>
            {db.messages.length === 0 ? <p>{t(lang, 'noneYet')}</p> : null}
            <ul className="mt-3 flex flex-col gap-3">
              {db.messages.map((message) => (
                <li key={message.id} className="rounded-md bg-fuchsia-50 p-3">
                  <p className="font-bold">
                    {message.name} · {message.email} · {message.phone}
                  </p>
                  <p>{message.message}</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  )
}

function DishForm({
  categories,
  dish,
}: {
  categories: { id: string; title: string }[]
  dish?: Dish
}) {
  const images = dish && !menuImages.includes(dish.img) ? [dish.img, ...menuImages] : menuImages
  return (
    <form action={saveDish} className="mt-4 grid gap-3 md:grid-cols-2">
      {dish ? <input type="hidden" name="id" value={dish.id} /> : null}
      <label className="flex flex-col gap-1">
        Title
        <input className="field" name="title" required defaultValue={dish?.title ?? ''} />
      </label>
      <label className="flex flex-col gap-1">
        Category
        <select className="field" name="categoryId" defaultValue={dish?.categoryId ?? categories[0]?.id}>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.title}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 md:col-span-2">
        Description
        <textarea className="field min-h-20" name="desc" required defaultValue={dish?.desc ?? ''} />
      </label>
      <label className="flex flex-col gap-1">
        Price
        <input className="field" name="price" type="number" min={0} step="0.01" required defaultValue={dish?.price ?? 12} />
      </label>
      <label className="flex flex-col gap-1">
        Photo
        <select className="field" name="img" defaultValue={dish?.img ?? images[0]}>
          {images.map((image) => (
            <option key={image} value={image}>
              {image}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 md:col-span-2">
        Sizes, written as Small:0, Medium:4
        <input className="field" name="sizes" required defaultValue={dish?.sizes.map((size) => `${size.title}:${size.additionalPrice}`).join(', ') ?? 'Small:0, Large:4'} />
      </label>
      <label className="flex flex-col gap-1 md:col-span-2">
        Toppings, written as Olives:1.5
        <input className="field" name="toppings" defaultValue={dish?.toppings.map((item) => `${item.title}:${item.price}`).join(', ') ?? ''} />
      </label>
      <label className="flex flex-col gap-1 md:col-span-2">
        Ingredients guests can remove
        <input className="field" name="ingredients" defaultValue={dish?.ingredients.join(', ') ?? ''} />
      </label>
      <div className="flex flex-wrap gap-4 md:col-span-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="vegetarian" defaultChecked={dish?.vegetarian ?? false} /> Vegetarian
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="spicy" defaultChecked={dish?.spicy ?? false} /> Spicy
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="popular" defaultChecked={dish?.popular ?? false} /> Popular
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="featured" defaultChecked={dish?.featured ?? false} /> Featured
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="soldOut" defaultChecked={dish?.soldOut ?? false} /> Sold out
        </label>
      </div>
      <button type="submit" className="w-fit rounded-md bg-red-500 px-4 py-3 text-white">
        {dish ? 'Save dish' : 'Add dish'}
      </button>
    </form>
  )
}

function Reports({ orders }: { orders: Order[] }) {
  const active = orders.filter((order) => order.status !== 'cancelled')
  const revenue = active.reduce((sum, order) => sum + order.total, 0)
  const counts = new Map<string, number>()
  const hours = Array.from({ length: 24 }, () => 0)
  const days = new Map<string, number>()
  for (const order of active) {
    const created = new Date(order.createdAt)
    hours[created.getHours()] += 1
    const day = created.toLocaleDateString('en-CA')
    days.set(day, (days.get(day) ?? 0) + order.total)
    for (const item of order.items) counts.set(item.title, (counts.get(item.title) ?? 0) + item.quantity)
  }
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  const peak = Math.max(1, ...hours)

  return (
    <section>
      <h2 className="text-2xl font-bold">Reports</h2>
      <p className="mt-2">
        {active.length} orders · {money(revenue)} revenue, excluding cancelled orders.
      </p>
      <h3 className="mt-4 font-bold">Best sellers</h3>
      <ol className="list-decimal pl-5">
        {best.map(([title, qty]) => (
          <li key={title}>
            {title}: {qty}
          </li>
        ))}
      </ol>
      <h3 className="mt-4 font-bold">Daily revenue</h3>
      <ul>
        {[...days.entries()].sort().map(([day, total]) => (
          <li key={day} className="flex justify-between gap-4">
            <span>{day}</span>
            <span>{money(total)}</span>
          </li>
        ))}
      </ul>
      <h3 className="mt-4 font-bold">Busy hours</h3>
      <ul className="mt-2 flex flex-col gap-1">
        {hours.map((count, hour) =>
          hour < 11 || hour > 22 ? null : (
            <li key={hour} className="flex items-center gap-2">
              <span className="w-12">{String(hour).padStart(2, '0')}:00</span>
              <span className="h-3 bg-red-500" style={{ width: `${(count / peak) * 100}%`, minWidth: count ? '0.5rem' : 0 }} />
              <span>{count}</span>
            </li>
          ),
        )}
      </ul>
    </section>
  )
}
