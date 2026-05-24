import { create } from 'zustand'
import type { FavoriteItem, ProductListItem } from '../types'

const STORAGE_KEY = 'guest_favorites'

// Minimal shape stored for guests
interface GuestFavorite {
  productId: number
  name: string
  price: number
  mainImageUrl: string | null
  ozonUrl: string | null
  wildberriesUrl: string | null
}

const loadGuest = (): GuestFavorite[] => {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]') }
  catch { return [] }
}

const saveGuest = (items: GuestFavorite[]) =>
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items))

interface FavoritesState {
  // server-side (auth users)
  serverItems: FavoriteItem[]
  // guest session
  guestItems: GuestFavorite[]

  // unified view
  ids: Set<number>

  setServerItems: (items: FavoriteItem[]) => void
  addGuest:       (product: ProductListItem) => void
  removeGuest:    (productId: number) => void
  clearGuest:     () => void

  // оптимистичные обновления для авторизованных пользователей
  addServer:    (product: ProductListItem) => void
  removeServer: (productId: number) => void
}

export const useFavoritesStore = create<FavoritesState>((set, get) => {
  const guestItems = loadGuest()
  return {
    serverItems: [],
    guestItems,
    ids: new Set(guestItems.map(i => i.productId)),

    setServerItems: (items) =>
      set({ serverItems: items, ids: new Set(items.map(i => i.productId)) }),

    addGuest: (product) => {
      const exists = get().guestItems.some(i => i.productId === product.id)
      if (exists) return
      const item: GuestFavorite = {
        productId: product.id,
        name: product.name,
        price: product.price,
        mainImageUrl: product.mainImageUrl,
        ozonUrl: null,
        wildberriesUrl: null,
      }
      const next = [...get().guestItems, item]
      saveGuest(next)
      set({ guestItems: next, ids: new Set(next.map(i => i.productId)) })
    },

    removeGuest: (productId) => {
      const next = get().guestItems.filter(i => i.productId !== productId)
      saveGuest(next)
      set({ guestItems: next, ids: new Set(next.map(i => i.productId)) })
    },

    clearGuest: () => {
      saveGuest([])
      set({ guestItems: [], ids: new Set() })
    },

    addServer: (product) => {
      const state = get()
      if (state.ids.has(product.id)) return
      const item: FavoriteItem = {
        productId: product.id,
        name: product.name,
        price: product.price,
        mainImageUrl: product.mainImageUrl,
        ozonUrl: null,
        wildberriesUrl: null,
        addedAt: new Date().toISOString(),
      }
      const next = [...state.serverItems, item]
      set({ serverItems: next, ids: new Set(next.map(i => i.productId)) })
    },

    removeServer: (productId) => {
      const next = get().serverItems.filter(i => i.productId !== productId)
      set({ serverItems: next, ids: new Set(next.map(i => i.productId)) })
    },
  }
})
