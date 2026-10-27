import { Suspense } from 'react'
import { CheckoutForm } from '@/app/component/CheckoutForm'
import { suggestTime } from '@/lib/pricing'
import { getPageData } from '@/lib/session'

export default function CheckoutPage({ searchParams }: { searchParams: Promise<{ promo?: string }> }) {
  return (
    <Suspense fallback={<p className="p-4 text-red-500">…</p>}>
      <CheckoutContent searchParams={searchParams} />
    </Suspense>
  )
}

async function CheckoutContent({ searchParams }: { searchParams: Promise<{ promo?: string }> }) {
  const [{ promo }, data] = await Promise.all([searchParams, getPageData()])
  return (
    <CheckoutForm
      lang={data.lang}
      user={data.user}
      locations={data.db.locations}
      initialLocationId={data.location.id}
      dishes={data.db.dishes}
      promos={data.db.promos}
      settings={data.db.settings}
      defaultTime={suggestTime(data.location)}
      defaultPromo={(promo ?? '').toUpperCase()}
    />
  )
}
