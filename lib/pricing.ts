import type { Lang } from './i18n'
import { t } from './i18n'
import type {
  Dish,
  LineInput,
  Location,
  OrderItem,
  Promo,
  Settings,
} from './types'

export function money(value: number) {
  return `$${value.toFixed(2)}`
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

export function toMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function toDateTimeLocal(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function suggestTime(location: Location, now = new Date()) {
  const start = new Date(now.getTime() + 45 * 60 * 1000)
  for (let offset = 0; offset < 8; offset += 1) {
    const candidate = new Date(start)
    candidate.setDate(start.getDate() + offset)
    const hours = location.hours.find((item) => item.day === dayNames[candidate.getDay()])
    if (!hours?.open || !hours.close) continue
    const openMinutes = toMinutes(hours.open)
    const closeMinutes = toMinutes(hours.close)
    const currentMinutes = offset === 0 ? candidate.getHours() * 60 + candidate.getMinutes() : openMinutes
    if (currentMinutes < openMinutes) {
      candidate.setHours(Math.floor(openMinutes / 60), openMinutes % 60, 0, 0)
      return toDateTimeLocal(candidate)
    }
    if (currentMinutes <= closeMinutes) {
      return toDateTimeLocal(candidate)
    }
  }
  return toDateTimeLocal(start)
}

export function hoursLabel(location: Location, now = new Date()) {
  const hours = location.hours.find((item) => item.day === dayNames[now.getDay()])
  if (!hours?.open || !hours.close) return { open: false, detail: '' }
  const mins = now.getHours() * 60 + now.getMinutes()
  const open = toMinutes(hours.open)
  const close = toMinutes(hours.close)
  if (mins < open) return { open: false, detail: hours.open }
  if (mins > close) return { open: false, detail: hours.open }
  return { open: true, detail: hours.close }
}

export function checkRequestedTime(value: string, location: Location, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return 'time' as const
  const when = new Date(value)
  if (Number.isNaN(when.getTime())) return 'time' as const
  const earliest = now.getTime() + 20 * 60 * 1000
  const latest = now.getTime() + 7 * 24 * 60 * 60 * 1000
  if (when.getTime() < earliest || when.getTime() > latest) return 'time' as const
  const hours = location.hours.find((item) => item.day === dayNames[when.getDay()])
  if (!hours?.open || !hours.close) return 'hours' as const
  const mins = when.getHours() * 60 + when.getMinutes()
  if (mins < toMinutes(hours.open) || mins > toMinutes(hours.close)) return 'hours' as const
  return null
}

export function unitPrice(dish: Dish, size: string, toppings: string[]) {
  const sizeOption = dish.sizes.find((item) => item.title === size)
  if (!sizeOption) return null
  if (toppings.some((name) => !dish.toppings.some((item) => item.title === name))) return null
  const toppingTotal = toppings.reduce((sum, name) => {
    const topping = dish.toppings.find((item) => item.title === name)
    return sum + (topping?.price ?? 0)
  }, 0)
  return roundMoney(dish.price + sizeOption.additionalPrice + toppingTotal)
}

export type QuoteFailure = { ok: false; code: string; detail?: string }

export type QuoteSuccess = {
  ok: true
  items: OrderItem[]
  subtotal: number
  promoDiscount: number
  pointsDiscount: number
  stampDiscount: number
  discount: number
  pointsUsed: number
  deliveryFee: number
  tax: number
  total: number
  etaMinutes: number
  promoCode: string | null
}

export function buildQuote(input: {
  lines: LineInput[]
  dishes: Dish[]
  settings: Settings
  location: Location
  promos: Promo[]
  fulfillment: 'pickup' | 'delivery'
  zone: string
  promoCode: string
  redeemPoints: number
  useStamp: boolean
  pointsAvailable: number
  stampsAvailable: number
  isLoggedIn: boolean
  now?: Date
}): QuoteSuccess | QuoteFailure {
  if (input.lines.length === 0) return { ok: false, code: 'empty' }

  const items: OrderItem[] = []
  for (const line of input.lines) {
    const dish = input.dishes.find((item) => item.id === line.dishId)
    if (!dish) return { ok: false, code: 'missing' }
    if (dish.soldOut) return { ok: false, code: 'soldout', detail: dish.title }
    const quantity = Math.floor(line.quantity)
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 20) {
      return { ok: false, code: 'options', detail: dish.title }
    }
    const toppings = [...new Set(line.toppings.map((item) => item.trim()).filter(Boolean))]
    const removed = [...new Set(line.removed.map((item) => item.trim()).filter(Boolean))]
    if (removed.some((name) => !dish.ingredients.includes(name))) {
      return { ok: false, code: 'options', detail: dish.title }
    }
    const price = unitPrice(dish, line.size, toppings)
    if (price === null) return { ok: false, code: 'options', detail: dish.title }
    items.push({
      dishId: dish.id,
      title: dish.title,
      img: dish.img,
      size: line.size,
      toppings,
      removed,
      instructions: line.instructions.trim().slice(0, 140),
      quantity,
      unitPrice: price,
    })
  }

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0))
  let zoneMinutes = input.settings.pickupMinutes
  let deliveryFee = 0

  if (input.fulfillment === 'delivery') {
    if (subtotal < input.settings.minDeliverySubtotal) {
      return { ok: false, code: 'min', detail: money(input.settings.minDeliverySubtotal) }
    }
    const zone = input.location.zones.find((item) => item.name === input.zone)
    if (!zone || zone.miles > input.location.deliveryRadiusMiles) {
      return { ok: false, code: 'zone' }
    }
    zoneMinutes = zone.minutes
    deliveryFee = subtotal >= input.settings.freeDeliveryOver ? 0 : input.settings.deliveryFee
  }

  const code = input.promoCode.trim().toUpperCase()
  let promoDiscount = 0
  let promoCode: string | null = null
  if (code) {
    const promo = input.promos.find((item) => item.code.toUpperCase() === code)
    const now = input.now ?? new Date()
    if (!promo || !promo.active || new Date(promo.endsAt).getTime() < now.getTime() || subtotal < promo.minSubtotal) {
      return { ok: false, code: 'promo' }
    }
    promoDiscount = promo.kind === 'percent' ? roundMoney(subtotal * (promo.value / 100)) : promo.value
    promoDiscount = Math.min(promoDiscount, subtotal)
    promoCode = promo.code
  }

  let stampDiscount = 0
  if (input.useStamp) {
    if (!input.isLoggedIn) return { ok: false, code: 'auth' }
    if (input.stampsAvailable < input.settings.stampGoal) return { ok: false, code: 'stamp' }
    stampDiscount = Math.min(input.settings.stampReward, roundMoney(subtotal - promoDiscount))
  }

  let pointsUsed = 0
  let pointsDiscount = 0
  if (input.redeemPoints > 0) {
    if (!input.isLoggedIn) return { ok: false, code: 'auth' }
    const step = input.settings.redeemPointsPerDollar
    pointsUsed = Math.floor(input.redeemPoints / step) * step
    if (pointsUsed > input.pointsAvailable) return { ok: false, code: 'points' }
    const remaining = roundMoney(subtotal - promoDiscount - stampDiscount)
    const maxPoints = Math.floor(remaining) * step
    pointsUsed = Math.min(pointsUsed, maxPoints)
    pointsDiscount = roundMoney(pointsUsed / step)
  }

  const discount = roundMoney(promoDiscount + stampDiscount + pointsDiscount)
  const taxable = roundMoney(Math.max(0, subtotal - discount))
  const tax = roundMoney(taxable * input.settings.taxRate)
  const total = roundMoney(taxable + deliveryFee + tax)

  return {
    ok: true,
    items,
    subtotal,
    promoDiscount,
    pointsDiscount,
    stampDiscount,
    discount,
    pointsUsed,
    deliveryFee,
    tax,
    total,
    etaMinutes: zoneMinutes,
    promoCode,
  }
}

export function explain(lang: Lang, code: string, detail?: string) {
  return t(lang, `err_${code}`, detail ? { detail } : undefined)
}

export function describeLine(
  line: { size: string; toppings: string[]; removed: string[]; instructions: string },
  lang: Lang,
) {
  const parts = [line.size]
  if (line.toppings.length > 0) parts.push(`${t(lang, 'lineExtra')}: ${line.toppings.join(', ')}`)
  if (line.removed.length > 0) parts.push(`${t(lang, 'lineRemoved')}: ${line.removed.join(', ')}`)
  if (line.instructions) parts.push(line.instructions)
  return parts.join(' · ')
}

export function luhnOk(value: string) {
  const digits = value.replace(/\s+/g, '')
  if (!/^\d{13,19}$/.test(digits)) return false
  let sum = 0
  let alternate = false
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = digits.charCodeAt(index) - 48
    if (alternate) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    alternate = !alternate
  }
  return sum % 10 === 0
}

export function expiryOk(value: string, now = new Date()) {
  const match = value.trim().match(/^(\d{2})\s*\/\s*(\d{2}|\d{4})$/)
  if (!match) return false
  const month = Number(match[1])
  const year = Number(match[2].length === 2 ? `20${match[2]}` : match[2])
  if (month < 1 || month > 12) return false
  const end = new Date(year, month, 1)
  return end.getTime() > now.getTime()
}

export function lineKey(line: Pick<LineInput, 'dishId' | 'size' | 'toppings' | 'removed' | 'instructions'>) {
  return [
    line.dishId,
    line.size,
    [...line.toppings].sort().join(','),
    [...line.removed].sort().join(','),
    line.instructions.trim(),
  ].join('|')
}
