import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Tag, FileText, Image, HelpCircle,
  FileEdit, Settings, Users, Menu, X, LogOut, ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api'
import { tokenStorage } from '../../api/client'

const navItems = [
  { to: '/admin',              label: 'Дашборд',    icon: LayoutDashboard, end: true },
  { to: '/admin/products',     label: 'Товары',     icon: Package },
  { to: '/admin/categories',   label: 'Категории',  icon: Tag },
  { to: '/admin/articles',     label: 'Статьи',     icon: FileText },
  { to: '/admin/banners',      label: 'Баннеры',    icon: Image },
  { to: '/admin/faq',          label: 'FAQ',        icon: HelpCircle },
  { to: '/admin/pages',        label: 'Страницы',   icon: FileEdit },
  { to: '/admin/settings',     label: 'Настройки',  icon: Settings, superAdmin: true },
  { to: '/admin/users',        label: 'Пользователи', icon: Users, superAdmin: true },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const isSuperAdmin = user?.role === 'SuperAdmin'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    const rt = tokenStorage.getRefresh()
    if (rt) await authApi.logout(rt).catch(() => {})
    logout()
    navigate('/')
  }

  const isActive = (to: string, end?: boolean) =>
    end ? location.pathname === to : location.pathname.startsWith(to)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo — text only */}
      <div className="flex items-center px-4 h-16 border-b border-gray-200">
        <div>
          <p className="font-bold text-gray-900 text-sm">KamilKarate</p>
          <p className="text-xs text-gray-500">Панель управления</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems
          .filter(item => !item.superAdmin || isSuperAdmin)
          .map(item => {
            const Icon = item.icon
            const active = isActive(item.to, item.end)
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group
                  ${active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {item.label}
                {active && <ChevronRight className="w-3 h-3 ml-auto text-primary-400" />}
              </Link>
            )
          })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-2 px-2 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 text-xs font-bold">{user?.firstName?.[0] ?? 'A'}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-500 truncate">{user?.role}</p>
          </div>
        </div>
        <Link to="/" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          На сайт
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full text-left"
        >
          <LogOut className="w-4 h-4" /> Выйти
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 flex-shrink-0 bg-white border-r border-gray-200 flex-col fixed top-0 left-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile overlay sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-56 bg-white h-full shadow-xl flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center h-14 px-4 bg-white border-b border-gray-200 gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-900 text-sm">KamilKarate Admin</span>
        </div>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
