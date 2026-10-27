import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DishCustomizer } from '@/app/component/DishCustomizer'
import { Reviews } from '@/app/component/Reviews'
import { toggleFavorite } from '@/lib/actions'
import { t } from '@/lib/i18n'
import { getPageData } from '@/lib/session'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ review?: string }>
}

export default function ProductPage(props: Props) {
  return (
    <Suspense fallback={<p className="p-4 text-red-500">…</p>}>
      <ProductContent {...props} />
    </Suspense>
  )
}

async function ProductContent({ params, searchParams }: Props) {
  const [{ id }, query, { db, lang, user }] = await Promise.all([params, searchParams, getPageData()])
  const dish = db.dishes.find((item) => item.id === id)
  if (!dish) notFound()
  const reviews = db.reviews.filter((review) => review.dishId === dish.id)
  const saved = user?.favoriteIds.includes(dish.id)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-12 text-[#2c241f] md:px-8">
      <div className="flex flex-col gap-10 md:flex-row md:items-center">
        <div className="relative h-[42vh] w-full bg-[#fffdf9] md:h-[62vh] md:w-1/2">
          <Image src={dish.img} alt={dish.title} fill className="object-contain p-6" sizes="(max-width: 768px) 100vw, 50vw" />
        </div>
        <div className="flex w-full flex-col gap-4 md:w-1/2">
          <p>
            <Link className="text-[0.68rem] uppercase tracking-[0.16em] text-[#8a7352]" href={`/menu/${db.categories.find((item) => item.id === dish.categoryId)?.slug ?? 'all'}`}>
              {t(lang, 'backMenu')}
            </Link>
          </p>
          <h1 className="text-6xl">{dish.title}</h1>
          <p>{dish.desc}</p>
          <p className="flex flex-wrap gap-2 text-sm">
            {dish.vegetarian ? <span className="rounded-full bg-green-100 px-2 py-1 text-green-800">{t(lang, 'vegetarian')}</span> : null}
            {dish.spicy ? <span className="rounded-full bg-orange-100 px-2 py-1 text-orange-800">{t(lang, 'spicy')}</span> : null}
            {dish.popular ? <span className="rounded-full bg-red-100 px-2 py-1">{t(lang, 'popular')}</span> : null}
          </p>
          {user ? (
            <form action={toggleFavorite}>
              <input type="hidden" name="dishId" value={dish.id} />
              <input type="hidden" name="returnTo" value={`/product/${dish.id}`} />
              <button type="submit" className="underline">
                {saved ? t(lang, 'saved') : t(lang, 'favorite')}
              </button>
            </form>
          ) : null}
          <DishCustomizer dish={dish} lang={lang} />
        </div>
      </div>
      <Reviews
        lang={lang}
        reviews={reviews}
        dishId={dish.id}
        user={user}
        returnTo={`/product/${dish.id}`}
        notice={query.review}
        heading={t(lang, 'reviews')}
      />
    </div>
  )
}
