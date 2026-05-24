import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { settingsApi, pagesApi } from '../../api'
import { Outlet } from 'react-router-dom'
import Header from './Header'

// Keys that are content blocks inside /about — NOT standalone nav pages
function normalizeUrl(url: string) {
  if (!url) return ''
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

export const ABOUT_PAGE_KEYS = ['about_person', 'about_company', 'certificates']

export function Footer() {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.getAll,
    staleTime: 60 * 60 * 1000,
  })

  const { data: pages } = useQuery({
    queryKey: ['public-pages'],
    queryFn: pagesApi.getAll,
    staleTime: 10 * 60 * 1000,
  })

  const get = (key: string) => settings?.find(s => s.key === key)?.value ?? ''
  const siteName    = get('site_name') || 'KamilKarate'
  const siteLogoUrl = get('site_logo_url')
  const initials    = siteName.split(/\s+/).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'KK'

  // Custom pages = pages that are NOT reserved About-page content blocks
  const customPages = pages?.filter(p => !ABOUT_PAGE_KEYS.includes(p.key)) ?? []

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-white font-bold text-lg">{siteName}</span>
            </div>
            {/* Description comes from site settings — editable in admin/settings */}
            {get('site_description') && (
              <p className="text-sm text-gray-400 leading-relaxed">
                {get('site_description')}
              </p>
            )}
            <div className="flex gap-3 mt-4">
              {get('vk_url') && (
                <a href={get('vk_url')} target="_blank" rel="noreferrer"
                  className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors text-xs font-bold">
                  VK
                </a>
              )}
              {get('telegram_url') && (
                <a href={get('telegram_url')} target="_blank" rel="noreferrer"
                  className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors text-xs font-bold">
                  TG
                </a>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Навигация</h4>
            <ul className="space-y-2 text-sm">
              {[
                { to: '/catalog',   label: 'Каталог' },
                { to: '/favorites', label: 'Избранное' },
                { to: '/articles',  label: 'Блог' },
              ].map(item => (
                <li key={item.to}>
                  <Link to={item.to} className="hover:text-white transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Компания</h4>
            <ul className="space-y-2 text-sm">
              {[
                { to: '/about', label: 'О компании' },
                { to: '/faq',   label: 'Вопрос-ответ' },
              ].map(item => (
                <li key={item.to}>
                  <Link to={item.to} className="hover:text-white transition-colors">{item.label}</Link>
                </li>
              ))}
              {/* Custom pages from admin/pages */}
              {customPages.map(p => (
                <li key={p.key}>
                  <Link to={`/pages/${p.key}`} className="hover:text-white transition-colors">{p.title}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Контакты</h4>
            <ul className="space-y-2 text-sm">
              {get('phone') && <li><a href={`tel:${get('phone')}`} className="hover:text-white">{get('phone')}</a></li>}
              {get('email') && <li><a href={`mailto:${get('email')}`} className="hover:text-white">{get('email')}</a></li>}
            </ul>

            {/* Marketplace buttons — always shown when settings loaded */}
            {settings !== undefined && (
              <div className="mt-5">
                <h4 className="text-white font-semibold mb-3 text-sm">Маркетплейсы</h4>
                <div className="flex gap-2">
                  {get('ozon_url') ? (
                    <a href={normalizeUrl(get('ozon_url'))} target="_blank" rel="noopener noreferrer" title="Ozon"
                      className="w-9 h-9 rounded-lg bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white font-bold text-sm transition-colors">
                      O
                    </a>
                  ) : (
                    <span title="Ozon (ссылка не настроена)"
                      className="w-9 h-9 rounded-lg bg-blue-500 opacity-40 flex items-center justify-center text-white font-bold text-sm cursor-default">
                      O
                    </span>
                  )}
                  {get('wb_url') ? (
                    <a href={normalizeUrl(get('wb_url'))} target="_blank" rel="noopener noreferrer" title="Wildberries"
                      className="w-9 h-9 rounded-lg bg-purple-600 hover:bg-purple-700 flex items-center justify-center text-white font-bold text-sm transition-colors">
                      W
                    </a>
                  ) : (
                    <span title="Wildberries (ссылка не настроена)"
                      className="w-9 h-9 rounded-lg bg-purple-600 opacity-40 flex items-center justify-center text-white font-bold text-sm cursor-default">
                      W
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} {siteName}. Все права защищены.</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-gray-300 transition-colors">Политика конфиденциальности</Link>
            <Link to="/terms" className="hover:text-gray-300 transition-colors">Пользовательское соглашение</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
