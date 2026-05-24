import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Check, X, ChevronRight, ChevronDown } from 'lucide-react'
import { categoriesApi } from '../../../api'
import { Button, Confirm, PageLoader, Card, Empty } from '../../../components/ui'
import { getErrorMessage } from '../../../api/client'
import type { CategoryFlat } from '../../../types'

type EditState = { name: string; parentId: number | '' }

// Узел дерева — CategoryFlat + дочерние узлы (рекурсивно)
type CatNode = CategoryFlat & { children: CatNode[] }

function buildTree(flat: CategoryFlat[], parentId: number | null = null): CatNode[] {
  return flat
    .filter(c => (c.parentId ?? null) === parentId)
    .map(c => ({ ...c, children: buildTree(flat, c.id) }))
}

// ── Каскадный dropdown для выбора родительской категории ─────────────────
function CascadeParentSelect({
  value, onChange, flat, excludeId,
}: {
  value: number | ''
  onChange: (id: number | '') => void
  flat: CategoryFlat[]
  excludeId?: number
}) {
  const [open, setOpen] = useState(false)
  const [hoveredRootId, setHoveredRootId] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setHoveredRootId(null)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Строим 2-уровневые группы для dropdown (root → их прямые дети)
  const roots    = flat.filter(c => !c.parentId && c.id !== excludeId)
  const childrenOf = (id: number) => flat.filter(c => c.parentId === id && c.id !== excludeId)

  const currentLabel = value === ''
    ? '— Корневая категория —'
    : flat.find(c => c.id === value)?.name ?? '...'

  const hoveredChildren = hoveredRootId !== null ? childrenOf(hoveredRootId) : []

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setHoveredRootId(null) }}
        className={`flex items-center justify-between gap-2 border rounded-lg px-3 py-2 text-sm bg-white min-w-[200px] transition-colors focus:outline-none ${
          open ? 'border-primary-400 ring-1 ring-primary-400' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <span className="truncate text-gray-700">{currentLabel}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 flex shadow-xl border border-gray-100 rounded-xl bg-white overflow-hidden">
          <div className="w-52 py-1.5 max-h-64 overflow-y-auto">
            <button type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                value === '' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-500 hover:bg-gray-50'
              }`}>
              — Корневая категория —
            </button>
            {roots.map(root => (
              <button key={root.id} type="button"
                onMouseEnter={() => setHoveredRootId(root.id)}
                onClick={() => { onChange(root.id); setOpen(false) }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between gap-2 ${
                  value === root.id ? 'bg-primary-50 text-primary-700 font-medium'
                  : hoveredRootId === root.id ? 'bg-gray-50 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-50'
                }`}>
                <span>{root.name}</span>
                {childrenOf(root.id).length > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
              </button>
            ))}
          </div>
          {hoveredChildren.length > 0 && (
            <div className="w-48 py-1.5 border-l border-gray-100 max-h-64 overflow-y-auto">
              {hoveredChildren.map(child => (
                <button key={child.id} type="button"
                  onClick={() => { onChange(child.id); setOpen(false) }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    value === child.id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                  }`}>
                  {child.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Основной компонент ────────────────────────────────────────────────────
export default function CategoriesList() {
  const qc = useQueryClient()
  const [editId, setEditId]       = useState<number | null>(null)
  const [editState, setEditState] = useState<EditState>({ name: '', parentId: '' })
  const [deleteId, setDeleteId]   = useState<number | null>(null)
  const [expanded, setExpanded]   = useState<Set<number>>(new Set())
  const [newName, setNewName]     = useState('')
  const [newParent, setNewParent] = useState<number | ''>('')
  const [error, setError]         = useState('')

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const { data: flat = [], isLoading } = useQuery({
    queryKey: ['categories-flat'],
    queryFn: categoriesApi.getFlat,
  })

  const tree = buildTree(flat)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['categories-flat'] })
    qc.invalidateQueries({ queryKey: ['categories'] })
  }

  const createMut = useMutation({
    mutationFn: () => categoriesApi.create({ name: newName.trim(), parentId: newParent || undefined }),
    onSuccess: () => { invalidate(); setNewName(''); setNewParent(''); setError('') },
    onError: (e) => setError(getErrorMessage(e)),
  })

  const updateMut = useMutation({
    mutationFn: ({ id }: { id: number }) => categoriesApi.update(id, {
      name: editState.name.trim() || undefined,
      parentId: editState.parentId || undefined,
    }),
    onSuccess: () => { invalidate(); setEditId(null) },
    onError: (e) => setError(getErrorMessage(e)),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => { invalidate(); setDeleteId(null) },
    onError: (e) => setError(getErrorMessage(e)),
  })

  const startEdit = (cat: CategoryFlat) => {
    setEditId(cat.id)
    setEditState({ name: cat.name, parentId: cat.parentId ?? '' })
    setError('')
  }

  // Рекурсивный рендер дерева
  const renderNode = (node: CatNode, depth = 0) => {
    const hasChildren = node.children.length > 0
    const isExpanded  = expanded.has(node.id)
    const isEditing   = editId === node.id

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 transition-colors"
          style={{ paddingLeft: `${16 + depth * 20}px` }}
        >
          {/* Стрелка раскрытия */}
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(node.id)}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors rounded"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
            </button>
          ) : depth > 0 ? (
            <ChevronRight className="flex-shrink-0 w-4 h-4 text-gray-300" />
          ) : (
            <span className="flex-shrink-0 w-5" />
          )}

          {/* Имя / форма редактирования */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  value={editState.name}
                  onChange={e => setEditState(s => ({ ...s, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && updateMut.mutate({ id: node.id })}
                  autoFocus
                  className="border border-primary-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400 min-w-[140px]"
                />
                <CascadeParentSelect
                  value={editState.parentId}
                  onChange={id => setEditState(s => ({ ...s, parentId: id }))}
                  flat={flat}
                  excludeId={node.id}
                />
              </div>
            ) : (
              <span className={`text-sm ${depth === 0 ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                {node.name}
              </span>
            )}
          </div>

          {/* Действия */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {isEditing ? (
              <>
                <button onClick={() => updateMut.mutate({ id: node.id })} disabled={updateMut.isPending}
                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setEditId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => startEdit(node)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Редактировать">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteId(node.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Удалить">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Дочерние узлы — только когда раскрыто */}
        {hasChildren && isExpanded && (
          <div className="border-t border-gray-50 bg-gray-50/30">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Категории</h1>

      {/* ── Добавить ────────────────────────────────────────────────── */}
      <Card className="p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Добавить категорию</h2>
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Название</label>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && newName.trim() && createMut.mutate()}
              placeholder="Например: Витамины"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Родительская категория</label>
            <CascadeParentSelect value={newParent} onChange={setNewParent} flat={flat} />
          </div>
          <Button onClick={() => newName.trim() && createMut.mutate()} loading={createMut.isPending}>
            <Plus className="w-4 h-4" /> Добавить
          </Button>
        </div>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </Card>

      {/* ── Дерево ──────────────────────────────────────────────────── */}
      {!flat.length ? (
        <Empty title="Категорий нет" />
      ) : (
        <Card className="overflow-hidden divide-y divide-gray-50">
          {tree.map(node => renderNode(node))}
        </Card>
      )}

      <Confirm
        open={deleteId !== null}
        title="Удалить категорию?"
        message="Удаление невозможно, если есть подкатегории или товары."
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMut.isPending}
      />
    </div>
  )
}
