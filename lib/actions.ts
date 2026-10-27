'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { menuImages } from './seed'
import { hashPassword, newId, verifyPassword } from './password'
import { buildQuote, checkRequestedTime, expiryOk, luhnOk, roundMoney } from './pricing'
import { LANG_COOKIE, LOCATION_COOKIE, SESSION_COOKIE, userFromDb } from './session'
import { loadDb, updateDb } from './store'
import type { Database, LineInput, Order, OrderStatus, ReservationStatus, Role } from './types'

export type FormState = { error: string }

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function clean(value: FormDataEntryValue | null, max: number) {
  return String(value ?? '')
    .replace(/[\u0000-\u001F]/g, '')
    .trim()
    .slice(0, max)
}

function emailOk(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function phoneOk(value: string) {
  return value.replace(/\D/g, '').length >= 7
}

function safeNext(value: FormDataEntryValue | null, fallback = '/account') {
  const next = String(value ?? '')
  if (next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')) return next
  return fallback
}

function refresh() {
  revalidatePath('/', 'layout')
}

async function accountFromSession(db: Database) {
  const jar = await cookies()
  const publicUser = userFromDb(db, jar.get(SESSION_COOKIE)?.value)
  if (!publicUser) return null
  return db.users.find((item) => item.id === publicUser.id) ?? null
}

const orderStatuses: Record<Role, OrderStatus[]> = {
  customer: [],
  kitchen: ['preparing', 'ready'],
  front: ['received', 'on_the_way', 'completed', 'cancelled'],
  admin: ['received', 'preparing', 'ready', 'on_the_way', 'completed', 'cancelled'],
}

function statusSentence(order: Order, status: OrderStatus) {
  const sentences: Record<OrderStatus, string> = {
    received: `Massino: order ${order.number} is received.`,
    preparing: `Massino: order ${order.number} is being prepared.`,
    ready: `Massino: order ${order.number} is ready.`,
    on_the_way: `Massino: order ${order.number} is on the way.`,
    completed: `Massino: order ${order.number} is complete. Enjoy your meal.`,
    cancelled: `Massino: order ${order.number} was cancelled.`,
  }
  return sentences[status]
}

function addNotices(order: Order, status: OrderStatus) {
  const body = statusSentence(order, status)
  const createdAt = new Date().toISOString()
  order.notices.push(
    { id: newId(), channel: 'email', to: order.email, body, createdAt },
    { id: newId(), channel: 'sms', to: order.phone, body: `${body} Replies are not monitored.`, createdAt },
  )
}

function parseLines(value: FormDataEntryValue | null): LineInput[] | null {
  try {
    const parsed = JSON.parse(String(value ?? '[]')) as unknown
    if (!Array.isArray(parsed)) return null
    return parsed.map((row) => {
      const item = row as Partial<LineInput>
      return {
        dishId: String(item.dishId ?? ''),
        size: String(item.size ?? ''),
        toppings: Array.isArray(item.toppings) ? item.toppings.map(String).slice(0, 12) : [],
        removed: Array.isArray(item.removed) ? item.removed.map(String).slice(0, 12) : [],
        instructions: String(item.instructions ?? '').slice(0, 140),
        quantity: Number(item.quantity),
      }
    })
  } catch {
    return null
  }
}

async function startSession(userId: string) {
  const session = {
    id: newId(),
    userId,
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  }
  await updateDb((db) => {
    db.sessions = db.sessions.filter((item) => new Date(item.expiresAt).getTime() > Date.now())
    db.sessions.push(session)
  })
  const jar = await cookies()
  jar.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  })
}

export async function setLanguage(formData: FormData) {
  const lang = formData.get('lang') === 'it' ? 'it' : 'en'
  const jar = await cookies()
  jar.set(LANG_COOKIE, lang, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  refresh()
}

export async function setLocation(formData: FormData) {
  const id = clean(formData.get('locationId'), 40)
  const db = await loadDb()
  if (!db.locations.some((item) => item.id === id)) return
  const jar = await cookies()
  jar.set(LOCATION_COOKIE, id, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  refresh()
}

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = clean(formData.get('name'), 80)
  const email = clean(formData.get('email'), 120).toLowerCase()
  const phone = clean(formData.get('phone'), 30)
  const password = String(formData.get('password') ?? '')
  if (!name) return { error: 'contact' }
  if (!emailOk(email)) return { error: 'email' }
  if (!phoneOk(phone)) return { error: 'phone' }
  if (password.length < 8) return { error: 'password' }

  const created = await updateDb((db) => {
    if (db.users.some((item) => item.email === email)) return ''
    const id = newId()
    db.users.push({
      id,
      name,
      email,
      phone,
      passwordHash: hashPassword(password),
      role: 'customer',
      points: 0,
      stamps: 0,
      favoriteIds: [],
      addresses: [],
    })
    return id
  })

  if (!created) return { error: 'taken' }
  await startSession(created)
  refresh()
  redirect('/account')
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = clean(formData.get('email'), 120).toLowerCase()
  const password = String(formData.get('password') ?? '')
  const db = await loadDb()
  const user = db.users.find((item) => item.email === email)
  if (!user || !verifyPassword(password, user.passwordHash)) return { error: 'login' }
  await startSession(user.id)
  refresh()
  redirect(safeNext(formData.get('next')))
}

export async function logout() {
  const jar = await cookies()
  const sessionId = jar.get(SESSION_COOKIE)?.value
  if (sessionId) {
    await updateDb((db) => {
      db.sessions = db.sessions.filter((item) => item.id !== sessionId)
    })
  }
  jar.delete(SESSION_COOKIE)
  refresh()
  redirect('/')
}

export async function saveProfile(formData: FormData) {
  const name = clean(formData.get('name'), 80)
  const phone = clean(formData.get('phone'), 30)
  if (!name || !phoneOk(phone)) redirect('/account?error=1')
  const saved = await updateDb(async (db) => {
    const user = await accountFromSession(db)
    if (!user) return false
    user.name = name
    user.phone = phone
    return true
  })
  if (!saved) redirect('/login?next=/account')
  refresh()
  redirect('/account?saved=1')
}

export async function addAddress(formData: FormData) {
  const label = clean(formData.get('label'), 40)
  const line = clean(formData.get('line'), 160)
  const zone = clean(formData.get('zone'), 60)
  const saved = await updateDb(async (db) => {
    const user = await accountFromSession(db)
    const known = db.locations.some((location) => location.zones.some((item) => item.name === zone))
    if (!user || !label || !line || !known) return false
    user.addresses.push({ id: newId(), label, line, zone })
    return true
  })
  refresh()
  redirect(saved ? '/account?address=1' : '/account?error=1')
}

export async function deleteAddress(formData: FormData) {
  const id = clean(formData.get('id'), 80)
  await updateDb(async (db) => {
    const user = await accountFromSession(db)
    if (!user) return
    user.addresses = user.addresses.filter((item) => item.id !== id)
  })
  refresh()
  redirect('/account')
}

export async function toggleFavorite(formData: FormData) {
  const dishId = clean(formData.get('dishId'), 80)
  const returnTo = safeNext(formData.get('returnTo'), `/product/${dishId}`)
  const saved = await updateDb(async (db) => {
    const user = await accountFromSession(db)
    if (!user || !db.dishes.some((item) => item.id === dishId)) return false
    user.favoriteIds = user.favoriteIds.includes(dishId)
      ? user.favoriteIds.filter((item) => item !== dishId)
      : [...user.favoriteIds, dishId]
    return true
  })
  if (!saved) redirect(`/login?next=${encodeURIComponent(returnTo)}`)
  refresh()
  redirect(returnTo)
}

export async function submitReview(formData: FormData) {
  const dishId = clean(formData.get('dishId'), 80)
  const rating = Number(formData.get('rating'))
  const comment = clean(formData.get('comment'), 500)
  const returnTo = safeNext(formData.get('returnTo'), dishId ? `/product/${dishId}` : '/contact')
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 2) {
    redirect(`${returnTo}?review=error`)
  }
  const saved = await updateDb(async (db) => {
    const user = await accountFromSession(db)
    if (!user) return false
    if (dishId && !db.dishes.some((item) => item.id === dishId)) return false
    const target = dishId || null
    const existing = db.reviews.find((item) => item.userId === user.id && item.dishId === target)
    if (existing) {
      existing.rating = rating
      existing.comment = comment
      existing.createdAt = new Date().toISOString()
      existing.userName = user.name
    } else {
      db.reviews.push({
        id: newId(),
        userId: user.id,
        userName: user.name,
        dishId: target,
        rating,
        comment,
        createdAt: new Date().toISOString(),
      })
    }
    return true
  })
  if (!saved) redirect(`/login?next=${encodeURIComponent(returnTo)}`)
  refresh()
  redirect(`${returnTo}?review=saved`)
}

export async function submitContact(formData: FormData) {
  const name = clean(formData.get('name'), 80)
  const email = clean(formData.get('email'), 120).toLowerCase()
  const phone = clean(formData.get('phone'), 30)
  const message = clean(formData.get('message'), 1000)
  if (!name || !emailOk(email) || message.length < 2) redirect('/contact?error=1')
  await updateDb((db) => {
    db.messages.unshift({
      id: newId(),
      name,
      email,
      phone,
      message,
      createdAt: new Date().toISOString(),
    })
  })
  refresh()
  redirect('/contact?sent=1')
}

export async function createReservation(formData: FormData) {
  const name = clean(formData.get('name'), 80)
  const email = clean(formData.get('email'), 120).toLowerCase()
  const phone = clean(formData.get('phone'), 30)
  const date = clean(formData.get('date'), 10)
  const time = clean(formData.get('time'), 5)
  const partySize = Number(formData.get('partySize'))
  const notes = clean(formData.get('notes'), 300)
  const locationId = clean(formData.get('locationId'), 40)
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  if (!name || !emailOk(email) || !phoneOk(phone) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < todayKey) {
    redirect('/reservations?error=1')
  }
  if (!/^\d{2}:\d{2}$/.test(time) || !Number.isInteger(partySize) || partySize < 1 || partySize > 12) {
    redirect('/reservations?error=1')
  }
  const saved = await updateDb(async (db) => {
    if (!db.locations.some((item) => item.id === locationId)) return false
    const user = await accountFromSession(db)
    db.reservations.unshift({
      id: newId(),
      userId: user?.id ?? null,
      locationId,
      name,
      phone,
      email,
      date,
      time,
      partySize,
      notes,
      status: 'requested',
      createdAt: new Date().toISOString(),
    })
    return true
  })
  refresh()
  redirect(saved ? '/reservations?sent=1' : '/reservations?error=1')
}

export async function updateReservation(formData: FormData) {
  const id = clean(formData.get('id'), 80)
  const status = clean(formData.get('status'), 20) as ReservationStatus
  const allowed: ReservationStatus[] = ['requested', 'confirmed', 'seated', 'cancelled']
  if (!allowed.includes(status)) redirect('/admin')
  const saved = await updateDb(async (db) => {
    const user = await accountFromSession(db)
    if (!user || (user.role !== 'admin' && user.role !== 'front')) return false
    const reservation = db.reservations.find((item) => item.id === id)
    if (!reservation) return false
    reservation.status = status
    return true
  })
  if (!saved) redirect('/login?next=/admin')
  refresh()
  redirect('/admin')
}

export async function updateOrderStatus(formData: FormData) {
  const id = clean(formData.get('id'), 80)
  const status = clean(formData.get('status'), 20) as OrderStatus
  const saved = await updateDb(async (db) => {
    const user = await accountFromSession(db)
    if (!user || !orderStatuses[user.role].includes(status)) return false
    const order = db.orders.find((item) => item.id === id)
    if (!order) return false
    if (order.status === status) return true
    if (status === 'cancelled' && order.loyalty && !order.loyalty.reversed) {
      const account = db.users.find((item) => item.id === order.loyalty?.userId)
      if (account) {
        account.points = Math.max(0, account.points + order.loyalty.pointsUsed - order.loyalty.pointsEarned)
        account.stamps = Math.max(
          0,
          account.stamps + (order.loyalty.stampRedeemed ? db.settings.stampGoal : 0) - order.loyalty.stampEarned,
        )
      }
      order.loyalty.reversed = true
    }
    order.status = status
    addNotices(order, status)
    return true
  })
  if (!saved) redirect('/login?next=/admin')
  refresh()
  redirect('/admin')
}

function parsePriced(text: string) {
  return text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => {
      const [title, raw] = part.split(':')
      const price = Number((raw ?? '0').trim())
      if (!title?.trim() || !Number.isFinite(price) || price < 0) return []
      return [{ title: title.trim(), price }]
    })
}

export async function saveDish(formData: FormData) {
  const id = clean(formData.get('id'), 80)
  const title = clean(formData.get('title'), 80)
  const categoryId = clean(formData.get('categoryId'), 40)
  const desc = clean(formData.get('desc'), 400)
  const img = clean(formData.get('img'), 160)
  const price = Number(formData.get('price'))
  const sizes = parsePriced(clean(formData.get('sizes'), 300)).map((item) => ({
    title: item.title,
    additionalPrice: item.price,
  }))
  const toppings = parsePriced(clean(formData.get('toppings'), 300))
  const ingredients = clean(formData.get('ingredients'), 300)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12)
  if (!title || !desc || sizes.length === 0 || !Number.isFinite(price) || price < 0) redirect('/admin?error=menu')

  const saved = await updateDb(async (db) => {
    const user = await accountFromSession(db)
    if (!user || user.role !== 'admin') return false
    if (!db.categories.some((item) => item.id === categoryId)) return false
    const current = id ? db.dishes.find((item) => item.id === id) : undefined
    if (id && !current) return false
    const allowedImage = menuImages.includes(img) || current?.img === img
    if (!allowedImage) return false
    const next = {
      categoryId,
      title,
      desc,
      img,
      price: roundMoney(price),
      sizes,
      toppings,
      ingredients,
      vegetarian: formData.get('vegetarian') === 'on',
      spicy: formData.get('spicy') === 'on',
      popular: formData.get('popular') === 'on',
      featured: formData.get('featured') === 'on',
      soldOut: formData.get('soldOut') === 'on',
    }
    if (current) {
      Object.assign(current, next)
      return true
    }
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40)
    const dishId = db.dishes.some((item) => item.id === slug) ? `${slug}-${newId().slice(0, 4)}` : slug || newId()
    db.dishes.push({ id: dishId, ...next })
    return true
  })
  if (!saved) redirect('/login?next=/admin')
  refresh()
  redirect('/admin?saved=menu')
}

export async function toggleSoldOut(formData: FormData) {
  const id = clean(formData.get('id'), 80)
  const saved = await updateDb(async (db) => {
    const user = await accountFromSession(db)
    if (!user || user.role !== 'admin') return false
    const dish = db.dishes.find((item) => item.id === id)
    if (!dish) return false
    dish.soldOut = !dish.soldOut
    return true
  })
  if (!saved) redirect('/login?next=/admin')
  refresh()
  redirect('/admin')
}

export async function placeOrder(formData: FormData) {
  const lines = parseLines(formData.get('cart'))
  const fulfillment = formData.get('fulfillment') === 'delivery' ? 'delivery' : 'pickup'
  const locationId = clean(formData.get('locationId'), 40)
  const zone = clean(formData.get('zone'), 60)
  const name = clean(formData.get('name'), 80)
  const phone = clean(formData.get('phone'), 30)
  const email = clean(formData.get('email'), 120).toLowerCase()
  const address = clean(formData.get('address'), 160)
  const requestedTime = clean(formData.get('requestedTime'), 16)
  const promoCode = clean(formData.get('promo'), 30)
  const redeemPoints = Number(formData.get('redeemPoints') || 0)
  const useStamp = formData.get('useStamp') === 'on'
  const paymentMethod = String(formData.get('paymentMethod') ?? '')
  const cardNumber = String(formData.get('cardNumber') ?? '')
  const expiry = String(formData.get('expiry') ?? '')
  const cvc = String(formData.get('cvc') ?? '')

  if (!lines) return { ok: false as const, code: 'empty' }
  if (!name) return { ok: false as const, code: 'contact' }
  if (!phoneOk(phone)) return { ok: false as const, code: 'phone' }
  if (!emailOk(email)) return { ok: false as const, code: 'email' }
  if (fulfillment === 'delivery' && address.length < 4) return { ok: false as const, code: 'address' }

  const allowedPayment = fulfillment === 'delivery' ? ['card', 'cash_delivery'] : ['card', 'cash_pickup']
  if (!allowedPayment.includes(paymentMethod)) return { ok: false as const, code: 'payment' }

  let cardLast4: string | null = null
  if (paymentMethod === 'card') {
    const digits = cardNumber.replace(/\s+/g, '')
    if (!luhnOk(digits)) return { ok: false as const, code: 'card' }
    if (!expiryOk(expiry)) return { ok: false as const, code: 'expiry' }
    if (!/^\d{3,4}$/.test(cvc.trim())) return { ok: false as const, code: 'cvc' }
    cardLast4 = digits.slice(-4)
  }

  const jar = await cookies()
  const sessionId = jar.get(SESSION_COOKIE)?.value

  const result = await updateDb((db) => {
    const publicUser = userFromDb(db, sessionId)
    const account = publicUser ? db.users.find((item) => item.id === publicUser.id) ?? null : null
    const location = db.locations.find((item) => item.id === locationId)
    if (!location) return { ok: false as const, code: 'generic' }
    const timeError = checkRequestedTime(requestedTime, location)
    if (timeError === 'hours') {
      const when = new Date(requestedTime)
      const hours = location.hours.find((item) => item.day === weekdays[when.getDay()])
      return { ok: false as const, code: 'hours', detail: hours?.open ? `${hours.open}–${hours.close}` : '' }
    }
    if (timeError) return { ok: false as const, code: timeError }

    const quote = buildQuote({
      lines,
      dishes: db.dishes,
      settings: db.settings,
      location,
      promos: db.promos,
      fulfillment,
      zone,
      promoCode,
      redeemPoints: Number.isFinite(redeemPoints) ? redeemPoints : 0,
      useStamp,
      pointsAvailable: account?.points ?? 0,
      stampsAvailable: account?.stamps ?? 0,
      isLoggedIn: Boolean(account),
    })
    if (!quote.ok) return quote

    const earned = account ? Math.floor(roundMoney(quote.subtotal - quote.discount)) : 0
    if (account) {
      account.points = account.points - quote.pointsUsed + earned
      account.stamps = account.stamps - (quote.stampDiscount > 0 ? db.settings.stampGoal : 0) + 1
    }

    db.orderSeq += 1
    const order: Order = {
      id: newId(),
      number: `MS-${db.orderSeq}`,
      userId: account?.id ?? null,
      locationId: location.id,
      fulfillment,
      status: 'received',
      customerName: name,
      phone,
      email,
      address: fulfillment === 'delivery' ? address : '',
      zone: fulfillment === 'delivery' ? zone : '',
      requestedTime,
      items: quote.items,
      subtotal: quote.subtotal,
      discount: quote.discount,
      deliveryFee: quote.deliveryFee,
      tax: quote.tax,
      total: quote.total,
      promoCode: quote.promoCode,
      pointsUsed: quote.pointsUsed,
      paymentMethod: paymentMethod as Order['paymentMethod'],
      paymentStatus: paymentMethod === 'card' ? 'paid' : 'due',
      cardLast4,
      etaMinutes: quote.etaMinutes,
      notices: [],
      loyalty: account
        ? {
            userId: account.id,
            pointsEarned: earned,
            pointsUsed: quote.pointsUsed,
            stampEarned: 1,
            stampRedeemed: quote.stampDiscount > 0 ? 1 : 0,
            reversed: false,
          }
        : null,
      createdAt: new Date().toISOString(),
    }
    addNotices(order, 'received')
    db.orders.unshift(order)
    return { ok: true as const, orderId: order.id }
  })

  if (result.ok) refresh()
  return result
}
