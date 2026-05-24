import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Heart, ShoppingBag, ArrowRight, Star, Shield, Leaf } from 'lucide-react'
import { bannersApi, productsApi, categoriesApi, settingsApi } from '../../api'
import { useFavoritesStore } from '../../store/favoritesStore'
import { useAuthStore } from '../../store/authStore'
import { favoritesApi } from '../../api'
import type { ProductListItem, Category } from '../../types'

// ── Banner Slider ─────────────────────────────────────────────────────────
function HeroBanner() {
  const { data: banners } = useQuery({ queryKey: ['banners'], queryFn: bannersApi.getActive })
  const [idx, setIdx] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    if (!banners?.length) return
    // При клике юзера сбрасываем таймер, добавляя idx в зависимости
    const t = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setIdx(i => (i + 1) % banners.length)
        setIsTransitioning(false)
      }, 700)
    }, 3000)
    return () => clearInterval(t)
  }, [banners, idx]) // idx в зависимостях перезапускает интервал после клика

  const handlePrev = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setIdx(i => (i - 1 + (banners?.length || 1)) % (banners?.length || 1))
      setIsTransitioning(false)
    }, 700)
  }

  const handleNext = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setIdx(i => (i + 1) % (banners?.length || 1))
      setIsTransitioning(false)
    }, 700)
  }

  if (!banners?.length) {
    return (
      <div className="bg-gradient-to-br from-primary-700 to-primary-900 text-white py-24 px-8 mx-4 mt-6 rounded-2xl">
        <h1 className="text-5xl font-black uppercase leading-tight mb-4">Натуральные БАДы<br />и витамины</h1>
        <p className="text-primary-100 text-lg mb-8 max-w-md">
          Высококачественные добавки для вашего здоровья и долголетия
        </p>
        <Link to="/catalog" className="inline-flex items-center gap-2 bg-white text-primary-700 font-bold px-7 py-3.5 rounded-full hover:bg-primary-50 transition-colors">
          Перейти в каталог <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  const banner = banners[idx]
  return (
    <div className="relative overflow-hidden rounded-2xl mx-4 mt-6 h-[400px] md:h-[520px] group">
      {/* Фото фон с плавным переходом */}
      <img
        src={banner.imageUrl}
        alt={banner.title ?? ''}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Градиент: слева тёмный, справа прозрачный */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
      {/* Дополнительный градиент снизу */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      {/* Контент — внизу слева */}
      <div className={`absolute bottom-0 left-0 right-0 p-8 md:p-12 md:max-w-2xl transition-all duration-500 ${
        isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
      }`}>
        {banner.title && (
          <h2 className="text-white font-black text-3xl md:text-5xl leading-tight uppercase tracking-tight mb-3 drop-shadow-lg">
            {banner.title}
          </h2>
        )}
        {banner.description && (
          <p className="text-white/85 text-base md:text-lg leading-relaxed mb-6 font-medium max-w-lg">
            {banner.description}
          </p>
        )}
        {banner.linkUrl && (
          <a
            href={banner.linkUrl}
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-400 text-white font-bold px-7 py-3.5 rounded-full transition-colors shadow-lg text-sm uppercase tracking-wide"
          >
            Подробнее <ArrowRight className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Кнопки навигации (видны при наведении) */}
      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 bg-white/20 hover:bg-white/40 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
            aria-label="Предыдущий баннер"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 bg-white/20 hover:bg-white/40 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
            aria-label="Следующий баннер"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Точки-индикаторы */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 right-6 flex gap-2">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`transition-all rounded-full ${
                i === idx ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Баннер ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Product card ──────────────────────────────────────────────────────────
function ProductCard({ product }: { product: ProductListItem }) {
  const { isAuthenticated } = useAuthStore()
  const { ids, addGuest, addServer, removeServer } = useFavoritesStore()
  const isFaved = ids.has(product.id)

  const handleFav = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isAuthenticated) {
      if (isFaved) {
        removeServer(product.id)
        await favoritesApi.remove(product.id)
      } else {
        addServer(product)
        await favoritesApi.add(product.id)
      }
    } else {
      addGuest(product)
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
          {product.isHit && (
            <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">🔥 Хит</span>
          )}
          {product.isNew && (
            <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">Новинка</span>
          )}
        </div>
        <button
          onClick={handleFav}
          className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors shadow
            ${isFaved ? 'bg-red-500 text-white' : 'bg-white text-gray-400 hover:text-red-500'}`}
        >
          <Heart className="w-4 h-4" fill={isFaved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="text-xs text-gray-400">{product.categoryName}</p>
        <h3 className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">{product.name}</h3>
        <p className="text-lg font-bold text-gray-900 mt-auto">{product.price.toLocaleString('ru-RU')} ₽</p>
      </div>
    </Link>
  )
}

// ── Home ──────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate()

  const { data: hits } = useQuery({
    queryKey: ['products', 'hits'],
    queryFn: () => productsApi.getList({ isHit: true, pageSize: 8 }),
  })

  const { data: news } = useQuery({
    queryKey: ['products', 'new'],
    queryFn: () => productsApi.getList({ isNew: true, pageSize: 8 }),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getTree,
  })

  const { data: siteSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.getAll,
    staleTime: 10 * 60 * 1000,
  })
  const gs = (key: string, fallback = '') =>
    siteSettings?.find(s => s.key === key)?.value || fallback

  const topCategories = categories?.filter(c => !c.parentId).slice(0, 6) ?? []

  return (
    <div className="pb-16">
      <HeroBanner />

      {/* Popular categories */}
      {topCategories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Категории</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {topCategories.map(cat => (
              <Link
                key={cat.id}
                to={`/catalog?categoryId=${cat.id}`}
                className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all text-center gap-2 group"
              >
                <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                  <Leaf className="w-5 h-5 text-primary-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Hits */}
      {(hits?.items?.length ?? 0) > 0 && (
        <section className="max-w-7xl mx-auto px-4 mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" /> Хиты продаж
            </h2>
            <Link to="/catalog?isHit=true" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              Все хиты <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {hits!.items.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* New */}
      {(news?.items?.length ?? 0) > 0 && (
        <section className="max-w-7xl mx-auto px-4 mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">🆕 Новинки</h2>
            <Link to="/catalog?isNew=true" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              Все новинки <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {news!.items.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Trust block */}
      <section className="max-w-7xl mx-auto px-4 mt-16">
        <div className="bg-gradient-to-br from-primary-50 to-green-50 rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            {gs('trust_title', 'Почему выбирают нас')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, titleKey: 'trust_1_title', descKey: 'trust_1_desc',
                titleFb: 'Сертифицировано', descFb: 'Все продукты прошли государственную сертификацию и имеют документы качества' },
              { icon: Leaf, titleKey: 'trust_2_title', descKey: 'trust_2_desc',
                titleFb: 'Натуральный состав', descFb: 'Используем только натуральные компоненты без искусственных добавок' },
              { icon: Star, titleKey: 'trust_3_title', descKey: 'trust_3_desc',
                titleFb: 'Разработано экспертами', descFb: 'Формулы созданы нутрициологами с многолетним опытом' },
            ].map(({ icon: Icon, titleKey, descKey, titleFb, descFb }) => (
              <div key={titleKey} className="flex flex-col items-center text-center p-4">
                <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{gs(titleKey, titleFb)}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{gs(descKey, descFb)}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/about" className="inline-flex items-center gap-2 bg-primary-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-primary-700 transition-colors">
              О компании <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
