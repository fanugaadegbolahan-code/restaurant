'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { lineKey } from '@/lib/pricing'
import type { CartItem } from '@/lib/types'

const STORAGE_KEY = 'massino-cart'

type NewItem = Omit<CartItem, 'lineId'>

type CartContextValue = {
  items: CartItem[]
  count: number
  ready: boolean
  addItem: (item: NewItem) => void
  updateQty: (lineId: string, quantity: number) => void
  removeItem: (lineId: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]') as CartItem[]
      if (Array.isArray(parsed)) setItems(parsed.filter((item) => item && item.dishId && item.lineId))
    } catch {
      setItems([])
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, ready])

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0)
    return {
      items,
      count,
      ready,
      addItem: (item) => {
        const lineId = lineKey(item)
        const quantity = Math.min(20, Math.max(1, Math.floor(item.quantity)))
        setItems((current) => {
          const existing = current.find((row) => row.lineId === lineId)
          if (!existing) return [...current, { ...item, lineId, quantity }]
          return current.map((row) =>
            row.lineId === lineId ? { ...row, quantity: Math.min(20, row.quantity + quantity), unitPrice: item.unitPrice } : row,
          )
        })
      },
      updateQty: (lineId, quantity) => {
        const next = Math.floor(quantity)
        setItems((current) =>
          next < 1 ? current.filter((item) => item.lineId !== lineId) : current.map((item) => (item.lineId === lineId ? { ...item, quantity: Math.min(20, next) } : item)),
        )
      },
      removeItem: (lineId) => setItems((current) => current.filter((item) => item.lineId !== lineId)),
      clear: () => setItems([]),
    }
  }, [items, ready])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const value = useContext(CartContext)
  if (!value) throw new Error('useCart must be used within CartProvider')
  return value
}
