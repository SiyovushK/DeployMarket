import React from 'react'
import { Loader2 } from 'lucide-react'

// ── Button ────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  children,
  className = '',
  ...props
}) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:   'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-primary-100 text-primary-800 hover:bg-primary-200 focus:ring-primary-400',
    outline:   'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400',
    ghost:     'text-gray-600 hover:bg-gray-100 focus:ring-gray-400',
    danger:    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
)
Input.displayName = 'Input'

// ── Textarea ──────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        ref={ref}
        className={`w-full px-3 py-2 border rounded-lg text-sm resize-none transition-colors
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}
          ${className}`}
        rows={4}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'

// ── Select ────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string | number; label: string }>
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        ref={ref}
        className={`w-full px-3 py-2 border rounded-lg text-sm bg-white transition-colors
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          ${error ? 'border-red-400' : 'border-gray-300'}
          ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
)
Select.displayName = 'Select'

// ── Spinner ───────────────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size]
  return <Loader2 className={`${s} animate-spin text-primary-600`} />
}

export const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Spinner size="lg" />
  </div>
)

// ── Badge ─────────────────────────────────────────────────────────────────
interface BadgeProps { label: string; variant?: 'green' | 'yellow' | 'red' | 'gray' | 'blue' }

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'gray' }) => {
  const styles = {
    green:  'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red:    'bg-red-100 text-red-800',
    gray:   'bg-gray-100 text-gray-700',
    blue:   'bg-blue-100 text-blue-800',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>
      {label}
    </span>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
)

// ── Modal ─────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  maxWidth?: string
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <span className="text-xl leading-none">✕</span>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ── Confirm dialog ────────────────────────────────────────────────────────
interface ConfirmProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  confirmVariant?: 'danger' | 'primary' | 'secondary'
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export const Confirm: React.FC<ConfirmProps> = ({
  open, title, message, confirmLabel = 'Удалить', confirmVariant = 'danger', onConfirm, onCancel, loading,
}) => (
  <Modal open={open} onClose={onCancel} title={title} maxWidth="max-w-md">
    <p className="text-gray-600 mb-6">{message}</p>
    <div className="flex gap-3 justify-end">
      <Button variant="outline" onClick={onCancel}>Отмена</Button>
      <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
    </div>
  </Modal>
)

// ── Pagination ────────────────────────────────────────────────────────────
interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1)

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
      >← Назад</button>

      {pages.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors
            ${p === page
              ? 'bg-primary-600 text-white border-primary-600'
              : 'border-gray-200 hover:bg-gray-50'}`}
        >{p}</button>
      ))}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
      >Вперёд →</button>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────
export const Empty: React.FC<{ icon?: React.ReactNode; title: string; description?: string }> = ({
  icon, title, description,
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {icon && <div className="text-gray-300 mb-4">{icon}</div>}
    <h3 className="text-lg font-medium text-gray-700 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500">{description}</p>}
  </div>
)

// ── Toggle ────────────────────────────────────────────────────────────────
interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2 cursor-pointer select-none">
    <div
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${checked ? 'bg-primary-600' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </div>
    {label && <span className="text-sm text-gray-700">{label}</span>}
  </label>
)

export { GalleryManager } from './GalleryManager'
