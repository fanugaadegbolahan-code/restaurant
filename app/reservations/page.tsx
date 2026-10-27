import { Suspense } from 'react'
import { createReservation } from '@/lib/actions'
import { t } from '@/lib/i18n'
import { getPageData } from '@/lib/session'

export default function ReservationsPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  return (
    <Suspense fallback={<p className="p-4 text-red-500">…</p>}>
      <ReservationsContent searchParams={searchParams} />
    </Suspense>
  )
}

async function ReservationsContent({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const [query, { db, lang, location, user }] = await Promise.all([searchParams, getPageData()])
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 p-4 text-red-500">
      <h1 className="text-5xl">{t(lang, 'reservationTitle')}</h1>
      <p>{t(lang, 'reservationNote')}</p>
      {query.sent ? <p role="status">{t(lang, 'reserveSuccess')}</p> : null}
      {query.error ? (
        <p role="alert" className="rounded-md bg-red-100 px-3 py-2">
          {t(lang, 'reserveError')}
        </p>
      ) : null}
      <form action={createReservation} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          {t(lang, 'whichLocation')}
          <select className="field" name="locationId" defaultValue={location.id}>
            {db.locations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          {t(lang, 'name')}
          <input className="field" name="name" required defaultValue={user?.name ?? ''} />
        </label>
        <label className="flex flex-col gap-1">
          {t(lang, 'phone')}
          <input className="field" name="phone" required defaultValue={user?.phone ?? ''} />
        </label>
        <label className="flex flex-col gap-1">
          {t(lang, 'email')}
          <input className="field" name="email" type="email" required defaultValue={user?.email ?? ''} />
        </label>
        <label className="flex flex-col gap-1">
          {t(lang, 'date')}
          <input className="field" name="date" type="date" required min={todayKey} />
        </label>
        <label className="flex flex-col gap-1">
          {t(lang, 'time')}
          <input className="field" name="time" type="time" required defaultValue="19:00" />
        </label>
        <label className="flex flex-col gap-1">
          {t(lang, 'party')}
          <input className="field" name="partySize" type="number" min={1} max={12} required defaultValue={2} />
        </label>
        <label className="flex flex-col gap-1">
          {t(lang, 'notes')}
          <textarea className="field min-h-24" name="notes" maxLength={300} />
        </label>
        <button type="submit" className="rounded-md bg-red-500 px-4 py-3 text-white">
          {t(lang, 'book')}
        </button>
      </form>
    </div>
  )
}
