import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload, Trash2, Save } from 'lucide-react'
import { galleryApi, settingsApi } from '../../api'
import { Button } from './index'

interface GalleryManagerProps {
  settingKey: string          // e.g. 'cert_images'
  label?: string
}

export function GalleryManager({ settingKey, label }: GalleryManagerProps) {
  const qc        = useQueryClient()
  const fileRef   = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [localUrls, setLocalUrls] = useState<string[] | null>(null)

  const { data: settings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn:  settingsApi.getAll,
  })

  const raw    = settings?.find(s => s.key === settingKey)?.value ?? '[]'
  const stored: string[] = (() => { try { return JSON.parse(raw) } catch { return [] } })()
  const urls   = localUrls ?? stored

  const saveUrls = async (next: string[]) => {
    await settingsApi.update(settingKey, JSON.stringify(next))
    qc.invalidateQueries({ queryKey: ['admin-settings'] })
    qc.invalidateQueries({ queryKey: ['settings'] })
    setLocalUrls(null)
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const { url } = await galleryApi.upload(file)
      const next    = [...urls, url]
      await saveUrls(next)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDelete = async (url: string) => {
    const next = urls.filter(u => u !== url)
    await saveUrls(next)
    await galleryApi.deleteFile(url)
  }

  const moveUp = async (index: number) => {
    if (index === 0) return
    const next = [...urls]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    await saveUrls(next)
  }

  const moveDown = async (index: number) => {
    if (index === urls.length - 1) return
    const next = [...urls]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    await saveUrls(next)
  }

  // Replace single image
  const replaceFileRef = useRef<HTMLInputElement>(null)
  const [replaceIdx, setReplaceIdx] = useState<number | null>(null)

  const handleReplace = async (file: File, index: number) => {
    setUploading(true)
    try {
      const oldUrl  = urls[index]
      const { url } = await galleryApi.upload(file)
      const next    = [...urls]
      next[index]   = url
      await saveUrls(next)
      await galleryApi.deleteFile(oldUrl)
    } finally {
      setUploading(false)
      setReplaceIdx(null)
      if (replaceFileRef.current) replaceFileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}

      {/* Grid */}
      {urls.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {urls.map((url, i) => (
            <div key={url} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square flex items-center justify-center">
              <img src={url} alt="" className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3' }} />

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

              {/* Order controls */}
              <div className="absolute top-1 left-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => moveUp(i)} disabled={i === 0}
                  className="p-0.5 bg-white/90 rounded text-gray-600 hover:text-primary-600 disabled:opacity-30 shadow-sm">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button onClick={() => moveDown(i)} disabled={i === urls.length - 1}
                  className="p-0.5 bg-white/90 rounded text-gray-600 hover:text-primary-600 disabled:opacity-30 shadow-sm">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Delete */}
              <button onClick={() => handleDelete(url)}
                className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                <Trash2 className="w-3 h-3" />
              </button>

              {/* Replace */}
              <button
                onClick={() => { setReplaceIdx(i); replaceFileRef.current?.click() }}
                className="absolute bottom-0 left-0 right-0 py-1 text-xs font-medium text-white bg-primary-600/80 hover:bg-primary-600 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                Заменить
              </button>

              {/* Position number */}
              <span className="absolute bottom-1 left-1 text-xs font-bold text-white bg-black/40 rounded px-1">{i + 1}</span>
            </div>
          ))}
        </div>
      )}

      {urls.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-sm text-gray-400">
          Нет фотографий
        </div>
      )}

      {/* Upload */}
      <Button size="sm" variant="outline" loading={uploading} onClick={() => fileRef.current?.click()}>
        <Upload className="w-3.5 h-3.5" /> Добавить фото
      </Button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />

      {/* Hidden replace input */}
      <input ref={replaceFileRef} type="file" accept="image/*" className="hidden"
        onChange={e => {
          if (e.target.files?.[0] && replaceIdx !== null)
            handleReplace(e.target.files[0], replaceIdx)
        }} />
    </div>
  )
}
