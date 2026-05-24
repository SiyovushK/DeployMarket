import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Heart, ExternalLink, ChevronLeft, ShoppingBag, Package } from 'lucide-react'
import { productsApi, favoritesApi } from '../../api'
import { useAuthStore } from '../../store/authStore'
import { useFavoritesStore } from '../../store/favoritesStore'
import { PageLoader, Badge } from '../../components/ui'

type Tab = 'description' | 'composition' | 'usage' | 'certificates'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('description')
  const [activeImage, setActiveImage] = useState(0)
  const { isAuthenticated } = useAuthStore()
  const { ids, addGuest, removeGuest, addServer, removeServer } = useFavoritesStore()

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getById(Number(id)),
    enabled: !!id,
  })

  if (isLoading) return <PageLoader />
  if (!product) return <div className="text-center py-20 text-gray-500">Товар не найден</div>

  const isFaved = ids.has(product.id)
  const mainImages = product.images.filter(i => !i.isCertificate).sort((a, b) => a.sortOrder - b.sortOrder)
  const certImages = product.images.filter(i => i.isCertificate)
  const displayImages = mainImages.length > 0 ? mainImages : product.images

  const handleFav = async () => {
    if (isAuthenticated) {
      if (isFaved) {
        removeServer(product.id)
        await favoritesApi.remove(product.id)
      } else {
        addServer({
          id: product.id, name: product.name, price: product.price,
          mainImageUrl: displayImages[0]?.url ?? null,
          status: product.status, isHit: product.isHit, isNew: product.isNew,
          categoryName: product.categoryName, sku: product.sku,
        })
        await favoritesApi.add(product.id)
      }
    } else {
      if (isFaved) removeGuest(product.id)
      else addGuest({
        id: product.id, name: product.name, price: product.price,
        mainImageUrl: displayImages[0]?.url ?? null,
        status: product.status, isHit: product.isHit, isNew: product.isNew,
        categoryName: product.categoryName, sku: product.sku,
      })
    }
  }

  const tabs: { key: Tab; label: string; show: boolean }[] = ([
    { key: 'description' as Tab, label: 'Описание',         show: !!product.fullDescription },
    { key: 'composition' as Tab, label: 'Состав',           show: product.ingredients.length > 0 },
    { key: 'usage'       as Tab, label: 'Применение',       show: !!product.usage || !!product.contraindications },
    { key: 'certificates'as Tab, label: 'Сертификаты',      show: certImages.length > 0 },
  ] as { key: Tab; label: string; show: boolean }[]).filter(t => t.show)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-primary-600">Главная</Link>
        <span>/</span>
        <Link to="/catalog" className="hover:text-primary-600">Каталог</Link>
        <span>/</span>
        <span className="text-gray-900 truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
            {displayImages[activeImage]
              ? <img src={displayImages[activeImage].url} alt={product.name} className="w-full h-full object-contain p-4" />
              : <div className="w-full h-full flex items-center justify-center text-gray-200"><Package className="w-24 h-24" /></div>
            }
          </div>
          {displayImages.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {displayImages.map((img, i) => (
                <button key={img.id} onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === activeImage ? 'border-primary-500' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">{product.categoryName} · Арт. {product.sku}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {product.isHit && <Badge label="Хит продаж" variant="green" />}
            {product.isNew && <Badge label="Новинка" variant="blue" />}
            {product.status === 'OutOfStock' && <Badge label="Нет в наличии" variant="red" />}
          </div>

          {product.shortDescription && (
            <p className="text-gray-600 leading-relaxed">{product.shortDescription}</p>
          )}

          <div className="text-3xl font-bold text-gray-900">
            {product.price.toLocaleString('ru-RU')} ₽
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {product.ozonUrl && (
              <a href={product.ozonUrl} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors text-base"
              >
                <ExternalLink className="w-5 h-5" /> Заказать на Ozon
              </a>
            )}
            {product.wildberriesUrl && (
              <a href={product.wildberriesUrl} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors text-base"
              >
                <ExternalLink className="w-5 h-5" /> Заказать на Wildberries
              </a>
            )}
            <button onClick={handleFav}
              className={`flex items-center justify-center gap-2 border-2 font-semibold px-6 py-3.5 rounded-xl transition-colors
                ${isFaved
                  ? 'border-red-400 bg-red-50 text-red-600 hover:bg-red-100'
                  : 'border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700'}`}
            >
              <Heart className="w-5 h-5" fill={isFaved ? 'currentColor' : 'none'} />
              {isFaved ? 'В избранном' : 'Добавить в избранное'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {tabs.length > 0 && (
        <div className="mt-12">
          <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px
                  ${activeTab === tab.key
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'description' && product.fullDescription && (
            <div className="prose-content max-w-3xl" dangerouslySetInnerHTML={{ __html: product.fullDescription }} />
          )}

          {activeTab === 'composition' && product.ingredients.length > 0 && (
            <div className="max-w-3xl">
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Ингредиент</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Дозировка</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">% суточной нормы</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.ingredients.map((ing, i) => (
                      <tr key={ing.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-4 py-3 text-gray-800 font-medium">{ing.name}</td>
                        <td className="px-4 py-3 text-gray-600">{ing.dosage}</td>
                        <td className="px-4 py-3 text-gray-600">{ing.dailyValuePercent ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="max-w-3xl space-y-6">
              {product.usage && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Инструкция по применению</h3>
                  <p className="text-gray-600 leading-relaxed">{product.usage}</p>
                </div>
              )}
              {product.contraindications && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <h3 className="text-base font-semibold text-red-800 mb-2">⚠️ Противопоказания</h3>
                  <p className="text-red-700 text-sm leading-relaxed">{product.contraindications}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'certificates' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {certImages.map(img => (
                <a key={img.id} href={img.url} target="_blank" rel="noreferrer"
                  className="block rounded-xl overflow-hidden border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all aspect-[3/4]"
                >
                  <img src={img.url} alt="Сертификат" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
