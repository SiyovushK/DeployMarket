import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Package, Users, TrendingUp, ShoppingBag, ArrowRight } from 'lucide-react'
import { productsApi } from '../../api'
import { Card, PageLoader, Badge } from '../../components/ui'
import type { ProductStatus } from '../../types'

const statusBadge = (s: ProductStatus) => {
  if (s === 'Published')  return <Badge label="Опубликован" variant="green" />
  if (s === 'OutOfStock') return <Badge label="Нет в наличии" variant="yellow" />
  return <Badge label="Черновик" variant="gray" />
}

// const statusBadge = (s: ProductStatus) => {
//   const statusMap: Record<ProductStatus, { label: string; variant: "green" | "yellow" | "gray" }> = {
//     Published: { label: "Опубликован", variant: "green" },
//     OutOfStock: { label: "Нет в наличии", variant: "yellow" },
//     Draft: { label: "Черновик", variant: "gray" },
//   };

//   const { label, variant } = statusMap[s] || statusMap.Draft;
//   return <Badge label={label} variant={variant} />;
// }

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: productsApi.getDashboard })

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>
        <p className="text-gray-500 text-sm mt-0.5">Обзор магазина</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
            <Package className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Активных товаров</p>
            <p className="text-2xl font-bold text-gray-900">{data?.activeProductsCount ?? 0}</p>
          </div>
        </Card>
        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Покупателей</p>
            <p className="text-2xl font-bold text-gray-900">{data?.registeredBuyersCount ?? 0}</p>
          </div>
        </Card>
      </div>

      {/* Latest products */}
      <Card>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-600" /> Последние товары
          </h2>
          <Link to="/admin/products" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
            Все товары <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {data?.latestProducts?.map(p => (
            <Link key={p.id} to={`/admin/products/${p.id}/edit`}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {p.mainImageUrl
                  ? <img src={p.mainImageUrl} alt={p.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag className="w-4 h-4" /></div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                <p className="text-xs text-gray-400">{p.categoryName}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-gray-900">{p.price.toLocaleString('ru-RU')} ₽</p>
                {statusBadge(p.status)}
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { to: '/admin/products/new', label: 'Добавить товар', icon: Package },
          { to: '/admin/articles/new', label: 'Написать статью', icon: TrendingUp },
          { to: '/admin/banners',      label: 'Управление баннерами', icon: ShoppingBag },
          { to: '/admin/faq',          label: 'Редактировать FAQ', icon: Users },
        ].map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all text-center group">
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
              <Icon className="w-5 h-5 text-primary-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
