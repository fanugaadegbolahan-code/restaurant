export type Role = 'customer' | 'kitchen' | 'front' | 'admin'

export type OrderStatus =
  | 'received'
  | 'preparing'
  | 'ready'
  | 'on_the_way'
  | 'completed'
  | 'cancelled'

export type ReservationStatus = 'requested' | 'confirmed' | 'seated' | 'cancelled'

export type Fulfillment = 'pickup' | 'delivery'

export type PaymentMethod = 'card' | 'cash_delivery' | 'cash_pickup'

export type SizeOption = {
  title: string
  additionalPrice: number
}

export type Topping = {
  title: string
  price: number
}

export type Dish = {
  id: string
  categoryId: string
  title: string
  desc: string
  img: string
  price: number
  sizes: SizeOption[]
  toppings: Topping[]
  ingredients: string[]
  vegetarian: boolean
  spicy: boolean
  popular: boolean
  featured: boolean
  soldOut: boolean
}

export type Category = {
  id: string
  slug: string
  title: string
  desc: string
  img: string
  color: string
}

export type Zone = {
  name: string
  miles: number
  minutes: number
}

export type DayHours = {
  day: string
  open: string
  close: string
}

export type Location = {
  id: string
  name: string
  address: string
  city: string
  phone: string
  lat: number
  lng: number
  hours: DayHours[]
  deliveryRadiusMiles: number
  zones: Zone[]
}

export type Promo = {
  code: string
  label: string
  kind: 'percent' | 'amount'
  value: number
  minSubtotal: number
  endsAt: string
  active: boolean
}

export type Settings = {
  name: string
  taxRate: number
  deliveryFee: number
  freeDeliveryOver: number
  minDeliverySubtotal: number
  pointsPerDollar: number
  redeemPointsPerDollar: number
  stampGoal: number
  stampReward: number
  pickupMinutes: number
}

export type Address = {
  id: string
  label: string
  line: string
  zone: string
}

export type User = {
  id: string
  name: string
  email: string
  phone: string
  passwordHash: string
  role: Role
  points: number
  stamps: number
  favoriteIds: string[]
  addresses: Address[]
}

export type SessionUser = Omit<User, 'passwordHash'>

export type Session = {
  id: string
  userId: string
  expiresAt: string
}

export type OrderItem = {
  dishId: string
  title: string
  img: string
  size: string
  toppings: string[]
  removed: string[]
  instructions: string
  quantity: number
  unitPrice: number
}

export type OrderNotice = {
  id: string
  channel: 'email' | 'sms'
  to: string
  body: string
  createdAt: string
}

export type Loyalty = {
  userId: string
  pointsEarned: number
  pointsUsed: number
  stampEarned: number
  stampRedeemed: number
  reversed: boolean
}

export type Order = {
  id: string
  number: string
  userId: string | null
  locationId: string
  fulfillment: Fulfillment
  status: OrderStatus
  customerName: string
  phone: string
  email: string
  address: string
  zone: string
  requestedTime: string
  items: OrderItem[]
  subtotal: number
  discount: number
  deliveryFee: number
  tax: number
  total: number
  promoCode: string | null
  pointsUsed: number
  paymentMethod: PaymentMethod
  paymentStatus: 'paid' | 'due'
  cardLast4: string | null
  etaMinutes: number
  notices: OrderNotice[]
  loyalty: Loyalty | null
  createdAt: string
}

export type Review = {
  id: string
  userId: string
  userName: string
  dishId: string | null
  rating: number
  comment: string
  createdAt: string
}

export type Reservation = {
  id: string
  userId: string | null
  locationId: string
  name: string
  phone: string
  email: string
  date: string
  time: string
  partySize: number
  notes: string
  status: ReservationStatus
  createdAt: string
}

export type ContactMessage = {
  id: string
  name: string
  email: string
  phone: string
  message: string
  createdAt: string
}

export type Database = {
  settings: Settings
  categories: Category[]
  dishes: Dish[]
  locations: Location[]
  promos: Promo[]
  users: User[]
  sessions: Session[]
  orders: Order[]
  reviews: Review[]
  reservations: Reservation[]
  messages: ContactMessage[]
  orderSeq: number
}

export type LineInput = {
  dishId: string
  size: string
  toppings: string[]
  removed: string[]
  instructions: string
  quantity: number
}

export type CartItem = LineInput & {
  lineId: string
  title: string
  img: string
  unitPrice: number
}
