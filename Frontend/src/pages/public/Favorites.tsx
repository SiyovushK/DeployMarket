import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Heart, ExternalLink, Trash2, ShoppingBag } from 'lucide-react'
import { favoritesApi } from '../../api'
import { useAuthStore } from '../../store/authStore'
import { useFavoritesStore } from '../../store/favoritesStore'
import { Button, Empty, PageLoader } from '../../components/ui'

export default function Favorites() {
  const { isAuthenticated } = useAuthStore()
  const { guestItems, removeGuest, clearGuest, setServerItems } = useFavoritesStore()
  const qc = useQueryClient()

  const { data: serverFavs, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: favoritesApi.get,
    enabled: isAuthenticated,
  })

  // v5: use useEffect instead of onSuccess
  useEffect(() => {
    if (serverFavs) setServerItems(serverFavs)
  }, [serverFavs, setServerItems])

  const removeMut = useMutation({
    mutationFn: (id: number) => favoritesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  })

  const clearMut = useMutation({
    mutationFn: favoritesApi.clear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  })

  if (isLoading) return <PageLoader />

  const items = isAuthenticated
    ? (serverFavs ?? [])
    : guestItems.map(g => ({ ...g, addedAt: '' }))

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-400 fill-red-400" /> Избранное
          <span className="text-base font-normal text-gray-400">({items.length})</span>
        </h1>
        {items.length > 0 && (
          <Button variant="outline" size="sm"
            onClick={() => isAuthenticated ? clearMut.mutate() : clearGuest()}>
            Очистить
          </Button>
        )}
      </div>

      {!isAuthenticated && (
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 mb-6 text-sm text-primary-800">
          <Link to="/login" className="font-semibold underline">Войдите</Link>, чтобы сохранить избранное навсегда.
        </div>
      )}

      {items.length === 0
        ? <Empty icon={<Heart className="w-12 h-12" />} title="Избранное пусто" description="Добавляйте товары, нажимая на ♡ в карточке" />
        : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.productId} className="flex gap-4 bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-colors">
                <Link to={`/products/${item.productId}`} className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-50">
                  {item.mainImageUrl
                    ? <img src={item.mainImageUrl} alt={item.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-200"><ShoppingBag className="w-8 h-8" /></div>
                  }
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.productId}`} className="font-medium text-gray-900 hover:text-primary-700 line-clamp-2 text-sm">
                    {item.name}
                  </Link>
                  <p className="text-lg font-bold text-gray-900 mt-1">{item.price.toLocaleString('ru-RU')} ₽</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {item.ozonUrl && (
                      <a href={item.ozonUrl} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">
                        <ExternalLink className="w-3 h-3" /> Ozon
                      </a>
                    )}
                    {item.wildberriesUrl && (
                      <a href={item.wildberriesUrl} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700">
                        <ExternalLink className="w-3 h-3" /> Wildberries
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => isAuthenticated ? removeMut.mutate(item.productId) : removeGuest(item.productId)}
                  className="p-2 text-gray-300 hover:text-red-400 transition-colors self-start"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}
