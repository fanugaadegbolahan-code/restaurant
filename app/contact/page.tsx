import { Suspense } from 'react'
import { Reviews } from '@/app/component/Reviews'
import { submitContact } from '@/lib/actions'
import { t } from '@/lib/i18n'
import { money } from '@/lib/pricing'
import { getPageData } from '@/lib/session'

export default function ContactPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string; review?: string }> }) {
  return (
    <Suspense fallback={<p className="p-4 text-red-500">…</p>}>
      <ContactContent searchParams={searchParams} />
    </Suspense>
  )
}

async function ContactContent({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string; review?: string }> }) {
  const [query, { db, lang, location, user }] = await Promise.all([searchParams, getPageData()])
  const bbox = `${location.lng - 0.04},${location.lat - 0.03},${location.lng + 0.04},${location.lat + 0.03}`
  const map = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${location.lat}%2C${location.lng}`
  const reviews = db.reviews.filter((review) => review.dishId === null)

  return (
    <div className="grid gap-8 p-4 text-red-500 lg:grid-cols-2 lg:px-20 xl:px-40">
      <section className="flex flex-col gap-4">
        <h1 className="text-5xl">{t(lang, 'contactTitle')}</h1>
        <p>{t(lang, 'contactBlurb')}</p>
        <h2 className="text-2xl font-bold">{location.name}</h2>
        <p>
          {location.address}, {location.city}
        </p>
        <p>
          <a className="underline" href={`tel:${location.phone.replace(/\s/g, '')}`}>
            {t(lang, 'call')} {location.phone}
          </a>
        </p>
        <h2 className="text-2xl font-bold" id="hours">
          {t(lang, 'hoursHeading')}
        </h2>
        <ul>
          {location.hours.map((day) => (
            <li key={day.day} className="flex justify-between gap-6">
              <span>{t(lang, day.day.toLowerCase())}</span>
              <span>
                {day.open}–{day.close}
              </span>
            </li>
          ))}
        </ul>
        <h2 className="text-2xl font-bold">{t(lang, 'deliveryRules')}</h2>
        <p>
          {t(lang, 'rulesBody', {
            min: money(db.settings.minDeliverySubtotal),
            fee: money(db.settings.deliveryFee),
            free: money(db.settings.freeDeliveryOver),
            miles: location.deliveryRadiusMiles,
          })}
        </p>
        <ul>
          {location.zones.map((zone) => (
            <li key={zone.name}>
              {zone.name}: {zone.miles} mi · {zone.minutes} {t(lang, 'minutes')}
            </li>
          ))}
        </ul>
        <iframe title={t(lang, 'mapTitle')} className="h-72 w-full rounded-md border border-red-100" src={map} />
        <a className="underline" href={`https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=15/${location.lat}/${location.lng}`}>
          {t(lang, 'openMap')}
        </a>
      </section>
      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold">{t(lang, 'send')}</h2>
        {query.sent ? <p role="status">{t(lang, 'contactSuccess')}</p> : null}
        {query.error ? (
          <p role="alert" className="rounded-md bg-red-100 px-3 py-2">
            {t(lang, 'contactError')}
          </p>
        ) : null}
        <form action={submitContact} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            {t(lang, 'name')}
            <input className="field" name="name" required autoComplete="name" />
          </label>
          <label className="flex flex-col gap-1">
            {t(lang, 'email')}
            <input className="field" name="email" type="email" required autoComplete="email" />
          </label>
          <label className="flex flex-col gap-1">
            {t(lang, 'phone')}
            <input className="field" name="phone" type="tel" autoComplete="tel" />
          </label>
          <label className="flex flex-col gap-1">
            {t(lang, 'message')}
            <textarea className="field min-h-32" name="message" required minLength={2} />
          </label>
          <button type="submit" className="w-fit rounded-md bg-red-500 px-4 py-3 text-white">
            {t(lang, 'send')}
          </button>
        </form>
        <Reviews lang={lang} reviews={reviews} user={user} returnTo="/contact" notice={query.review} heading={t(lang, 'restaurantReviews')} />
      </section>
    </div>
  )
}
