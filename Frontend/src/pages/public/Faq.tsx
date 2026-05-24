import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { faqApi } from '../../api'
import { PageLoader } from '../../components/ui'

export default function Faq() {
  const { data: items, isLoading } = useQuery({ queryKey: ['faq'], queryFn: faqApi.getAll })
  const [open, setOpen] = useState<number | null>(null)

  if (isLoading) return <PageLoader />

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Вопрос — Ответ</h1>
      <p className="text-gray-500 mb-8">Ответы на часто задаваемые вопросы</p>

      <div className="space-y-2">
        {items?.map(item => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <button
              onClick={() => setOpen(open === item.id ? null : item.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900 pr-4">{item.question}</span>
              <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${open === item.id ? 'rotate-180' : ''}`} />
            </button>
            {open === item.id && (
              <div className="px-5 pb-5 text-gray-600 leading-relaxed text-sm border-t border-gray-50">
                <div className="pt-3">{item.answer}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
