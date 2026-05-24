import { useParams, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { pagesApi } from '../../api'
import { PageLoader } from '../../components/ui'
import { ABOUT_PAGE_KEYS } from '../../components/layout/PublicLayout'

/**
 * Renders any page created via admin/pages at /pages/:key
 * Reserved about-page keys (about_person, about_company, certificates)
 * redirect to /about where they are displayed in context.
 */
export default function DynamicPage() {
  const { key } = useParams<{ key: string }>()

  // Reserved keys belong to the /about page layout — redirect there
  if (key && ABOUT_PAGE_KEYS.includes(key)) {
    return <Navigate to="/about" replace />
  }

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ['page', key],
    queryFn: () => pagesApi.getByKey(key!),
    enabled: !!key,
    retry: false,
  })

  if (isLoading) return <PageLoader />
  if (isError || !page) return <Navigate to="/" replace />

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{page.title}</h1>

      {page.imageUrl && (
        <div className="mb-8 rounded-2xl overflow-hidden max-w-2xl shadow-md">
          <img src={page.imageUrl} alt={page.title} className="w-full object-cover" />
        </div>
      )}

      {page.content && (
        <div
          className="prose-content max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      )}

      {!page.content && !page.imageUrl && (
        <p className="text-gray-400 text-sm">Содержимое страницы пока не добавлено.</p>
      )}
    </div>
  )
}
