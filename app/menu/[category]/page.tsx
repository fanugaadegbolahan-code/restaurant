import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { MenuBrowser } from '@/app/component/MenuBrowser'
import { getPageData } from '@/lib/session'

type Props = {
  params: Promise<{ category: string }>
  searchParams: Promise<{ q?: string }>
}

export default function CategoryPage(props: Props) {
  return (
    <Suspense fallback={<p className="p-4 text-red-500">…</p>}>
      <CategoryContent {...props} />
    </Suspense>
  )
}

async function CategoryContent({ params, searchParams }: Props) {
  const [{ category }, query, { db, lang }] = await Promise.all([params, searchParams, getPageData()])
  const selected = category === 'all' ? null : db.categories.find((item) => item.slug === category)
  if (category !== 'all' && !selected) notFound()
  const dishes = selected ? db.dishes.filter((dish) => dish.categoryId === selected.id) : db.dishes
  return (
    <div>
      <h1 className="px-4 pt-14 text-center text-6xl text-[#2c241f]">{selected?.title ?? 'Massino'}</h1>
      <MenuBrowser dishes={dishes} lang={lang} initialQuery={query.q ?? ''} />
    </div>
  )
}
