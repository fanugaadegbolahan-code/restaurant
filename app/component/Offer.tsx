import Image from 'next/image'
import Link from 'next/link'
import { t, type Lang } from '@/lib/i18n'
import Countdown from './Countdown'

const Offer = ({ lang, endsAt }: { lang: Lang; endsAt: string }) => {
  return (
    <div className="flex min-h-[80vh] flex-col bg-[#1a1411] text-[#f6f1ea] md:flex-row">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 py-20 text-center">
        <p className="text-[0.7rem] uppercase tracking-[0.28em] text-[#e4d0a4]">{t(lang, 'offerEyebrow')}</p>
        <h2 className="max-w-lg text-5xl leading-none text-[#f6f1ea] xl:text-6xl">{t(lang, 'offerTitle')}</h2>
        <p className="max-w-md text-[#e7dccc]">{t(lang, 'offerBody')}</p>
        <p className="text-[0.7rem] uppercase tracking-[0.2em] text-[#cbb892]">{t(lang, 'offerEnds')}</p>
        <Countdown endsAt={endsAt} />
        <Link href="/menu/burgers" className="rounded-full bg-[#e4d0a4] px-8 py-4 text-[0.72rem] uppercase tracking-[0.16em] text-[#1a1411]">
          {t(lang, 'orderNow')}
        </Link>
      </div>
      <div className="relative min-h-[42vh] w-full flex-1">
        <Image src="/2eatingpizza.jpg" alt={t(lang, 'offerTitle')} fill sizes="(max-width: 800px) 100vw, 50vw" className="object-cover" />
      </div>
    </div>
  )
}

export default Offer
