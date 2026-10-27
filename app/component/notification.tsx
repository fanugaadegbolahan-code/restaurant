import Link from 'next/link'
import { t } from '@/lib/i18n'
import { getPageData } from '@/lib/session'

const NotificationPage = async () => {
  const { db, lang } = await getPageData()
  const promo = db.promos.find((item) => item.code === 'FRYSIDE')
  return (
    <Link href="/menu" className="notice-bar flex w-full items-center justify-center text-balance px-4 py-2.5 text-center leading-5">
      {t(lang, 'freeDelivery', {
        amount: db.settings.freeDeliveryOver,
        code: promo?.code ?? 'FRYSIDE',
        off: promo?.value ?? 4,
      })}
    </Link>
  )
}

export default NotificationPage
