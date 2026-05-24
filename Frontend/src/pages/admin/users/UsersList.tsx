import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { adminUsersApi } from '../../../api'
import { Button, Input, Confirm, PageLoader, Card, Badge, Pagination } from '../../../components/ui'
import { useAuthStore } from '../../../store/authStore'
import type { StaffListItem } from '../../../types'

export function UsersList() {
  const qc = useQueryClient()
  const { user: currentUser } = useAuthStore()
  const [page, setPage] = useState(1)
  const [staffPage, setStaffPage] = useState(1)
  const [search, setSearch] = useState('')
  const [staffSearch, setStaffSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [staffSearchInput, setStaffSearchInput] = useState('')
  const [activeTab, setActiveTab] = useState<'buyers' | 'staff'>('buyers')
  const [showCreateStaff, setShowCreateStaff] = useState(false)
  const [staffForm, setStaffForm] = useState({ email: '', password: '', firstName: '', lastName: '', roleName: 'ContentManager' })
  const [confirmBlock, setConfirmBlock] = useState<{ id: string; name: string; block: boolean } | null>(null)
  const [blockError, setBlockError] = useState('')

  const { data: buyersData, isLoading: buyersLoading } = useQuery({
    queryKey: ['admin-buyers', page, search],
    queryFn: () => adminUsersApi.getBuyers(page, 20, search || undefined),
  })

  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ['admin-staff', staffPage, staffSearch],
    queryFn: () => adminUsersApi.getStaff(staffPage, 20, staffSearch || undefined),
  })

  const createStaff = useMutation({
    mutationFn: () => adminUsersApi.createStaff(staffForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-staff'] })
      setShowCreateStaff(false)
      setStaffForm({ email: '', password: '', firstName: '', lastName: '', roleName: 'ContentManager' })
    },
  })

  const setStatus = useMutation({
    mutationFn: ({ id, block }: { id: string; block: boolean }) => adminUsersApi.setStatus(id, block),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-buyers'] })
      qc.invalidateQueries({ queryKey: ['admin-staff'] })
      setConfirmBlock(null)
      setBlockError('')
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Ошибка при изменении статуса'
      setBlockError(msg)
    },
  })

  const isCurrentUser = (id: string) => currentUser?.id === id

  const canBlockStaff = (staff: StaffListItem) => {
    // SuperAdmin cannot be blocked by anyone
    if (staff.role === 'SuperAdmin') return false
    // Cannot block yourself
    if (isCurrentUser(staff.id)) return false
    return true
  }

  if (buyersLoading && activeTab === 'buyers') return <PageLoader />
  if (staffLoading && activeTab === 'staff') return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
        <Button onClick={() => setShowCreateStaff(true)}><Plus className="w-4 h-4" /> Добавить сотрудника</Button>
      </div>

      {/* Create staff form */}
      {showCreateStaff && (
        <Card className="p-5 space-y-3 max-w-md border-primary-200 bg-primary-50/30">
          <h2 className="font-semibold text-gray-900">Новый сотрудник</h2>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Имя" value={staffForm.firstName} onChange={e => setStaffForm(p => ({ ...p, firstName: e.target.value }))} />
            <Input label="Фамилия" value={staffForm.lastName} onChange={e => setStaffForm(p => ({ ...p, lastName: e.target.value }))} />
          </div>
          <Input label="Email" type="email" value={staffForm.email} onChange={e => setStaffForm(p => ({ ...p, email: e.target.value }))} />
          <Input label="Пароль" type="password" value={staffForm.password} onChange={e => setStaffForm(p => ({ ...p, password: e.target.value }))} />
          <div>
            <label className="text-sm font-medium text-gray-700">Роль</label>
            <select value={staffForm.roleName} onChange={e => setStaffForm(p => ({ ...p, roleName: e.target.value }))}
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400">
              <option value="ContentManager">ContentManager</option>
              <option value="SuperAdmin">SuperAdmin</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => createStaff.mutate()} loading={createStaff.isPending}>Создать</Button>
            <Button variant="outline" onClick={() => setShowCreateStaff(false)}>Отмена</Button>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('buyers')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'buyers'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Покупатели {buyersData ? `(${buyersData.totalCount})` : ''}
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'staff'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Сотрудники {staffData ? `(${staffData.totalCount})` : ''}
        </button>
      </div>

      {/* BUYERS TAB */}
      {activeTab === 'buyers' && (
        <div className="space-y-4">
          {/* Search */}
          <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); setPage(1) }} className="flex gap-2 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Поиск по имени или email..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
            <Button type="submit" size="sm">Найти</Button>
            {search && (
              <Button type="button" size="sm" variant="outline" onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}>
                Сбросить
              </Button>
            )}
          </form>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Имя</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Email</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Статус</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Дата</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {buyersData?.items.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.fullName}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{u.email}</td>
                    <td className="px-4 py-3 text-center">
                      {u.status === 'Active' ? <Badge label="Активен" variant="green" /> : <Badge label="Заблокирован" variant="red" />}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">
                      {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setConfirmBlock({ id: u.id, name: u.fullName, block: u.status === 'Active' })}
                        className={`text-xs px-2 py-1 rounded-lg transition-colors font-medium ${
                          u.status === 'Active'
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {u.status === 'Active' ? 'Заблокировать' : 'Разблокировать'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-center p-4">
              <Pagination page={page} totalPages={buyersData?.totalPages ?? 1} onChange={setPage} />
            </div>
          </div>
        </div>
      )}

      {/* STAFF TAB */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          {/* Search */}
          <form onSubmit={e => { e.preventDefault(); setStaffSearch(staffSearchInput); setStaffPage(1) }} className="flex gap-2 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={staffSearchInput}
                onChange={e => setStaffSearchInput(e.target.value)}
                placeholder="Поиск по имени или email..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
            <Button type="submit" size="sm">Найти</Button>
            {staffSearch && (
              <Button type="button" size="sm" variant="outline" onClick={() => { setStaffSearch(''); setStaffSearchInput(''); setStaffPage(1) }}>
                Сбросить
              </Button>
            )}
          </form>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Имя</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Роль</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Статус</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {staffData?.items.map(u => (
                  <tr key={u.id} className={`hover:bg-gray-50/50 ${isCurrentUser(u.id) ? 'bg-primary-50/30' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {u.fullName}
                      {isCurrentUser(u.id) && <span className="ml-2 text-xs text-primary-600">(вы)</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge
                        label={u.role}
                        variant={u.role === 'SuperAdmin' ? 'red' : 'gray'}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.status === 'Active' ? <Badge label="Активен" variant="green" /> : <Badge label="Заблокирован" variant="red" />}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canBlockStaff(u) && (
                        <button
                          onClick={() => setConfirmBlock({ id: u.id, name: u.fullName, block: u.status === 'Active' })}
                          className={`text-xs px-2 py-1 rounded-lg transition-colors font-medium ${
                            u.status === 'Active'
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {u.status === 'Active' ? 'Заблокировать' : 'Разблокировать'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-center p-4">
              <Pagination page={staffPage} totalPages={staffData?.totalPages ?? 1} onChange={setStaffPage} />
            </div>
          </div>
        </div>
      )}

      {/* Block/Unblock confirmation */}
      <Confirm
        open={confirmBlock !== null}
        title={confirmBlock?.block ? 'Заблокировать пользователя?' : 'Разблокировать пользователя?'}
        message={blockError
          ? `Ошибка: ${blockError}`
          : `Вы уверены, что хотите ${confirmBlock?.block ? 'заблокировать' : 'разблокировать'} пользователя ${confirmBlock?.name}?`
        }
        confirmLabel={confirmBlock?.block ? 'Заблокировать' : 'Разблокировать'}
        confirmVariant={confirmBlock?.block ? 'danger' : 'primary'}
        onConfirm={() => confirmBlock && setStatus.mutate({ id: confirmBlock.id, block: confirmBlock.block })}
        onCancel={() => { setConfirmBlock(null); setBlockError('') }}
        loading={setStatus.isPending}
      />
    </div>
  )
}

export default UsersList
