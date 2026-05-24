import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarDays, ArrowRight, ArrowLeft } from 'lucide-react'
import { articlesApi, settingsApi } from '../../api'
import { PageLoader, Pagination, Empty } from '../../components/ui'

export function Articles() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['articles', page],
    queryFn: () => articlesApi.getList(page, 9),
  })

  const { data: siteSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.getAll,
    staleTime: 10 * 60 * 1000,
  })
  const gs = (key: string, fallback = '') =>
    siteSettings?.find(s => s.key === key)?.value || fallback

  const fmt = (d: string | null) =>
    d ? format(new Date(d), 'd MMMM yyyy', { locale: ru }) : ''

  if (isLoading) return <PageLoader />

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{gs('articles_title', 'Блог о здоровье')}</h1>
      <p className="text-gray-500 mb-8">{gs('articles_subtitle', 'Экспертные статьи о витаминах, здоровье и правильном питании')}</p>

      {data?.items?.length === 0
        ? <Empty title="Статей пока нет" />
        : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.items.map(article => (
                <Link key={article.id} to={`/articles/${article.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all flex flex-col"
                >
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    {article.coverImageUrl
                      ? <img src={article.coverImageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center text-4xl">📝</div>
                    }
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {fmt(article.publishedAt ?? article.createdAt)}
                    </div>
                    <h2 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-700 transition-colors flex-1">{article.title}</h2>
                    <span className="mt-3 text-sm text-primary-600 flex items-center gap-1 font-medium">
                      Читать <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="flex justify-center mt-8">
              <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
            </div>
          </>
        )
      }
    </div>
  )
}

export function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>()

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => articlesApi.getBySlug(slug!),
    enabled: !!slug,
  })

  const fmt = (d: string | null) =>
    d ? format(new Date(d), 'd MMMM yyyy', { locale: ru }) : ''

  if (isLoading) return <PageLoader />
  if (!article) return <div className="text-center py-20 text-gray-500">Статья не найдена</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to="/articles" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Все статьи
      </Link>

      {article.coverImageUrl && (
        <div className="aspect-video rounded-2xl overflow-hidden mb-8 bg-gray-100">
          <img src={article.coverImageUrl} alt={article.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
        <CalendarDays className="w-4 h-4" />
        {fmt(article.publishedAt ?? article.createdAt)}
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">{article.title}</h1>

      <div className="prose-content" dangerouslySetInnerHTML={{ __html: article.content }} />
    </div>
  )
}

export default Articles
