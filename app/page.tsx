import { Suspense } from 'react'
import Featured from './component/Featured'
import Offer from './component/Offer'
import Slider from './component/Slider'
import { getPageData } from '@/lib/session'

export default function Home() {
  return (
    <Suspense fallback={<div className="h-[50vh] bg-[#f6f1ea]" />}>
      <HomeContent />
    </Suspense>
  )
}

async function HomeContent() {
  const { db, lang } = await getPageData()
  const promo = db.promos.find((item) => item.code === 'FRYSIDE')
  return (
    <>
      <Slider lang={lang} />
      <Featured dishes={db.dishes.filter((dish) => dish.featured)} lang={lang} />
      <Offer lang={lang} endsAt={promo?.endsAt ?? '2026-12-31T23:59:59'} />
    </>
  )
}
