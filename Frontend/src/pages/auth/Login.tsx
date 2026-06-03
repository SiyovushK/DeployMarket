import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff } from 'lucide-react'
import { authApi } from '../../api'
import { useAuthStore } from '../../store/authStore'
import { Input, Button } from '../../components/ui'
import { getErrorMessage } from '../../api/client'

function AuthCard({ title, subtitle, children }: { title: string; subtitle: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500 mt-1 text-sm">{subtitle}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {children}
        </div>
      </div>
    </div>
  )
}

export function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string; password: string }>()
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const onSubmit = async (data: { email: string; password: string }) => {
    setError(''); setLoading(true)
    try {
      const res = await authApi.login(data)
      login(res)
      // Redirect based on role
      if (res.role === 'ContentManager' || res.role === 'SuperAdmin') navigate('/admin')
      else navigate('/')
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Вход в аккаунт" subtitle={<>Нет аккаунта? <Link to="/register" className="text-primary-600 font-medium hover:underline">Зарегистрироваться</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email" type="email" autoComplete="email" autoFocus
          error={errors.email?.message}
          {...register('email', { required: 'Введите email' })}
        />
        <div className="relative">
          <Input
            label="Пароль" type={showPw ? 'text' : 'password'} autoComplete="current-password"
            error={errors.password?.message}
            {...register('password', { required: 'Введите пароль' })}
          />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading}>Войти</Button>
      </form>
    </AuthCard>
  )
}

export function Register() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<{
    email: string; password: string; confirmPassword: string; firstName: string; lastName: string; phone: string
  }>()
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const onSubmit = async (data: any) => {
    setError(''); setLoading(true)
    try {
      const res = await authApi.register({
        email: data.email, password: data.password,
        firstName: data.firstName, lastName: data.lastName, phone: data.phone || undefined,
      })
      login(res)
      navigate('/')
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Регистрация" subtitle={<>Уже есть аккаунт? <Link to="/login" className="text-primary-600 font-medium hover:underline">Войти</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Имя" autoFocus error={errors.firstName?.message}
            {...register('firstName', { required: 'Введите имя' })} />
          <Input label="Фамилия" {...register('lastName')} />
        </div>
        <Input label="Email" type="email" error={errors.email?.message}
          {...register('email', { required: 'Введите email', pattern: { value: /^\S+@\S+$/, message: 'Некорректный email' } })} />
        <Input label="Телефон" type="tel" {...register('phone')} />
        <div className="relative">
          <Input label="Пароль" type={showPw ? 'text' : 'password'}
            hint="Минимум 8 символов" error={errors.password?.message}
            {...register('password', { required: 'Введите пароль', minLength: { value: 8, message: 'Минимум 8 символов' } })}
          />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Input label="Повторите пароль" type="password" error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Подтвердите пароль',
            validate: v => v === watch('password') || 'Пароли не совпадают',
          })}
        />
        {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading}>Зарегистрироваться</Button>
        <p className="text-xs text-gray-400 text-center">
          Регистрируясь, вы соглашаетесь с <Link to="/terms" className="underline">условиями использования</Link>
        </p>
      </form>
    </AuthCard>
  )
}

export default Login
