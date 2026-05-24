import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Pencil, Trash2, ShoppingBag, Eye, EyeOff } from 'lucide-react'
import { productsApi } from '../../../api'
import { Button, Badge, Pagination, Confirm, PageLoader, Empty } from '../../../components/ui'
import type { ProductStatus } from '../../../types'

const statusBadge = (s: ProductStatus) => {
  if (s === 'Published')  return <Badge label="Опубликован" variant="green" />
  if (s === 'OutOfStock') return <Badge label="Нет в наличии" variant="yellow" />
  return <Badge label="Черновик" variant="gray" />
}

export default function ProductsList() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ProductStatus | ''>('')
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search, status, page],
    queryFn: () => productsApi.getAdminList({
      search: search || undefined,
      status: (status || undefined) as ProductStatus | undefined,
      page, pageSize: 20,
    }),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); setDeleteId(null) },
  })

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ProductStatus }) =>
      productsApi.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Товары</h1>
          {data && <p className="text-sm text-gray-500 mt-0.5">{data.totalCount} товаров</p>}
        </div>
        <Link to="/admin/products/new">
          <Button><Plus className="w-4 h-4" /> Добавить товар</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Поиск по названию, артикулу..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
          />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value as any); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400">
          <option value="">Все статусы</option>
          <option value="Published">Опубликованные</option>
          <option value="Draft">Черновики</option>
          <option value="OutOfStock">Нет в наличии</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? <PageLoader /> : (data?.items?.length === 0)
        ? <Empty icon={<ShoppingBag className="w-12 h-12" />} title="Товаров нет" description="Добавьте первый товар" />
        : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Товар</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Арт.</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Категория</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Цена</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Статус</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data!.items.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {p.mainImageUrl
                              ? <img src={p.mainImageUrl} alt={p.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag className="w-4 h-4" /></div>
                            }
                          </div>
                          <span className="font-medium text-gray-900 line-clamp-1">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{p.sku}</td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{p.categoryName}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{p.price.toLocaleString('ru-RU')} ₽</td>
                      <td className="px-4 py-3 text-center">{statusBadge(p.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => toggleStatus.mutate({
                              id: p.id,
                              status: p.status === 'Published' ? 'Draft' : 'Published',
                            })}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title={p.status === 'Published' ? 'Скрыть' : 'Опубликовать'}
                          >
                            {p.status === 'Published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <Link to={`/admin/products/${p.id}/edit`}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button onClick={() => setDeleteId(p.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-center">
              <Pagination page={page} totalPages={data!.totalPages} onChange={setPage} />
            </div>
          </>
        )
      }

      <Confirm
        open={deleteId !== null}
        title="Удалить товар?"
        message="Товар и все его изображения будут удалены безвозвратно."
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMut.isPending}
      />
    </div>
  )
}
