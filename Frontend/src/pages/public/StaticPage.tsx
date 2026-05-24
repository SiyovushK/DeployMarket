import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { settingsApi } from '../../api'

export default function StaticPage() {
  const location = useLocation()
  const key = location.pathname === '/privacy' ? 'privacy_policy' : 'terms_of_service'
  const title = key === 'privacy_policy'
    ? 'Политика конфиденциальности'
    : 'Пользовательское соглашение'

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.getAll,
  })

  const content = settings?.find(s => s.key === key)?.value ?? ''

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{title}</h1>
      {content
        ? <div className="prose-content" dangerouslySetInnerHTML={{ __html: content }} />
        : <p className="text-gray-500">Документ в процессе подготовки.</p>
      }
    </div>
  )
}
