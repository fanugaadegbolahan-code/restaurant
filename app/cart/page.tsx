import { Suspense } from 'react'
import { CartView } from '@/app/component/CartView'
import { getPageData } from '@/lib/session'

export default function CartPage() {
  return (
    <Suspense fallback={<p className="p-4 text-red-500">…</p>}>
      <CartContent />
    </Suspense>
  )
}

async function CartContent() {
  const { db, lang } = await getPageData()
  return <CartView dishes={db.dishes} lang={lang} />
}
