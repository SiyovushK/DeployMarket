import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Heart, ShoppingBag, Filter, X, ChevronDown } from 'lucide-react'
import { productsApi, categoriesApi, favoritesApi } from '../../api'
import { useFavoritesStore } from '../../store/favoritesStore'
import { useAuthStore } from '../../store/authStore'
import { Pagination, PageLoader, Empty } from '../../components/ui'
import type { ProductListItem, Category } from '../../types'

function ProductCard({ product }: { product: ProductListItem }) {
  const { isAuthenticated } = useAuthStore()
  const { ids, addGuest, removeGuest, addServer, removeServer } = useFavoritesStore()
  const isFaved = ids.has(product.id)

  const handleFav = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (isAuthenticated) {
      if (isFaved) {
        removeServer(product.id)
        await favoritesApi.remove(product.id)
      } else {
        addServer(product)
        await favoritesApi.add(product.id)
      }
    } else {
      if (isFaved) removeGuest(product.id)
      else addGuest(product)
    }
  }

  return (
    <Link to={`/products/${product.id}`} className="group bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all overflow-hidden flex flex-col">
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {product.mainImageUrl
          ? <img src={product.mainImageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-gray-200"><ShoppingBag className="w-16 h-16" /></div>
        }
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isHit && <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">🔥 Хит</span>}
          {product.isNew && <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">Новинка</span>}
        </div>
        <button onClick={handleFav}
          className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors shadow
            ${isFaved ? 'bg-red-500 text-white' : 'bg-white text-gray-400 hover:text-red-500'}`}
        >
          <Heart className="w-4 h-4" fill={isFaved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="text-xs text-gray-400">{product.categoryName}</p>
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</h3>
        <p className="text-lg font-bold text-gray-900 mt-auto">{product.price.toLocaleString('ru-RU')} ₽</p>
      </div>
    </Link>
  )
}

// CategoryTree принимает expanded и onToggleExpand как props — стейт живёт в Catalog
function CategoryTree({ categories, selected, onSelect, expanded, onToggleExpand }: {
  categories: Category[]
  selected: number | null
  onSelect: (id: number | null) => void
  expanded: Set<number>
  onToggleExpand: (id: number) => void
}) {
  const renderNode = (cat: Category, depth = 0) => {
    const hasChildren = (cat.children?.length ?? 0) > 0
    const isExpanded = expanded.has(cat.id)
    const isSelected = selected === cat.id

    return (
      <div key={cat.id}>
        <div className="flex items-center">
          {hasChildren ? (
            <button
              onClick={e => { e.stopPropagation(); onToggleExpand(cat.id) }}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              style={{ marginLeft: depth * 12 }}
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
            </button>
          ) : (
            <span className="flex-shrink-0 w-6" style={{ marginLeft: depth * 12 }} />
          )}

          <button
            onClick={() => onSelect(isSelected ? null : cat.id)}
            className={[
              'flex-1 text-left py-1.5 pr-3 text-sm rounded-lg transition-colors',
              depth === 0 ? 'font-medium' : 'text-gray-500',
              isSelected
                ? 'text-primary-700 font-medium'
                : depth === 0
                  ? 'text-gray-800 hover:text-primary-600'
                  : 'hover:text-gray-700',
            ].join(' ')}
          >
            {cat.name}
          </button>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {cat.children.map(c => renderNode(c, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      <button
        onClick={() => onSelect(null)}
        className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors font-medium ${
          selected === null ? 'bg-primary-50 text-primary-700' : 'text-gray-800 hover:bg-gray-50'
        }`}
      >
        Все категории
      </button>
      {categories.filter(c => !c.parentId).map(c => renderNode(c))}
    </div>
  )
}

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Стейт раскрытия категорий живёт здесь — не сбрасывается при смене фильтров
  const [catExpanded, setCatExpanded] = useState<Set<number>>(new Set())
  const toggleCatExpand = (id: number) => {
    setCatExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const categoryId = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined
  const search = searchParams.get('search') ?? undefined
  const sortBy = (searchParams.get('sortBy') as any) ?? 'createdAt'
  const isHit = searchParams.get('isHit') === 'true' ? true : undefined
  const isNew = searchParams.get('isNew') === 'true' ? true : undefined
  const page = Number(searchParams.get('page') ?? '1')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'list', { categoryId, search, sortBy, isHit, isNew, page, priceMin, priceMax }],
    queryFn: () => productsApi.getList({
      categoryId, search, sortBy, isHit, isNew, page, pageSize: 20,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
    }),
  })

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.getTree })

  const setParam = (key: string, value: string | null) => {
    setSearchParams(prev => {
      if (value) prev.set(key, value); else prev.delete(key)
      prev.delete('page')
      return prev
    })
  }

  // JSX фильтров — не компонент, а просто переменная, чтобы не вызывать unmount
  const filtersContent = (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-2 text-sm">Категория</h3>
        <CategoryTree
          categories={categories ?? []}
          selected={categoryId ?? null}
          onSelect={id => setParam('categoryId', id ? String(id) : null)}
          expanded={catExpanded}
          onToggleExpand={toggleCatExpand}
        />
      </div>

      {/* Price */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-2 text-sm">Цена, ₽</h3>
        <div className="flex gap-2 items-center">
          <input
            type="number" placeholder="от" value={priceMin} onChange={e => setPriceMin(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number" placeholder="до" value={priceMax} onChange={e => setPriceMax(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
          />
        </div>
      </div>

      {/* Flags */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900 mb-2 text-sm">Фильтры</h3>
        {[
          { label: 'Хиты продаж', key: 'isHit', active: isHit },
          { label: 'Новинки', key: 'isNew', active: isNew },
        ].map(f => (
          <label key={f.key} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!f.active}
              onChange={() => setParam(f.key, f.active ? null : 'true')}
              className="rounded text-primary-600 focus:ring-primary-400"
            />
            <span className="text-sm text-gray-700">{f.label}</span>
          </label>
        ))}
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Каталог</h1>
          {data && <p className="text-sm text-gray-500 mt-0.5">{data.totalCount} товаров</p>}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFiltersOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium"
          >
            <Filter className="w-4 h-4" /> Фильтры
          </button>
          <select
            value={sortBy}
            onChange={e => setParam('sortBy', e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
          >
            <option value="createdAt">По новизне</option>
            <option value="price_asc">Цена ↑</option>
            <option value="price_desc">Цена ↓</option>
          </select>
        </div>
      </div>

      {/* Active tags — только поиск, без тега категории */}
      {search && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
            «{search}» <button onClick={() => setParam('search', null)}><X className="w-3 h-3" /></button>
          </span>
        </div>
      )}

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 p-4 sticky top-24">
            {filtersContent}
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {isLoading ? <PageLoader /> : (data?.items?.length === 0)
            ? <Empty icon={<ShoppingBag className="w-12 h-12" />} title="Товары не найдены" description="Попробуйте изменить параметры поиска" />
            : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {data!.items.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
                <div className="flex justify-center mt-8">
                  <Pagination
                    page={page}
                    totalPages={data!.totalPages}
                    onChange={p => setParam('page', String(p))}
                  />
                </div>
              </>
            )
          }
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div className="relative ml-auto w-72 bg-white h-full p-5 overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900">Фильтры</h2>
              <button onClick={() => setFiltersOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            {filtersContent}
          </div>
        </div>
      )}
    </div>
  )
}
