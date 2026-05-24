import { client } from './client'
import type {
  AuthResponse, UserProfile, Product, ProductListItem, ProductQueryParams,
  PagedResult, Category, CategoryFlat, FavoriteItem, ArticleListItem, Article,
  Banner, FaqItem, PageContent, SiteSetting, BuyerListItem, StaffListItem, Dashboard,
} from '../types'

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; firstName: string; lastName?: string; phone?: string }) =>
    client.post<AuthResponse>('/auth/register', data).then(r => r.data),

  login: (data: { email: string; password: string }) =>
    client.post<AuthResponse>('/auth/login', data).then(r => r.data),

  refresh: (refreshToken: string) =>
    client.post<AuthResponse>('/auth/refresh', { refreshToken }).then(r => r.data),

  logout: (refreshToken: string) =>
    client.post('/auth/logout', { refreshToken }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    client.post('/auth/change-password', data),
}

// ── Profile ───────────────────────────────────────────────────────────────
export const profileApi = {
  get: () =>
    client.get<UserProfile>('/profile').then(r => r.data),

  update: (data: { firstName?: string; lastName?: string; phone?: string }) =>
    client.put<UserProfile>('/profile', data).then(r => r.data),
}

// ── Products ──────────────────────────────────────────────────────────────
export const productsApi = {
  getList: (params?: ProductQueryParams) =>
    client.get<PagedResult<ProductListItem>>('/products', { params }).then(r => r.data),

  getAdminList: (params?: ProductQueryParams) =>
    client.get<PagedResult<ProductListItem>>('/products/admin', { params }).then(r => r.data),

  getById: (id: number) =>
    client.get<Product>(`/products/${id}`).then(r => r.data),

  create: (data: Partial<Product>) =>
    client.post<Product>('/products', data).then(r => r.data),

  update: (id: number, data: Partial<Product>) =>
    client.put<Product>(`/products/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    client.delete(`/products/${id}`),

  uploadImage: (productId: number, file: File, isMain = false, isCertificate = false) => {
    const form = new FormData()
    form.append('file', file)
    return client.post<{ url: string }>(
      `/products/${productId}/images?isMain=${isMain}&isCertificate=${isCertificate}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ).then(r => r.data)
  },

  setMainImage: (productId: number, imageId: number) =>
    client.patch(`/products/${productId}/images/${imageId}/set-main`),

  deleteImage: (imageId: number) =>
    client.delete(`/products/images/${imageId}`),

  updateIngredients: (productId: number, ingredients: object[]) =>
    client.put<Product>(`/products/${productId}/ingredients`, ingredients).then(r => r.data),

  getDashboard: () =>
    client.get<Dashboard>('/products/dashboard').then(r => r.data),
}

// ── Categories ────────────────────────────────────────────────────────────
export const categoriesApi = {
  getTree: () =>
    client.get<Category[]>('/categories/tree').then(r => r.data),

  getFlat: () =>
    client.get<CategoryFlat[]>('/categories/flat').then(r => r.data),

  create: (data: { name: string; parentId?: number; sortOrder?: number }) =>
    client.post<Category>('/categories', data).then(r => r.data),

  update: (id: number, data: { name?: string; parentId?: number; sortOrder?: number }) =>
    client.put<Category>(`/categories/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    client.delete(`/categories/${id}`),

  reorder: (items: Array<{ id: number; sortOrder: number }>) =>
    client.post('/categories/reorder', items),
}

// ── Favorites ─────────────────────────────────────────────────────────────
export const favoritesApi = {
  get: () =>
    client.get<FavoriteItem[]>('/favorites').then(r => r.data),

  add: (productId: number) =>
    client.post(`/favorites/${productId}`),

  remove: (productId: number) =>
    client.delete(`/favorites/${productId}`),

  clear: () =>
    client.delete('/favorites'),
}

// ── Articles ──────────────────────────────────────────────────────────────
export const articlesApi = {
  getList: (page = 1, pageSize = 10) =>
    client.get<PagedResult<ArticleListItem>>('/articles', { params: { page, pageSize } }).then(r => r.data),

  getAdminList: (page = 1, pageSize = 20) =>
    client.get<PagedResult<ArticleListItem>>('/articles/admin', { params: { page, pageSize } }).then(r => r.data),

  getBySlug: (slug: string) =>
    client.get<Article>(`/articles/${slug}`).then(r => r.data),

  getById: (id: number) =>
    client.get<Article>(`/articles/admin/${id}`).then(r => r.data),

  create: (data: { title: string; content: string; isPublished?: boolean }, cover?: File) => {
    const form = new FormData()
    form.append('title', data.title)
    form.append('content', data.content)
    form.append('isPublished', String(data.isPublished ?? false))
    if (cover) form.append('cover', cover)
    return client.post<Article>('/articles', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
  },

  update: (id: number, data: { title?: string; content?: string; isPublished?: boolean }, cover?: File) => {
    const form = new FormData()
    if (data.title !== undefined) form.append('title', data.title)
    if (data.content !== undefined) form.append('content', data.content)
    if (data.isPublished !== undefined) form.append('isPublished', String(data.isPublished))
    if (cover) form.append('cover', cover)
    return client.put<Article>(`/articles/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
  },

  delete: (id: number) =>
    client.delete(`/articles/${id}`),
}

// ── Banners ───────────────────────────────────────────────────────────────
export const bannersApi = {
  getActive: () =>
    client.get<Banner[]>('/banners').then(r => r.data),

  getAll: () =>
    client.get<Banner[]>('/banners/admin').then(r => r.data),

  create: (data: { linkUrl?: string; title?: string; description?: string; sortOrder?: number; isActive?: boolean }, image: File) => {
    const form = new FormData()
    form.append('image', image)
    if (data.linkUrl)     form.append('linkUrl', data.linkUrl)
    if (data.title)       form.append('title', data.title)
    if (data.description) form.append('description', data.description)
    form.append('sortOrder', String(data.sortOrder ?? 0))
    form.append('isActive', String(data.isActive ?? true))
    return client.post<Banner>('/banners', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
  },

  update: (id: number, data: Partial<Banner>, image?: File) => {
    const form = new FormData()
    if (data.linkUrl     !== undefined) form.append('linkUrl', data.linkUrl ?? '')
    if (data.title       !== undefined) form.append('title', data.title ?? '')
    if (data.description !== undefined) form.append('description', data.description ?? '')
    if (data.sortOrder   !== undefined) form.append('sortOrder', String(data.sortOrder))
    if (data.isActive    !== undefined) form.append('isActive', String(data.isActive))
    if (image) form.append('image', image)
    return client.put<Banner>(`/banners/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
  },

  delete: (id: number) =>
    client.delete(`/banners/${id}`),
}

// ── FAQ ───────────────────────────────────────────────────────────────────
export const faqApi = {
  getAll: () =>
    client.get<FaqItem[]>('/faq').then(r => r.data),

  create: (data: { question: string; answer: string; sortOrder?: number }) =>
    client.post<FaqItem>('/faq', data).then(r => r.data),

  update: (id: number, data: { question: string; answer: string; sortOrder?: number }) =>
    client.put<FaqItem>(`/faq/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    client.delete(`/faq/${id}`),

  reorder: (items: Array<{ id: number; sortOrder: number }>) =>
    client.post('/faq/reorder', items),
}

// ── Page content ──────────────────────────────────────────────────────────
export const pagesApi = {
  getAll: () =>
    client.get<PageContent[]>('/pages').then(r => r.data),

  getByKey: (key: string) =>
    client.get<PageContent>(`/pages/${key}`).then(r => r.data),

  create: (data: { key: string; title: string; content?: string }, image?: File) => {
    const form = new FormData()
    form.append('key', data.key)
    form.append('title', data.title)
    if (data.content) form.append('content', data.content)
    if (image) form.append('image', image)
    return client.post<PageContent>('/pages', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
  },

  update: (key: string, data: { title?: string; content?: string }, image?: File) => {
    const form = new FormData()
    if (data.title !== undefined) form.append('title', data.title)
    if (data.content !== undefined) form.append('content', data.content)
    if (image) form.append('image', image)
    return client.put<PageContent>(`/pages/${key}`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
  },

  delete: (key: string) =>
    client.delete(`/pages/${key}`),
}

// ── Site settings ─────────────────────────────────────────────────────────
export const settingsApi = {
  getAll: () =>
    client.get<SiteSetting[]>('/settings').then(r => r.data),

  update: (key: string, value: string) =>
    client.put<SiteSetting>(`/settings/${key}`, { value }).then(r => r.data),

  uploadLogo: (file: File) => {
    const form = new FormData()
    form.append('image', file)
    return client.post<SiteSetting>('/settings/logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
}

// ── Admin users ───────────────────────────────────────────────────────────
export const galleryApi = {
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return client.post<{ url: string }>('/gallery/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
  deleteFile: (url: string) =>
    client.delete('/gallery/file', { params: { url } }),
}

export const adminUsersApi = {
  getBuyers: (page = 1, pageSize = 20, search?: string) =>
    client.get<PagedResult<BuyerListItem>>('/admin/users/buyers', { params: { page, pageSize, search } }).then(r => r.data),

  getStaff: (page = 1, pageSize = 20, search?: string) =>
    client.get<PagedResult<StaffListItem>>('/admin/users/staff', { params: { page, pageSize, search } }).then(r => r.data),

  createStaff: (data: { email: string; password: string; firstName: string; lastName?: string; roleName: string }) =>
    client.post('/admin/users/staff', data),

  setStatus: (id: string, block: boolean) =>
    client.patch(`/admin/users/staff/${id}/status`, { block }),
}
