// ── Auth ──────────────────────────────────────────────────────────────────
export interface AuthResponse {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: string
  email: string
  firstName: string
  lastName: string
  role: string
}

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: string
  createdAt: string
}

// ── Products ──────────────────────────────────────────────────────────────
export type ProductStatus = 'Draft' | 'Published' | 'OutOfStock'

export interface ProductImage {
  id: number
  url: string
  isMain: boolean
  isCertificate: boolean
  sortOrder: number
}

export interface ProductIngredient {
  id: number
  name: string
  dosage: string
  dailyValuePercent: string | null
  sortOrder: number
}

export interface Product {
  id: number
  name: string
  sku: string
  price: number
  shortDescription: string | null
  fullDescription: string | null
  usage: string | null
  contraindications: string | null
  ozonUrl: string | null
  wildberriesUrl: string | null
  status: ProductStatus
  isHit: boolean
  isNew: boolean
  createdAt: string
  categoryId: number
  categoryName: string
  images: ProductImage[]
  ingredients: ProductIngredient[]
}

export interface ProductListItem {
  id: number
  name: string
  sku: string
  price: number
  mainImageUrl: string | null
  status: ProductStatus
  isHit: boolean
  isNew: boolean
  categoryName: string
}

export interface ProductQueryParams {
  search?: string
  categoryId?: number
  status?: ProductStatus
  priceMin?: number
  priceMax?: number
  isHit?: boolean
  isNew?: boolean
  sortBy?: 'price_asc' | 'price_desc' | 'createdAt'
  page?: number
  pageSize?: number
}

// ── Categories ────────────────────────────────────────────────────────────
export interface Category {
  id: number
  name: string
  slug: string
  sortOrder: number
  parentId: number | null
  children: Category[]
}

export interface CategoryFlat {
  id: number
  name: string
  slug: string
  sortOrder: number
  parentId: number | null
  parentName: string | null
}

// ── Favorites ─────────────────────────────────────────────────────────────
export interface FavoriteItem {
  productId: number
  name: string
  price: number
  mainImageUrl: string | null
  ozonUrl: string | null
  wildberriesUrl: string | null
  addedAt: string
}

// ── Articles ──────────────────────────────────────────────────────────────
export interface ArticleListItem {
  id: number
  title: string
  slug: string
  coverImageUrl: string | null
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
}

export interface Article {
  id: number
  title: string
  slug: string
  coverImageUrl: string | null
  content: string
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
}

// ── Banners ───────────────────────────────────────────────────────────────
export interface Banner {
  id: number
  imageUrl: string
  linkUrl: string | null
  title: string | null
  description: string | null
  sortOrder: number
  isActive: boolean
}

// ── FAQ ───────────────────────────────────────────────────────────────────
export interface FaqItem {
  id: number
  question: string
  answer: string
  sortOrder: number
}

// ── Page content ──────────────────────────────────────────────────────────
export interface PageContent {
  id: number
  key: string
  title: string
  content: string | null
  imageUrl: string | null
  updatedAt: string
}

// ── Site settings ─────────────────────────────────────────────────────────
export interface SiteSetting {
  key: string
  value: string
}

// ── Admin ─────────────────────────────────────────────────────────────────
export interface BuyerListItem {
  id: string
  email: string
  fullName: string
  status: string
  createdAt: string
}

export interface StaffListItem {
  id: string
  email: string
  fullName: string
  role: string
  status: string
  createdAt: string
}

export interface Dashboard {
  activeProductsCount: number
  registeredBuyersCount: number
  latestProducts: ProductListItem[]
}

// ── Generic ───────────────────────────────────────────────────────────────
export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  code: string
  message: string
}
