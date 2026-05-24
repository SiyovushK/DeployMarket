import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { pagesApi, settingsApi } from '../../api'
import { PageLoader } from '../../components/ui'

// ── Carousel ─────────────────────────────────────────────────────────────
// - 1 фото  → просто фото, без миниатюр и стрелок
// - 2+ фото → стрелки + миниатюры снизу
function Carousel({ images }: { images: string[] }) {
  const [active, setActive]     = useState(0)
  const [lightbox, setLightbox] = useState<string | null>(null)

  if (!images.length) return null

  const prev = () => setActive(v => (v - 1 + images.length) % images.length)
  const next = () => setActive(v => (v + 1) % images.length)

  return (
    <>
      {/* Main image */}
      <div
        className="relative w-full rounded-2xl overflow-hidden bg-gray-100 shadow-md cursor-zoom-in"
        style={{ aspectRatio: '4/3' }}
        onClick={() => setLightbox(images[active])}
      >
        <img
          src={images[active]}
          alt=""
          className="w-full h-full object-cover transition-all duration-300"
        />

        {/* Arrows — only when 2+ images */}
        {images.length > 1 && (
          <>
            <button
              onClick={e => { e.stopPropagation(); prev() }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 hover:bg-white rounded-full shadow transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); next() }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 hover:bg-white rounded-full shadow transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails — only when 2+ images */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-colors ${
                i === active ? 'border-primary-500' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 p-2 text-white hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightbox}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

// ── Main About page ───────────────────────────────────────────────────────
export default function About() {
  const { data: person,  isLoading: l1 } = useQuery({ queryKey: ['page', 'about_person'],  queryFn: () => pagesApi.getByKey('about_person') })
  const { data: company, isLoading: l2 } = useQuery({ queryKey: ['page', 'about_company'], queryFn: () => pagesApi.getByKey('about_company') })
  const { data: certs,   isLoading: l3 } = useQuery({ queryKey: ['page', 'certificates'],  queryFn: () => pagesApi.getByKey('certificates') })
  const { data: settings }               = useQuery({ queryKey: ['settings'], queryFn: settingsApi.getAll, staleTime: 5 * 60 * 1000 })

  const getGallery = (key: string): string[] => {
    const raw = settings?.find(s => s.key === key)?.value ?? '[]'
    try { return JSON.parse(raw) } catch { return [] }
  }

  const personImages  = [...(person?.imageUrl  ? [person.imageUrl]  : []), ...getGallery('about_person_images')]
  const companyImages = [...(company?.imageUrl ? [company.imageUrl] : []), ...getGallery('about_company_images')]
  const certImages    = [
    ...(certs?.imageUrl ? [certs.imageUrl] : []),
    ...getGallery('cert_images'),
  ]

  if (l1 || l2 || l3) return <PageLoader />

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-20">

      {/* ── О главном лице ───────────────────────────────────────── */}
      {person && (
        <section className="flex flex-col md:flex-row gap-10 items-start">
          {personImages.length > 0 && (
            <div className="flex-shrink-0 w-full md:w-72">
              <Carousel images={personImages} />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{person.title}</h1>
            {person.content && (
              <div className="text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: person.content }} />
            )}
          </div>
        </section>
      )}

      {/* ── О компании ───────────────────────────────────────────── */}
      {company && (
        <section className="bg-gradient-to-br from-primary-50 to-green-50 rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{company.title}</h2>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {company.content && (
              <div className="flex-1 text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: company.content }} />
            )}
            {companyImages.length > 0 && (
              <div className="flex-shrink-0 w-full md:w-72">
                <Carousel images={companyImages} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Сертификаты ──────────────────────────────────────────── */}
      {certs && (certs.content || certImages.length > 0) && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{certs.title}</h2>
          {certs.content && (
            <div className="text-gray-600 leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: certs.content }} />
          )}
          {certImages.length > 0 && (
            <div className="w-full md:w-80">
              <Carousel images={certImages} />
            </div>
          )}
        </section>
      )}

    </div>
  )
}
