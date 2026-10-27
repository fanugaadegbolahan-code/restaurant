import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { addAddress, deleteAddress, saveProfile } from '@/lib/actions'
import { t } from '@/lib/i18n'
import { money } from '@/lib/pricing'
import { getPageData } from '@/lib/session'

export default function AccountPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string; address?: string }> }) {
  return (
    <Suspense fallback={<p className="p-4 text-red-500">…</p>}>
      <AccountContent searchParams={searchParams} />
    </Suspense>
  )
}

async function AccountContent({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string; address?: string }> }) {
  const [query, { db, lang, user }] = await Promise.all([searchParams, getPageData()])
  if (!user) redirect('/login?next=/account')
  const favorites = db.dishes.filter((dish) => user.favoriteIds.includes(dish.id))
  const zones = db.locations.flatMap((location) => location.zones.map((zone) => zone.name))
  const uniqueZones = [...new Set(zones)]
  const filled = Math.min(user.stamps, db.settings.stampGoal)

  return (
    <div className="flex flex-col gap-8 p-4 text-red-500 lg:px-20 xl:px-40">
      <h1 className="text-5xl">{t(lang, 'accountTitle')}</h1>
      {query.saved ? <p role="status">{t(lang, 'accountSuccess')}</p> : null}
      {query.address ? <p role="status">{t(lang, 'addressSuccess')}</p> : null}
      {query.error ? <p role="alert">{t(lang, 'errorForm')}</p> : null}
      <p>
        {t(lang, 'role_' + user.role)} · {user.email}
      </p>
      <p>
        <Link className="underline" href="/orders">
          {t(lang, 'ordersLink')}
        </Link>
        {user.role !== 'customer' ? (
          <>
            {' · '}
            <Link className="underline" href="/admin">
              {t(lang, 'adminLink')}
            </Link>
          </>
        ) : null}
      </p>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-md bg-fuchsia-50 p-4">
          <h2 className="text-xl font-bold">{t(lang, 'pointsBalance')}</h2>
          <p className="text-3xl font-bold">{user.points}</p>
          <p>{t(lang, 'pointsHelp', { rate: db.settings.redeemPointsPerDollar })}</p>
        </div>
        <div className="rounded-md bg-fuchsia-50 p-4">
          <h2 className="text-xl font-bold">{t(lang, 'stampCard')}</h2>
          <div className="my-3 flex gap-2" aria-hidden="true">
            {Array.from({ length: db.settings.stampGoal }, (_, index) => (
              <span key={index} className={`h-8 w-8 rounded-full ${index < filled ? 'bg-red-500' : 'bg-red-100'}`} />
            ))}
          </div>
          <p>{t(lang, 'stampCount', { count: user.stamps })}</p>
          <p>{t(lang, 'stampHelp', { goal: db.settings.stampGoal, amount: db.settings.stampReward })}</p>
          {user.stamps >= db.settings.stampGoal ? <p>{t(lang, 'stampsReady')}</p> : null}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold">{t(lang, 'editProfile')}</h2>
        <form action={saveProfile} className="mt-3 grid max-w-xl gap-3">
          <label className="flex flex-col gap-1">
            {t(lang, 'name')}
            <input className="field" name="name" defaultValue={user.name} required />
          </label>
          <label className="flex flex-col gap-1">
            {t(lang, 'phoneNumber')}
            <input className="field" name="phone" defaultValue={user.phone} required />
          </label>
          <button type="submit" className="w-fit rounded-md bg-red-500 px-4 py-3 text-white">
            {t(lang, 'save')}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-2xl font-bold">{t(lang, 'addresses')}</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {user.addresses.map((address) => (
            <li key={address.id} className="flex items-center justify-between gap-3">
              <span>
                <strong>{address.label}</strong> · {address.line} · {address.zone}
              </span>
              <form action={deleteAddress}>
                <input type="hidden" name="id" value={address.id} />
                <button type="submit" className="underline">
                  {t(lang, 'delete')}
                </button>
              </form>
            </li>
          ))}
          {user.addresses.length === 0 ? <li>{t(lang, 'noneYet')}</li> : null}
        </ul>
        <form action={addAddress} className="mt-4 grid max-w-xl gap-3">
          <label className="flex flex-col gap-1">
            {t(lang, 'addressLabel')}
            <input className="field" name="label" required placeholder="Home" />
          </label>
          <label className="flex flex-col gap-1">
            {t(lang, 'street')}
            <input className="field" name="line" required />
          </label>
          <label className="flex flex-col gap-1">
            {t(lang, 'zoneForAddress')}
            <select className="field" name="zone" required defaultValue={uniqueZones[0]}>
              {uniqueZones.map((zone) => (
                <option key={zone}>{zone}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="w-fit rounded-md bg-red-500 px-4 py-3 text-white">
            {t(lang, 'addAddress')}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-2xl font-bold">{t(lang, 'favorites')}</h2>
        {favorites.length === 0 ? <p>{t(lang, 'favoritesEmpty')}</p> : null}
        <ul className="mt-3 flex flex-col gap-2">
          {favorites.map((dish) => (
            <li key={dish.id}>
              <Link className="underline" href={`/product/${dish.id}`}>
                {dish.title}
              </Link>{' '}
              · {money(dish.price)}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
