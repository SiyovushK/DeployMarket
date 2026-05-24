import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Plus, Pencil, Trash2, ArrowLeft, Upload, Save } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { articlesApi, settingsApi } from '../../../api'
import { Button, Badge, Confirm, PageLoader, Empty, Card, Input, Textarea, Toggle } from '../../../components/ui'
import { getErrorMessage } from '../../../api/client'

// ─── Articles List ────────────────────────────────────────────────────────
export function ArticlesList() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-articles', page],
    queryFn: () => articlesApi.getAdminList(page, 20),
  })

  const { data: siteSettings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: settingsApi.getAll,
  })
  const [articlesTitle, setArticlesTitle] = useState('')
  const [articlesSubtitle, setArticlesSubtitle] = useState('')
  const [settingsSaved, setSettingsSaved] = useState(false)

  useEffect(() => {
    if (siteSettings) {
      const t = siteSettings.find(s => s.key === 'articles_title')?.value ?? 'Блог о здоровье'
      const s = siteSettings.find(s => s.key === 'articles_subtitle')?.value ?? 'Экспертные статьи о витаминах, здоровье и правильном питании'
      setArticlesTitle(t)
      setArticlesSubtitle(s)
    }
  }, [siteSettings])

  const saveSettings = async () => {
    await Promise.all([
      settingsApi.update('articles_title', articlesTitle),
      settingsApi.update('articles_subtitle', articlesSubtitle),
    ])
    qc.invalidateQueries({ queryKey: ['settings'] })
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  const deleteMut = useMutation({
    mutationFn: (id: number) => articlesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-articles'] }); setDeleteId(null) },
  })

  const fmt = (d: string | null) => d ? format(new Date(d), 'd MMM yyyy', { locale: ru }) : '—'

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Статьи</h1>
        <Link to="/admin/articles/new"><Button><Plus className="w-4 h-4" /> Написать статью</Button></Link>
      </div>

      {/* Articles page text settings */}
      <Card className="p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Тексты страницы блога</h2>
        <Input label="Заголовок страницы" value={articlesTitle} onChange={e => setArticlesTitle(e.target.value)} />
        <Input label="Подзаголовок страницы" value={articlesSubtitle} onChange={e => setArticlesSubtitle(e.target.value)} />
        <Button size="sm" variant={settingsSaved ? 'secondary' : 'outline'} onClick={saveSettings}>
          <Save className="w-3.5 h-3.5" /> {settingsSaved ? '✓ Сохранено' : 'Сохранить тексты'}
        </Button>
      </Card>

      {data?.items?.length === 0
        ? <Empty title="Статей нет" description="Напишите первую статью в блог" />
        : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Заголовок</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Статус</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Дата</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data!.items.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {a.coverImageUrl && (
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <img src={a.coverImageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900 line-clamp-1">{a.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      {a.isPublished ? <Badge label="Опубликована" variant="green" /> : <Badge label="Черновик" variant="gray" />}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{fmt(a.publishedAt ?? a.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Link to={`/admin/articles/${a.id}/edit`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button onClick={() => setDeleteId(a.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }

      <Confirm open={deleteId !== null} title="Удалить статью?"
        message="Статья будет удалена вместе с обложкой."
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        onCancel={() => setDeleteId(null)} loading={deleteMut.isPending} />
    </div>
  )
}

// ─── Article Form ─────────────────────────────────────────────────────────
export function ArticleForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [error, setError] = useState('')

  const { data: article, isLoading } = useQuery({
    queryKey: ['admin-article', id],
    queryFn: () => articlesApi.getById(Number(id)),
    enabled: isEdit,
  })

  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: { title: '', content: '', isPublished: false },
  })

  useEffect(() => {
    if (article) {
      reset({ title: article.title, content: article.content, isPublished: article.isPublished })
      setCoverPreview(article.coverImageUrl)
    }
  }, [article])

  const saveMut = useMutation({
    mutationFn: (data: { title: string; content: string; isPublished: boolean }) =>
      isEdit
        ? articlesApi.update(Number(id), data, coverFile ?? undefined)
        : articlesApi.create(data, coverFile ?? undefined),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-articles'] }); navigate('/admin/articles') },
    onError: (e) => setError(getErrorMessage(e)),
  })

  if (isEdit && isLoading) return <PageLoader />

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link to="/admin/articles" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Редактировать статью' : 'Новая статья'}</h1>
      </div>

      <form onSubmit={handleSubmit(d => saveMut.mutate(d as any))} className="space-y-5">
        <Card className="p-5 space-y-4">
          <Input label="Заголовок *" {...register('title', { required: true })} />
          <Textarea label="Контент (HTML)" rows={12} {...register('content', { required: true })} />
          <Toggle checked={watch('isPublished')} onChange={v => setValue('isPublished', v)} label="Опубликовать" />
        </Card>

        {/* Cover */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Обложка</h3>
          {(coverPreview) && (
            <div className="aspect-video rounded-xl overflow-hidden mb-3 bg-gray-100">
              <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer text-sm text-primary-600 hover:text-primary-700">
            <Upload className="w-4 h-4" />
            {coverPreview ? 'Заменить обложку' : 'Загрузить обложку'}
            <input type="file" accept="image/*" className="hidden" onChange={e => {
              const f = e.target.files?.[0]
              if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)) }
            }} />
          </label>
        </Card>

        {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" loading={saveMut.isPending}>{isEdit ? 'Сохранить' : 'Создать статью'}</Button>
          <Link to="/admin/articles"><Button type="button" variant="outline">Отмена</Button></Link>
        </div>
      </form>
    </div>
  )
}

export default ArticlesList
