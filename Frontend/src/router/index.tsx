import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { PageLoader } from '../components/ui'
import PublicLayout from '../components/layout/PublicLayout'
import AdminLayout from '../components/layout/AdminLayout'
import { useFavoritesSync } from '../hooks/useFavoritesSync'
import { useProfileSync } from '../hooks/useProfileSync'

// ── Global wrapper (mounts side-effect hooks once) ────────────────────────
function GlobalProvider() {
  useFavoritesSync()
  useProfileSync()
  return <Outlet />
}

// ── Lazy public pages ─────────────────────────────────────────────────────
const Home          = lazy(() => import('../pages/public/Home'))
const Catalog       = lazy(() => import('../pages/public/Catalog'))
const ProductDetail = lazy(() => import('../pages/public/ProductDetail'))
const Favorites     = lazy(() => import('../pages/public/Favorites'))
const Articles      = lazy(() => import('../pages/public/Articles'))
const ArticleDetail = lazy(() => import('../pages/public/ArticleDetail'))
const About         = lazy(() => import('../pages/public/About'))
const Faq           = lazy(() => import('../pages/public/Faq'))
const Profile       = lazy(() => import('../pages/public/Profile'))
const StaticPage    = lazy(() => import('../pages/public/StaticPage'))
const DynamicPage   = lazy(() => import('../pages/public/DynamicPage'))

// ── Lazy auth pages ───────────────────────────────────────────────────────
const Login    = lazy(() => import('../pages/auth/Login'))
const Register = lazy(() => import('../pages/auth/Register'))

// ── Lazy admin pages ──────────────────────────────────────────────────────
const Dashboard    = lazy(() => import('../pages/admin/Dashboard'))
const ProductsList = lazy(() => import('../pages/admin/products/ProductsList'))
const ProductForm  = lazy(() => import('../pages/admin/products/ProductForm'))
const Categories   = lazy(() => import('../pages/admin/categories/CategoriesList'))
const ArticlesList = lazy(() => import('../pages/admin/articles/ArticlesList'))
const ArticleForm  = lazy(() => import('../pages/admin/articles/ArticleForm'))
const BannersList  = lazy(() => import('../pages/admin/banners/BannersList'))
const FaqList      = lazy(() => import('../pages/admin/faq/FaqList'))
const PagesList    = lazy(() => import('../pages/admin/pages/PagesList'))
const SiteSettings = lazy(() => import('../pages/admin/settings/SiteSettings'))
const UsersList    = lazy(() => import('../pages/admin/users/UsersList'))

// ── Route guards ──────────────────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  // Role not yet known — profile is loading (e.g. after page refresh with refresh token)
  if (!role && !user?.id) return <PageLoader />
  if (role !== 'ContentManager' && role !== 'SuperAdmin') return <Navigate to="/" replace />
  return <>{children}</>
}

function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  // Role not yet known — wait for profile to load
  if (!role && !user?.id) return <PageLoader />
  if (role !== 'SuperAdmin') return <Navigate to="/admin" replace />
  return <>{children}</>
}

const S = (C: React.LazyExoticComponent<() => JSX.Element>) => (
  <Suspense fallback={<PageLoader />}><C /></Suspense>
)

export const router = createBrowserRouter([
  {
    // Root: mounts global hooks for every route
    element: <GlobalProvider />,
    children: [

      // ── Public ─────────────────────────────────────────────────────────
      {
        element: <PublicLayout />,
        children: [
          { path: '/',               element: S(Home) },
          { path: '/catalog',        element: S(Catalog) },
          { path: '/products/:id',   element: S(ProductDetail) },
          { path: '/favorites',      element: S(Favorites) },
          { path: '/articles',       element: S(Articles) },
          { path: '/articles/:slug', element: S(ArticleDetail) },
          { path: '/about',          element: S(About) },
          { path: '/faq',            element: S(Faq) },
          { path: '/privacy',        element: S(StaticPage) },
          { path: '/terms',          element: S(StaticPage) },
          { path: '/pages/:key',     element: S(DynamicPage) },
          {
            path: '/profile',
            element: <RequireAuth>{S(Profile)}</RequireAuth>,
          },
        ],
      },

      // ── Auth ────────────────────────────────────────────────────────────
      { path: '/login',    element: S(Login) },
      { path: '/register', element: S(Register) },

      // ── Admin ───────────────────────────────────────────────────────────
      {
        path: '/admin',
        element: <RequireAdmin><AdminLayout /></RequireAdmin>,
        children: [
          { index: true,               element: S(Dashboard) },
          { path: 'products',          element: S(ProductsList) },
          { path: 'products/new',      element: S(ProductForm) },
          { path: 'products/:id/edit', element: S(ProductForm) },
          { path: 'categories',        element: S(Categories) },
          { path: 'articles',          element: S(ArticlesList) },
          { path: 'articles/new',      element: S(ArticleForm) },
          { path: 'articles/:id/edit', element: S(ArticleForm) },
          { path: 'banners',           element: S(BannersList) },
          { path: 'faq',               element: S(FaqList) },
          { path: 'pages',             element: S(PagesList) },
          {
            path: 'settings',
            element: <RequireSuperAdmin>{S(SiteSettings)}</RequireSuperAdmin>,
          },
          {
            path: 'users',
            element: <RequireSuperAdmin>{S(UsersList)}</RequireSuperAdmin>,
          },
        ],
      },

      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
