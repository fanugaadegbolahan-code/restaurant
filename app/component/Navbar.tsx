import Link from 'next/link'
import { logout, setLanguage, setLocation } from '@/lib/actions'
import { t } from '@/lib/i18n'
import { hoursLabel } from '@/lib/pricing'
import { getPageData } from '@/lib/session'
import Carticon from './Carticon'
import { ChoiceForm } from './ChoiceForm'
import Menu from './Menu'

const Navbar = async () => {
  const { lang, db, location, user } = await getPageData()
  const hours = hoursLabel(location)
  const staff = user && user.role !== 'customer'

  return (
    <header className="border-b border-[#e6d8c8] bg-[#f6f1ea] text-[#2c241f]">
      <div className="hidden items-center justify-between gap-6 border-b border-[#efe4d6] px-8 py-2 text-[0.65rem] uppercase text-[#6d6258] md:flex xl:px-16">
        <p className="normal-case tracking-normal">
          <a href={`tel:${location.phone.replace(/\s/g, '')}`} className="tracking-[0.08em]">
            {location.phone}
          </a>
          <span className="mx-2 text-[#c6a56a]">·</span>
          <span>{hours.open ? t(lang, 'openUntil', { detail: hours.detail }) : t(lang, 'opensAt', { detail: hours.detail || t(lang, 'closedNow') })}</span>
        </p>
        <div className="flex items-center gap-5">
          <ChoiceForm action={setLocation}>
            <label className="sr-only" htmlFor="locationId">
              {t(lang, 'location')}
            </label>
            <select id="locationId" name="locationId" defaultValue={location.id} className="bg-transparent">
              {db.locations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </ChoiceForm>
          <ChoiceForm action={setLanguage}>
            <label className="sr-only" htmlFor="lang">
              {t(lang, 'language')}
            </label>
            <select id="lang" name="lang" defaultValue={lang} className="bg-transparent">
              <option value="en">EN</option>
              <option value="it">IT</option>
            </select>
          </ChoiceForm>
          {user ? (
            <>
              <Link href="/orders">{t(lang, 'navOrders')}</Link>
              <Link href="/account">{t(lang, 'navAccount')}</Link>
              {staff ? <Link href="/admin">{t(lang, 'navAdmin')}</Link> : null}
              <form action={logout}>
                <button type="submit">{t(lang, 'navLogout')}</button>
              </form>
            </>
          ) : (
            <Link href="/login">{t(lang, 'navLogin')}</Link>
          )}
        </div>
      </div>
      <div className="grid min-h-20 grid-cols-[1fr_auto_1fr] items-center px-4 md:px-8 xl:px-16">
        <nav aria-label="Main navigation" className="hidden items-center gap-7 text-[0.68rem] uppercase md:flex">
          <Link href="/">{t(lang, 'navHome')}</Link>
          <Link href="/menu">{t(lang, 'navMenu')}</Link>
          <Link href="/reservations">{t(lang, 'navReserve')}</Link>
          <Link href="/contact">{t(lang, 'navContact')}</Link>
        </nav>
        <div className="md:hidden">
          <Menu lang={lang} user={user} />
        </div>
        <div className="text-center font-[family-name:var(--font-display)] text-3xl font-medium tracking-[0.18em] uppercase md:text-5xl md:tracking-[0.28em]">
          <Link href="/">Massino</Link>
        </div>
        <div className="justify-self-end">
          <Carticon lang={lang} />
        </div>
      </div>
    </header>
  )
}

export default Navbar
