import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Pencil, Upload, Save } from 'lucide-react'
import { bannersApi, faqApi, pagesApi, settingsApi } from '../../../api'
import { Button, Input, Textarea, Toggle, Confirm, PageLoader, Card, Empty, Badge, Pagination, GalleryManager } from '../../../components/ui'
import { getErrorMessage } from '../../../api/client'

// ══════════════════════════════════════════════════════════════════
// BANNERS
// ══════════════════════════════════════════════════════════════════
export function BannersList() {
  const qc = useQueryClient()

  // ── Add form state ────────────────────────────────────────────
  const addFileRef = useRef<HTMLInputElement>(null)
  const [addTitle, setAddTitle]       = useState('')
  const [addDesc, setAddDesc]         = useState('')
  const [addLink, setAddLink]         = useState('')
  const [addError, setAddError]       = useState('')

  // ── Edit state ────────────────────────────────────────────────
  const editFileRef = useRef<HTMLInputElement>(null)
  const [editId, setEditId]           = useState<number | null>(null)
  const [editTitle, setEditTitle]     = useState('')
  const [editDesc, setEditDesc]       = useState('')
  const [editLink, setEditLink]       = useState('')
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [editPreview, setEditPreview] = useState<string>('')

  // ── Order state ───────────────────────────────────────────────
  const [localOrder, setLocalOrder]   = useState<number[]>([])
  const [orderDirty, setOrderDirty]   = useState(false)
  const [orderSaving, setOrderSaving] = useState(false)

  // ── Delete ────────────────────────────────────────────────────
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: banners, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: bannersApi.getAll,
  })

  // Sync localOrder from server whenever banners load/reload (only if not dirty)
  useEffect(() => {
    if (banners && !orderDirty) {
      const sorted = [...banners].sort((a, b) => a.sortOrder - b.sortOrder)
      setLocalOrder(sorted.map(b => b.id))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banners])

  const createMut = useMutation({
    mutationFn: (file: File) =>
      bannersApi.create({
        linkUrl:     addLink  || undefined,
        title:       addTitle || undefined,
        description: addDesc  || undefined,
      }, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-banners'] })
      setAddTitle(''); setAddDesc(''); setAddLink(''); setAddError('')
    },
    onError: (e) => setAddError(getErrorMessage(e)),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, image }: { id: number; image?: File }) =>
      bannersApi.update(id, {
        title:       editTitle || undefined,
        description: editDesc  || undefined,
        linkUrl:     editLink  || undefined,
      }, image),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-banners'] })
      closeEdit()
    },
    onError: (e) => setAddError(getErrorMessage(e)),
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      bannersApi.update(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-banners'] }),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => bannersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-banners'] })
      setDeleteId(null)
      setOrderDirty(false)
    },
  })

  // ── Edit helpers ──────────────────────────────────────────────
  const openEdit = (b: { id: number; title?: string | null; description?: string | null; linkUrl?: string | null; imageUrl: string }) => {
    setEditId(b.id)
    setEditTitle(b.title ?? '')
    setEditDesc(b.description ?? '')
    setEditLink(b.linkUrl ?? '')
    setEditImageFile(null)
    setEditPreview(b.imageUrl)
  }

  const closeEdit = () => {
    setEditId(null)
    setEditImageFile(null)
    setEditPreview('')
  }

  const handleEditImage = (file: File) => {
    setEditImageFile(file)
    setEditPreview(URL.createObjectURL(file))
  }

  // ── Order helpers ─────────────────────────────────────────────
  const moveUp = (index: number) => {
    if (index === 0) return
    const next = [...localOrder]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    setLocalOrder(next); setOrderDirty(true)
  }

  const moveDown = (index: number) => {
    if (index === localOrder.length - 1) return
    const next = [...localOrder]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    setLocalOrder(next); setOrderDirty(true)
  }

  const saveOrder = async () => {
    setOrderSaving(true)
    try {
      await Promise.all(localOrder.map((id, i) => bannersApi.update(id, { sortOrder: i + 1 })))
      setOrderDirty(false)
      qc.invalidateQueries({ queryKey: ['admin-banners'] })
    } finally {
      setOrderSaving(false)
    }
  }

  if (isLoading) return <PageLoader />

  const bannerMap = Object.fromEntries((banners ?? []).map(b => [b.id, b]))
  const sorted = localOrder.map(id => bannerMap[id]).filter(Boolean)

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Баннеры</h1>

      {/* ── Add form ─────────────────────────────────────────── */}
      <Card className="p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Добавить баннер</h2>
        <Input label="Заголовок" value={addTitle} onChange={e => setAddTitle(e.target.value)} placeholder="Большой заголовок баннера" />
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Описание</label>
          <textarea value={addDesc} onChange={e => setAddDesc(e.target.value)}
            placeholder="Краткое описание..." rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400 resize-none" />
        </div>
        <Input label="Ссылка (URL)" value={addLink} onChange={e => setAddLink(e.target.value)} placeholder="https://..." />
        {addError && <p className="text-xs text-red-500">{addError}</p>}
        <Button variant="outline" onClick={() => addFileRef.current?.click()} loading={createMut.isPending}>
          <Upload className="w-4 h-4" /> Загрузить баннер
        </Button>
        <input ref={addFileRef} type="file" accept="image/*" className="hidden"
          onChange={e => e.target.files?.[0] && createMut.mutate(e.target.files[0])} />
      </Card>

      {/* ── Banner list ───────────────────────────────────────── */}
      {!sorted.length
        ? <Empty title="Баннеров нет" />
        : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">Стрелки ↑↓ — изменить порядок</p>
              {orderDirty && (
                <Button size="sm" onClick={saveOrder} loading={orderSaving}>
                  <Save className="w-3.5 h-3.5" /> Сохранить порядок
                </Button>
              )}
            </div>

            {sorted.map((b, index) => (
              <div key={b.id} className={`bg-white rounded-xl border transition-colors ${orderDirty ? 'border-primary-200' : 'border-gray-200'}`}>

                {/* ── Normal view ─────────────────────────────── */}
                {editId !== b.id ? (
                  <div className="flex gap-3 p-3 items-center">
                    {/* Order controls */}
                    <div className="flex flex-col items-center gap-0.5 flex-shrink-0 w-8">
                      <button onClick={() => moveUp(index)} disabled={index === 0}
                        className="p-1 text-gray-300 hover:text-primary-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <span className="text-xs text-gray-400 font-bold">{index + 1}</span>
                      <button onClick={() => moveDown(index)} disabled={index === sorted.length - 1}
                        className="p-1 text-gray-300 hover:text-primary-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* Thumbnail */}
                    <div className="w-24 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                      {b.imageUrl
                        ? <img src={b.imageUrl} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display='none')} />
                        : <span className="text-xs text-gray-400">Нет фото</span>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {b.title      && <p className="text-sm font-semibold text-gray-900 truncate">{b.title}</p>}
                      {b.description && <p className="text-xs text-gray-500 truncate">{b.description}</p>}
                      {b.linkUrl    && <p className="text-xs text-blue-500 truncate">{b.linkUrl}</p>}
                      <Toggle checked={b.isActive} onChange={v => toggleMut.mutate({ id: b.id, isActive: v })}
                        label={b.isActive ? 'Активен' : 'Скрыт'} />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(b)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Редактировать">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(b.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Удалить">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Edit form ──────────────────────────────── */
                  <div className="p-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Редактировать баннер #{b.id}</p>

                    {/* Image replace */}
                    <div className="flex items-start gap-3">
                      <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-200">
                        {editPreview
                          ? <img src={editPreview} alt="" className="w-full h-full object-cover" />
                          : <span className="text-xs text-gray-400 text-center px-1">Нет фото</span>
                        }
                      </div>
                      <div className="flex-1 space-y-2">
                        <Button size="sm" variant="outline" onClick={() => editFileRef.current?.click()}>
                          <Upload className="w-3.5 h-3.5" />
                          {editImageFile ? 'Фото выбрано ✓' : 'Заменить фото'}
                        </Button>
                        {editImageFile && (
                          <p className="text-xs text-gray-500 truncate">{editImageFile.name}</p>
                        )}
                        <input ref={editFileRef} type="file" accept="image/*" className="hidden"
                          onChange={e => e.target.files?.[0] && handleEditImage(e.target.files[0])} />
                      </div>
                    </div>

                    <Input label="Заголовок" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Описание</label>
                      <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400 resize-none" />
                    </div>
                    <Input label="Ссылка (URL)" value={editLink} onChange={e => setEditLink(e.target.value)} placeholder="https://..." />

                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={() => updateMut.mutate({ id: b.id, image: editImageFile ?? undefined })}
                        loading={updateMut.isPending}>
                        <Save className="w-3.5 h-3.5" /> Сохранить
                      </Button>
                      <Button size="sm" variant="outline" onClick={closeEdit}>Отмена</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }

      <Confirm open={deleteId !== null} title="Удалить баннер?" message="Изображение будет удалено безвозвратно."
        confirmLabel="Удалить"
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)} onCancel={() => setDeleteId(null)} loading={deleteMut.isPending} />
    </div>
  )
}


export default BannersList

// ══════════════════════════════════════════════════════════════════
// FAQ
// ══════════════════════════════════════════════════════════════════
export function FaqList() {
  const qc = useQueryClient()
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [newQ, setNewQ] = useState('')
  const [newA, setNewA] = useState('')
  const [editQ, setEditQ] = useState('')
  const [editA, setEditA] = useState('')

  const { data: items, isLoading } = useQuery({ queryKey: ['admin-faq'], queryFn: faqApi.getAll })

  const createMut = useMutation({
    mutationFn: () => faqApi.create({ question: newQ, answer: newA }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-faq'] }); setNewQ(''); setNewA('') },
  })

  const updateMut = useMutation({
    mutationFn: ({ id }: { id: number }) => faqApi.update(id, { question: editQ, answer: editA }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-faq'] }); setEditId(null) },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => faqApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-faq'] }); setDeleteId(null) },
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Вопрос — Ответ</h1>
      <Card className="p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Добавить вопрос</h2>
        <Input label="Вопрос" value={newQ} onChange={e => setNewQ(e.target.value)} />
        <Textarea label="Ответ" value={newA} onChange={e => setNewA(e.target.value)} />
        <Button onClick={() => newQ.trim() && newA.trim() && createMut.mutate()} loading={createMut.isPending}>
          <Plus className="w-4 h-4" /> Добавить
        </Button>
      </Card>
      {!items?.length ? <Empty title="Вопросов нет" /> : (
        <div className="space-y-2">
          {items.map(item => (
            <Card key={item.id} className="p-4">
              {editId === item.id ? (
                <div className="space-y-3">
                  <Input value={editQ} onChange={e => setEditQ(e.target.value)} />
                  <Textarea value={editA} onChange={e => setEditA(e.target.value)} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateMut.mutate({ id: item.id })} loading={updateMut.isPending}>Сохранить</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditId(null)}>Отмена</Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{item.question}</p>
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{item.answer}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => { setEditId(item.id); setEditQ(item.question); setEditA(item.answer) }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteId(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      <Confirm open={deleteId !== null} title="Удалить вопрос?" message="Вопрос будет удалён безвозвратно."
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)} onCancel={() => setDeleteId(null)} loading={deleteMut.isPending} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// PAGE CONTENT
// ══════════════════════════════════════════════════════════════════
export function PagesList() {
  const qc = useQueryClient()
  const [editKey, setEditKey] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [newKey, setNewKey] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [deleteKey, setDeleteKey] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: pages, isLoading } = useQuery({ queryKey: ['admin-pages'], queryFn: pagesApi.getAll })

  const updateMut = useMutation({
    mutationFn: (key: string) => pagesApi.update(key, { title: editTitle, content: editContent }, imageFile ?? undefined),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-pages'] }); setEditKey(null); setImageFile(null) },
  })

  const createMut = useMutation({
    mutationFn: () => pagesApi.create({ key: newKey, title: newTitle }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-pages'] }); setNewKey(''); setNewTitle('') },
  })

  const deleteMut = useMutation({
    mutationFn: (key: string) => pagesApi.delete(key),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-pages'] }); setDeleteKey(null) },
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Страницы</h1>
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800 space-y-1">
        <p className="font-medium">Как работают страницы</p>
        <p>Страницы с ключами <code className="bg-blue-100 rounded px-1">about_person</code>, <code className="bg-blue-100 rounded px-1">about_company</code>, <code className="bg-blue-100 rounded px-1">certificates</code> отображаются внутри раздела <strong>«О компании»</strong>.</p>
        <p>Все остальные страницы доступны по адресу <code className="bg-blue-100 rounded px-1">/pages/[ключ]</code> и автоматически появляются в шапке и футере сайта.</p>
      </div>
      <Card className="p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Добавить страницу</h2>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Ключ (key)" placeholder="about_person" value={newKey} onChange={e => setNewKey(e.target.value)} />
          <Input label="Заголовок" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
        </div>
        <Button size="sm" onClick={() => newKey.trim() && newTitle.trim() && createMut.mutate()} loading={createMut.isPending}>
          <Plus className="w-4 h-4" /> Создать
        </Button>
      </Card>
      <div className="space-y-3">
        {pages?.map(page => (
          <Card key={page.key} className="p-5">
            {editKey === page.key ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 font-mono">{page.key}</p>
                <Input label="Заголовок" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                <Textarea label="Контент (HTML)" rows={8} value={editContent} onChange={e => setEditContent(e.target.value)} />
                {page.imageUrl && <img src={page.imageUrl} alt="" className="h-24 rounded-lg object-cover" />}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 text-sm text-primary-600 cursor-pointer hover:text-primary-700">
                    <Upload className="w-4 h-4" /> Загрузить фото
                    <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files?.[0] ?? null)} />
                  </label>
                  {imageFile && <span className="text-xs text-gray-500">{imageFile.name}</span>}
                </div>
                {/* Gallery for special pages */}
                {(page.key === 'certificates' || page.key === 'about_person' || page.key === 'about_company') && (
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <p className="text-xs font-semibold text-gray-600">
                      {page.key === 'certificates' ? 'Фотографии сертификатов (галерея)' : 'Дополнительные фото (карусель)'}
                    </p>
                    <GalleryManager
                      settingKey={
                        page.key === 'certificates'   ? 'cert_images'          :
                        page.key === 'about_person'   ? 'about_person_images'  :
                                                        'about_company_images'
                      }
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateMut.mutate(page.key)} loading={updateMut.isPending}><Save className="w-4 h-4" /> Сохранить</Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditKey(null); setImageFile(null) }}>Отмена</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs text-gray-400 font-mono">{page.key}</p>
                    {['about_person','about_company','certificates'].includes(page.key)
                      ? <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">→ /about</span>
                      : <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">→ /pages/{page.key}</span>
                    }
                  </div>
                  <p className="font-semibold text-gray-900">{page.title}</p>
                  {page.content && <p className="text-sm text-gray-500 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: page.content }} />}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditKey(page.key); setEditTitle(page.title); setEditContent(page.content ?? '') }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteKey(page.key)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
      <Confirm open={deleteKey !== null} title="Удалить страницу?" message="Страница будет удалена безвозвратно."
        onConfirm={() => deleteKey && deleteMut.mutate(deleteKey)} onCancel={() => setDeleteKey(null)} loading={deleteMut.isPending} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// SITE SETTINGS
// ══════════════════════════════════════════════════════════════════
export function SiteSettings() {
  const qc = useQueryClient()
  const { data: settings, isLoading } = useQuery({ queryKey: ['admin-settings'], queryFn: settingsApi.getAll })
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  const labels: Record<string, string> = {
    site_name:         'Название сайта',
    phone:             'Телефон',
    email:             'Email',
    vk_url:            'ВКонтакте URL',
    instagram_url:     'Instagram URL',
    telegram_url:      'Telegram URL',
    site_description:  'Описание компании (в футере)',
    trust_title:       'Заголовок блока "Почему выбирают нас"',
    trust_1_title:     'Блок 1 — Заголовок',
    trust_1_desc:      'Блок 1 — Описание',
    trust_2_title:     'Блок 2 — Заголовок',
    trust_2_desc:      'Блок 2 — Описание',
    trust_3_title:     'Блок 3 — Заголовок',
    trust_3_desc:      'Блок 3 — Описание',
    ozon_url:          'Ссылка на Ozon',
    wb_url:            'Ссылка на Wildberries',
    articles_title:    'Заголовок страницы блога',
    articles_subtitle: 'Подзаголовок страницы блога',
    privacy_policy:    'Политика конфиденциальности (HTML)',
    terms_of_service:  'Пользовательское соглашение (HTML)',
  }

  const handleSave = async (key: string) => {
    setSaving(p => ({ ...p, [key]: true }))
    try {
      await settingsApi.update(key, values[key] ?? settings?.find(s => s.key === key)?.value ?? '')
      qc.invalidateQueries({ queryKey: ['settings'] })
      setSaved(p => ({ ...p, [key]: true }))
      setTimeout(() => setSaved(p => ({ ...p, [key]: false })), 2000)
    } finally {
      setSaving(p => ({ ...p, [key]: false }))
    }
  }

  if (isLoading) return <PageLoader />

  const textareaKeys = ['privacy_policy', 'terms_of_service', 'trust_1_desc', 'trust_2_desc', 'trust_3_desc']
  const brandingKeys    = ['site_name']
  const contactKeys     = ['phone', 'email', 'vk_url', 'instagram_url', 'telegram_url', 'site_description']
  const trustKeys       = ['trust_title', 'trust_1_title', 'trust_1_desc', 'trust_2_title', 'trust_2_desc', 'trust_3_title', 'trust_3_desc']
  const marketplaceKeys = ['ozon_url', 'wb_url']
  const articlesKeys    = ['articles_title', 'articles_subtitle']
  const legalKeys       = ['privacy_policy', 'terms_of_service']


  const renderField = (s: { key: string; value: string }) => {
    const isTextarea = textareaKeys.includes(s.key)
    const val = values[s.key] ?? s.value
    const label = labels[s.key] ?? s.key
    return (
      <Card key={s.key} className="p-5">
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          <Button size="sm" variant={saved[s.key] ? 'secondary' : 'outline'}
            loading={saving[s.key]} onClick={() => handleSave(s.key)}>
            <Save className="w-3.5 h-3.5" /> {saved[s.key] ? '✓ Сохранено' : 'Сохранить'}
          </Button>
        </div>
        {isTextarea ? (
          <textarea value={val} rows={4} onChange={e => setValues(p => ({ ...p, [s.key]: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400 resize-y" />
        ) : (
          <input value={val} onChange={e => setValues(p => ({ ...p, [s.key]: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400" />
        )}
      </Card>
    )
  }

  const renderSection = (title: string, keys: string[]) => {
    const items = (settings ?? []).filter(s => keys.includes(s.key))
    if (!items.length) return null
    return (
      <div key={title} className="space-y-3">
        <h2 className="text-base font-semibold text-gray-700 border-b border-gray-100 pb-2">{title}</h2>
        {keys.map(k => { const s = items.find(x => x.key === k); return s ? renderField(s) : null })}
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Системные настройки</h1>
      {renderSection('Брендинг', brandingKeys)}
      {renderSection('Контакты и соцсети', contactKeys)}
      {renderSection('Блок «Почему выбирают нас»', trustKeys)}
      {renderSection('Маркетплейсы', marketplaceKeys)}
      {renderSection('Страница блога', articlesKeys)}
      {renderSection('Юридические документы', legalKeys)}
    </div>
  )
}
