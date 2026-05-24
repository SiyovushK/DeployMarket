import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { ArrowLeft, Upload, Trash2, Plus, Star, Lock } from 'lucide-react'
import { productsApi, categoriesApi } from '../../../api'
import { Button, Input, Textarea, Select, Toggle, PageLoader, Card } from '../../../components/ui'
import { getErrorMessage } from '../../../api/client'

interface FormData {
  name: string; sku: string; price: number; categoryId: number
  shortDescription: string; fullDescription: string; usage: string; contraindications: string
  ozonUrl: string; wildberriesUrl: string; isHit: boolean; isNew: boolean
  status: string
  ingredients: Array<{ name: string; dosage: string; dailyValuePercent: string; sortOrder: number }>
}

export default function ProductForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'main' | 'composition' | 'media'>('main')

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getById(Number(id)),
    enabled: isEdit,
  })

  const { data: categories } = useQuery({ queryKey: ['categories-flat'], queryFn: categoriesApi.getFlat })

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors, isDirty } } = useForm<FormData>({
    defaultValues: {
      name: '', sku: '', price: 0, categoryId: 0,
      shortDescription: '', fullDescription: '', usage: '', contraindications: '',
      ozonUrl: '', wildberriesUrl: '', isHit: false, isNew: false, status: 'Draft',
      ingredients: [],
    },
  })

  const { fields: ingFields, append: ingAppend, remove: ingRemove } = useFieldArray({
    control, name: 'ingredients',
  })

  useEffect(() => {
    if (product) {
      reset({
        name: product.name, sku: product.sku, price: product.price,
        categoryId: product.categoryId,
        shortDescription: product.shortDescription ?? '',
        fullDescription: product.fullDescription ?? '',
        usage: product.usage ?? '',
        contraindications: product.contraindications ?? '',
        ozonUrl: product.ozonUrl ?? '',
        wildberriesUrl: product.wildberriesUrl ?? '',
        isHit: product.isHit, isNew: product.isNew, status: product.status,
        ingredients: product.ingredients.map(i => ({
          name: i.name, dosage: i.dosage, dailyValuePercent: i.dailyValuePercent ?? '', sortOrder: i.sortOrder,
        })),
      })
    }
  }, [product])

  const saveMut = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEdit) {
        const updated = await productsApi.update(Number(id), {
          name: data.name, price: data.price, categoryId: data.categoryId,
          shortDescription: data.shortDescription || undefined,
          fullDescription: data.fullDescription || undefined,
          usage: data.usage || undefined,
          contraindications: data.contraindications || undefined,
          ozonUrl: data.ozonUrl || undefined,
          wildberriesUrl: data.wildberriesUrl || undefined,
          isHit: data.isHit, isNew: data.isNew,
          status: data.status as any,
        } as any)
        await productsApi.updateIngredients(Number(id), data.ingredients)
        return updated
      } else {
        const created = await productsApi.create({
          name: data.name, sku: data.sku, price: data.price, categoryId: data.categoryId,
          shortDescription: data.shortDescription || undefined,
          fullDescription: data.fullDescription || undefined,
          usage: data.usage || undefined,
          contraindications: data.contraindications || undefined,
          ozonUrl: data.ozonUrl || undefined,
          wildberriesUrl: data.wildberriesUrl || undefined,
          isHit: data.isHit, isNew: data.isNew,
        } as any)
        if (data.ingredients.length > 0)
          await productsApi.updateIngredients(created.id, data.ingredients)
        return created
      }
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      if (!isEdit) navigate(`/admin/products/${p.id}/edit`)
    },
    onError: (e) => setError(getErrorMessage(e)),
  })

  const uploadImage = async (file: File, isMain = false, isCertificate = false) => {
    if (!product) return
    setUploadingImage(true)
    try {
      await productsApi.uploadImage(product.id, file, isMain, isCertificate)
      qc.invalidateQueries({ queryKey: ['product', id] })
    } finally {
      setUploadingImage(false)
    }
  }

  // Local optimistic "main image" override — updates immediately on click
  const [optimisticMainId, setOptimisticMainId] = useState<number | null>(null)

  const setMainImage = useMutation({
    mutationFn: ({ productId, imageId }: { productId: number; imageId: number }) =>
      productsApi.setMainImage(productId, imageId),
    onMutate: ({ imageId }) => {
      // Instantly show the new main badge without waiting for server
      setOptimisticMainId(imageId)
    },
    onSuccess: () => {
      // Sync with real server data and clear optimistic override
      qc.invalidateQueries({ queryKey: ['product', id] })
      setOptimisticMainId(null)
    },
    onError: () => {
      // Roll back optimistic update if request failed
      setOptimisticMainId(null)
    },
  })

  const deleteImage = useMutation({
    mutationFn: productsApi.deleteImage,
    onSuccess: () => {
      // Clear any optimistic main-id so the freshly fetched data is used as-is
      setOptimisticMainId(null)
      qc.invalidateQueries({ queryKey: ['product', id] })
    },
  })

  const catOptions = categories?.map(c => ({
    value: c.id,
    label: c.parentId ? `  └ ${c.name}` : c.name,
  })) ?? []

  if (isEdit && productLoading) return <PageLoader />

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'main', label: 'Основное' },
    { key: 'composition', label: 'Состав' },
    { key: 'media', label: 'Фото' },
  ]

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/admin/products" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Редактировать товар' : 'Новый товар'}</h1>
          {product && <p className="text-sm text-gray-400">{product.sku}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
              ${activeTab === t.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >{t.label}</button>
        ))}
      </div>

      <form onSubmit={handleSubmit(d => saveMut.mutate(d))} className="space-y-5">
        {/* ── Main tab ── */}
        {activeTab === 'main' && (
          <Card className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Название *" error={errors.name?.message}
                {...register('name', { required: 'Обязательное поле' })} />
              <Input label="Артикул (SKU) *" error={errors.sku?.message}
                readOnly={isEdit} className={isEdit ? 'bg-gray-50' : ''}
                {...register('sku', { required: 'Обязательное поле' })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Цена, ₽ *" type="number" step="0.01"
                {...register('price', { required: true, min: 0, valueAsNumber: true })} />
              <Select label="Категория *" options={catOptions} placeholder="Выберите категорию"
                error={errors.categoryId?.message}
                {...register('categoryId', { required: 'Выберите категорию', valueAsNumber: true })} />
            </div>
            <Textarea label="Краткое описание" rows={2} {...register('shortDescription')} />
            <Textarea label="Полное описание (HTML)" rows={6} {...register('fullDescription')} />
            <Textarea label="Инструкция по применению" rows={3} {...register('usage')} />
            <Textarea label="Противопоказания" rows={2} {...register('contraindications')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Ссылка на Ozon" placeholder="https://ozon.ru/..." {...register('ozonUrl')} />
              <Input label="Ссылка на Wildberries" placeholder="https://wildberries.ru/..." {...register('wildberriesUrl')} />
            </div>
            <div className="flex items-center gap-6 pt-2">
              <Toggle checked={watch('isHit')} onChange={v => setValue('isHit', v)} label="Хит продаж" />
              <Toggle checked={watch('isNew')} onChange={v => setValue('isNew', v)} label="Новинка" />
            </div>
            {isEdit && (
              <Select label="Статус" options={[
                { value: 'Draft', label: 'Черновик' },
                { value: 'Published', label: 'Опубликован' },
                { value: 'OutOfStock', label: 'Нет в наличии' },
              ]} {...register('status')} />
            )}
          </Card>
        )}

        {/* ── Composition tab ── */}
        {activeTab === 'composition' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Ингредиенты</h3>
              <Button type="button" size="sm" variant="outline"
                onClick={() => ingAppend({ name: '', dosage: '', dailyValuePercent: '', sortOrder: ingFields.length })}>
                <Plus className="w-4 h-4" /> Добавить
              </Button>
            </div>
            <div className="space-y-3">
              {ingFields.map((field, i) => (
                <div key={field.id} className="grid grid-cols-[1fr_120px_100px_36px] gap-2 items-end">
                  <Input placeholder="Ингредиент" {...register(`ingredients.${i}.name`)} />
                  <Input placeholder="Дозировка" {...register(`ingredients.${i}.dosage`)} />
                  <Input placeholder="% нормы" {...register(`ingredients.${i}.dailyValuePercent`)} />
                  <button type="button" onClick={() => ingRemove(i)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {ingFields.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Ингредиенты не добавлены</p>
              )}
            </div>
          </Card>
        )}

        {/* ── Media tab ── */}
        {activeTab === 'media' && (
          <Card className="p-6 space-y-4">
            {!isEdit && (
              <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">Сначала сохраните товар, затем добавляйте фото</p>
            )}
            {isEdit && (
              <>
                <div className="flex gap-2 flex-wrap">
                  <Button type="button" variant="outline" size="sm" loading={uploadingImage}
                    onClick={() => fileRef.current?.click()}>
                    <Upload className="w-4 h-4" /> Загрузить фото
                  </Button>
                  <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
                    onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], product?.images.length === 0)} />
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {product?.images.map(img => {
                    // Resolve current "isMain" using optimistic override if present
                    const isMain = optimisticMainId !== null
                      ? img.id === optimisticMainId
                      : img.isMain

                    return (
                      <div key={img.id} className="relative group">
                        <div className={`relative w-full h-full rounded-xl overflow-hidden border-2 aspect-square bg-gray-50 transition-colors ${isMain ? 'border-yellow-400' : 'border-gray-200'}`}>
                          <img src={img.url} alt="" className="w-full h-full object-cover" />

                          {/* Badges */}
                          <div className="absolute top-1 left-1 flex flex-col gap-0.5">
                            {isMain && (
                              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-current" /> Главное
                              </span>
                            )}
                            {img.isCertificate && (
                              <span className="bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> Серт.
                              </span>
                            )}
                          </div>

                          {/* Hover actions */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => deleteImage.mutate(img.id)}
                              className="p-1 bg-white/90 rounded-full text-red-500 hover:bg-red-50 shadow-sm"
                              title="Удалить"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Set as main — visible on hover if not already main */}
                          {!isMain && !img.isCertificate && (
                            <button
                              type="button"
                              onClick={() => product && setMainImage.mutate({ productId: product.id, imageId: img.id })}
                              disabled={setMainImage.isPending}
                              className="absolute bottom-0 left-0 right-0 py-1 bg-yellow-400/90 text-yellow-900 text-xs font-semibold text-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-yellow-400 disabled:cursor-wait"
                            >
                              <Star className="w-3 h-3 inline mr-0.5 fill-current" /> Сделать главным
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </Card>
        )}

        {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saveMut.isPending}>
            {isEdit ? 'Сохранить изменения' : 'Создать товар'}
          </Button>
          <Link to="/admin/products"><Button type="button" variant="outline">Отмена</Button></Link>
        </div>
      </form>
    </div>
  )
}
