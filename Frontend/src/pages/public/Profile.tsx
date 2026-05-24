import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { User, Lock, Heart } from 'lucide-react'
import { profileApi, authApi } from '../../api'
import { useAuthStore } from '../../store/authStore'
import { Input, Button, Card, PageLoader } from '../../components/ui'
import { getErrorMessage } from '../../api/client'

export default function Profile() {
  const { setUser } = useAuthStore()
  const qc = useQueryClient()
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.get,
  })

  const profileForm = useForm({
    defaultValues: { firstName: '', lastName: '', phone: '' },
  })
  const pwForm = useForm({
    defaultValues: { currentPassword: '', newPassword: '' },
  })

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        firstName: profile.firstName,
        lastName:  profile.lastName ?? '',
        phone:     profile.phone ?? '',
      })
      setUser(profile)
    }
  }, [profile]) // eslint-disable-line

  const updateMut = useMutation({
    mutationFn: (d: { firstName: string; lastName: string; phone: string }) =>
      profileApi.update(d),
    onSuccess: (updated) => {
      setUser(updated)
      qc.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  const pwMut = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => pwForm.reset(),
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Личный кабинет</h1>

      <div className="space-y-5">
        {/* Profile */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900">Личные данные</h2>
          </div>
          <form
            onSubmit={profileForm.handleSubmit(d => updateMut.mutate(d))}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <Input label="Имя"      {...profileForm.register('firstName')} />
              <Input label="Фамилия" {...profileForm.register('lastName')} />
            </div>
            <Input label="Телефон" type="tel" {...profileForm.register('phone')} />
            <div>
              <Input
                label="Email"
                value={profile?.email ?? ''}
                readOnly
                className="bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email изменить нельзя</p>
            </div>
            {updateMut.isError   && <p className="text-sm text-red-500">{getErrorMessage(updateMut.error)}</p>}
            {updateMut.isSuccess && <p className="text-sm text-green-600">✓ Сохранено</p>}
            <Button type="submit" loading={updateMut.isPending}>Сохранить</Button>
          </form>
        </Card>

        {/* Password */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <Lock className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900">Смена пароля</h2>
          </div>
          <form
            onSubmit={pwForm.handleSubmit(d => pwMut.mutate(d))}
            className="space-y-4"
          >
            <Input
              label="Текущий пароль"
              type="password"
              {...pwForm.register('currentPassword', { required: true })}
            />
            <Input
              label="Новый пароль"
              type="password"
              hint="Минимум 8 символов"
              {...pwForm.register('newPassword', { required: true, minLength: 8 })}
            />
            {pwMut.isError   && <p className="text-sm text-red-500">{getErrorMessage(pwMut.error)}</p>}
            {pwMut.isSuccess && <p className="text-sm text-green-600">✓ Пароль изменён</p>}
            <Button type="submit" loading={pwMut.isPending}>Изменить пароль</Button>
          </form>
        </Card>

        {/* Favorites */}
        <Link
          to="/favorites"
          className="flex items-center gap-3 p-5 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all group"
        >
          <Heart className="w-5 h-5 text-red-400 fill-red-400" />
          <span className="font-medium text-gray-900 group-hover:text-primary-700">Моё избранное</span>
          <span className="ml-auto text-gray-400 group-hover:text-primary-500">→</span>
        </Link>
      </div>
    </div>
  )
}
