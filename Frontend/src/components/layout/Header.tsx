import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, User, Search, Menu, X, LogOut, Settings, ChevronDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { useFavoritesStore } from '../../store/favoritesStore'
import { authApi, pagesApi, categoriesApi, settingsApi } from '../../api'
import { tokenStorage } from '../../api/client'
import { ABOUT_PAGE_KEYS } from './PublicLayout'

const FIXED_NAV = [
  { to: '/catalog',  label: 'Каталог' },
  { to: '/articles', label: 'Блог' },
  { to: '/about',    label: 'О компании' },
  { to: '/faq',      label: 'Вопрос-ответ' },
]

// Ensure URL always has a protocol so browser doesn't treat it as relative path
function normalizeUrl(url: string): string {
  if (!url) return ''
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

// Marketplace button — always visible; dimmed when URL not configured yet
function MpButton({ rawUrl, label, bg, hoverBg }: {
  rawUrl: string; label: string; bg: string; hoverBg: string
}) {
  const href = normalizeUrl(rawUrl)
  if (!href) {
    return (
      <span
        title={`${label} (ссылка не настроена в настройках)`}
        className={`w-8 h-8 rounded-lg ${bg} opacity-40 flex items-center justify-center text-white font-bold text-sm cursor-default select-none flex-shrink-0`}
      >
        {label[0]}
      </span>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className={`w-8 h-8 rounded-lg ${bg} ${hoverBg} flex items-center justify-center text-white font-bold text-sm transition-colors flex-shrink-0`}
    >
      {label[0]}
    </a>
  )
}

export default function Header() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const { serverItems, guestItems } = useFavoritesStore()
  const [menuOpen, setMenuOpen]           = useState(false)
  const [userMenuOpen, setUserMenuOpen]   = useState(false)
  const [searchValue, setSearchValue]     = useState('')
  const [catDropOpen, setCatDropOpen]     = useState(false)
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null)
  const navigate = useNavigate()

  const { data: pages } = useQuery({
    queryKey: ['public-pages'],
    queryFn: pagesApi.getAll,
    staleTime: 10 * 60 * 1000,
  })

  const { data: siteSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.getAll,
    staleTime: 10 * 60 * 1000,
  })
  const siteName    = siteSettings?.find(s => s.key === 'site_name')?.value    || 'KamilKarate'
  const ozonUrl     = siteSettings?.find(s => s.key === 'ozon_url')?.value     ?? ''
  const wbUrl       = siteSettings?.find(s => s.key === 'wb_url')?.value       ?? ''

  const customNavPages = (pages ?? [])
    .filter(p => !ABOUT_PAGE_KEYS.includes(p.key))
    .map(p => ({ to: `/pages/${p.key}`, label: p.title }))

  const { data: flatCategories } = useQuery({
    queryKey: ['categories-flat'],
    queryFn: categoriesApi.getFlat,
    staleTime: 10 * 60 * 1000,
  })
  const rootCategories  = (flatCategories ?? []).filter(c => !c.parentId)
  const selectedCatName = selectedCatId
    ? rootCategories.find(c => c.id === selectedCatId)?.name ?? 'Везде'
    : 'Везде'

  // Close category dropdown on outside click (class-based — works for both desktop & mobile)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.cat-drop-container')) setCatDropOpen(false)
    }
    if (catDropOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [catDropOpen])

  const navItems = [...FIXED_NAV, ...customNavPages]
  const favCount = isAuthenticated ? serverItems.length : guestItems.length

  const handleLogout = async () => {
    const refreshToken = tokenStorage.getRefresh()
    if (refreshToken) await authApi.logout(refreshToken).catch(() => {})
    logout()
    navigate('/')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params: Record<string, string> = {}
    if (searchValue.trim()) params.search = searchValue.trim()
    if (selectedCatId)      params.categoryId = String(selectedCatId)
    if (Object.keys(params).length > 0)
      navigate(`/catalog?${new URLSearchParams(params).toString()}`)
  }

  // Show marketplace buttons once settings have been fetched (even if URLs are empty)
  const settingsLoaded = siteSettings !== undefined

  // Search bar — defined as inline JSX factory to avoid reusing the same ref in two places;
  // uses CSS class .cat-drop-container for outside-click detection instead of a ref
  const renderSearchBar = () => (
    <div className="cat-drop-container relative w-full flex">
      {/* Category selector */}
      <button
        type="button"
        onClick={() => setCatDropOpen(v => !v)}
        className="flex items-center gap-1 h-full px-3 bg-gray-100 hover:bg-gray-200 border border-gray-200 border-r-0 rounded-l-full text-sm text-gray-600 transition-colors whitespace-nowrap flex-shrink-0"
      >
        <span className="hidden sm:inline max-w-[110px] truncate">{selectedCatName}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${catDropOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown list */}
      {catDropOpen && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 max-h-72 overflow-y-auto">
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); setSelectedCatId(null); setCatDropOpen(false) }}
            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
              selectedCatId === null ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Везде
          </button>
          {rootCategories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onMouseDown={e => { e.preventDefault(); setSelectedCatId(cat.id); setCatDropOpen(false) }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                selectedCatId === cat.id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Text input */}
      <input
        value={searchValue}
        onChange={e => setSearchValue(e.target.value)}
        placeholder="Поиск товаров..."
        className="flex-1 pl-4 pr-10 py-2 border border-gray-200 rounded-r-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-gray-50"
      />
      <button
        type="submit"
        className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-gray-400 hover:text-primary-600 transition-colors"
      >
        <Search className="w-4 h-4" />
      </button>
    </div>
  )

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">

        {/* ── Top bar ──────────────────────────────────────────────── */}
        <div className="flex items-center h-16 gap-4">

          {/* Logo — text only */}
          <Link to="/" className="flex-shrink-0">
            <span className="font-bold text-gray-900 text-lg">{siteName}</span>
          </Link>

          {/* Search (desktop) — flex-1 + mx-auto gives it room to breathe */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto hidden md:flex">
            {renderSearchBar()}
          </form>

          {/* Marketplace buttons (desktop) */}
          {settingsLoaded && (
            <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
              <MpButton rawUrl={ozonUrl} label="Ozon"         bg="bg-blue-500"   hoverBg="hover:bg-blue-600"   />
              <MpButton rawUrl={wbUrl}   label="Wildberries"  bg="bg-purple-600" hoverBg="hover:bg-purple-700" />
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto md:ml-0">
            {/* Favourites */}
            <Link to="/favorites"
              className="relative p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <Heart className="w-5 h-5" />
              {favCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {favCount > 9 ? '9+' : favCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 text-xs font-semibold">
                      {user?.firstName?.[0]?.toUpperCase() ?? 'U'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700 hidden sm:block">{user?.firstName}</span>
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <User className="w-4 h-4" /> Личный кабинет
                      </Link>
                      {(user?.role === 'ContentManager' || user?.role === 'SuperAdmin') && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <Settings className="w-4 h-4" /> Панель управления
                        </Link>
                      )}
                      <hr className="my-1 border-gray-100" />
                      <button onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                        <LogOut className="w-4 h-4" /> Выйти
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login"
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                <User className="w-4 h-4" />
                <span className="hidden sm:block">Войти</span>
              </Link>
            )}

            {/* Mobile burger */}
            <button onClick={() => setMenuOpen(v => !v)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg md:hidden">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ── Navigation ───────────────────────────────────────────── */}
        <nav className={`${menuOpen ? 'block' : 'hidden'} md:block border-t border-gray-50 md:border-0`}>
          <ul className="flex flex-col md:flex-row md:items-center gap-0 md:gap-1 py-2 md:py-0 pb-3 md:pb-0">
            {navItems.map(item => (
              <li key={item.to}>
                <Link to={item.to} onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* ── Mobile search + marketplace ──────────────────────────── */}
      <div className="md:hidden px-4 pb-3 space-y-2">
        <form onSubmit={handleSearch}>
          {renderSearchBar()}
        </form>
        {settingsLoaded && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Маркетплейсы:</span>
            <MpButton rawUrl={ozonUrl} label="Ozon"        bg="bg-blue-500"   hoverBg="hover:bg-blue-600"   />
            <MpButton rawUrl={wbUrl}   label="Wildberries" bg="bg-purple-600" hoverBg="hover:bg-purple-700" />
          </div>
        )}
      </div>
    </header>
  )
}
