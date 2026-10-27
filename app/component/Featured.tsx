import Image from 'next/image'
import Link from 'next/link'
import { t, type Lang } from '@/lib/i18n'
import { money } from '@/lib/pricing'
import type { Dish } from '@/lib/types'
import { AddToCart } from './AddToCart'

const Featured = ({ dishes, lang }: { dishes: Dish[]; lang: Lang }) => {
  return (
    <div className="bg-[#f6f1ea] px-4 py-16 text-[#2c241f] md:px-10">
      <div className="mx-auto grid max-w-6xl gap-px bg-[#e6d8c8] md:grid-cols-2 xl:grid-cols-4">
        {dishes.map((item) => (
          <div key={item.id} className="flex flex-col items-center gap-5 bg-[#fffdf9] px-6 py-10">
            {item.img ? (
              <div className="relative h-64 w-full">
                <Image src={item.img} alt={item.title} fill className="object-contain" sizes="(max-width: 768px) 100vw, 33vw" />
              </div>
            ) : null}
            <div className="flex max-w-sm flex-col items-center gap-4 text-center">
              <h2 className="text-4xl">
                <Link href={`/product/${item.id}`}>{item.title}</Link>
              </h2>
              <p className="text-sm leading-6 text-[#6d6258]">{item.desc}</p>
              <span className="text-sm tracking-[0.14em]">{money(item.price)}</span>
              <AddToCart dish={item} lang={lang} />
            </div>
          </div>
        ))}
        {dishes.length === 0 ? <p className="p-8">{t(lang, 'noDishes')}</p> : null}
      </div>
    </div>
  )
}

export default Featured
