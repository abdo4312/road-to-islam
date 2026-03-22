// src/screens/admin/ui.tsx
// مكونات مشتركة بين كل صفحات الـ Admin

import React, { type ReactNode, useEffect, useRef } from 'react'

// ══════════════════════════════════════════════════════════════
// MODAL
// ══════════════════════════════════════════════════════════════
interface ModalProps {
  open:     boolean
  onClose:  () => void
  title:    string
  children: ReactNode
  size?:    'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null)

  // إغلاق بـ Escape
  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [open, onClose])

  if (!open) return null

  const sizeClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Card */}
      <div
        ref={ref}
        className={`
          relative z-10 w-full ${sizeClass}
          bg-white dark:bg-[#1a2e1a]
          rounded-2xl shadow-xl
          border border-black/8 dark:border-white/8
          max-h-[90vh] overflow-y-auto
        `}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-white/5">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-sm"
          >
            ✕
          </button>
        </div>
        {/* Body */}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}


// ══════════════════════════════════════════════════════════════
// CONFIRM DIALOG
// ══════════════════════════════════════════════════════════════
interface ConfirmProps {
  open:    boolean
  message: string
  onConfirm: () => void
  onCancel:  () => void
  loading?:  boolean
}

export function Confirm({ open, message, onConfirm, onCancel, loading }: ConfirmProps) {
  return (
    <Modal open={open} onClose={onCancel} title="تأكيد" size="sm">
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 text-right leading-relaxed">
        {message}
      </p>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 transition-all">
          إلغاء
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-sm text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          {loading && <Spinner size="xs" />}
          تأكيد الحذف
        </button>
      </div>
    </Modal>
  )
}


// ══════════════════════════════════════════════════════════════
// FORM INPUTS
// ══════════════════════════════════════════════════════════════
interface FieldProps {
  label:       string
  required?:   boolean
  error?:      string
  children:    ReactNode
}

export function Field({ label, required, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 text-right">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 text-right">{error}</p>}
    </div>
  )
}

const inputClass = `
  w-full px-3 py-2.5 rounded-xl text-sm text-right
  bg-gray-50 dark:bg-white/5
  border border-gray-200 dark:border-white/10
  text-gray-900 dark:text-gray-100
  placeholder:text-gray-400 dark:placeholder:text-gray-600
  focus:outline-none focus:ring-2 focus:ring-[#1B5E20]/40 focus:border-[#1B5E20]
  transition-all
`

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} dir="rtl" className={inputClass + ' ' + (props.className ?? '')} />
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      dir="rtl"
      rows={props.rows ?? 3}
      className={inputClass + ' resize-none ' + (props.className ?? '')}
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      dir="rtl"
      className={inputClass + ' ' + (props.className ?? '')}
    />
  )
}


// ══════════════════════════════════════════════════════════════
// TABLE
// ══════════════════════════════════════════════════════════════
interface Column<T> {
  key:      string
  label:    string
  render?:  (row: T) => ReactNode
  width?:   string
}

interface TableProps<T> {
  columns:   Column<T>[]
  data:      T[]
  keyField:  keyof T
  isLoading?: boolean
  emptyText?: string
}

export function Table<T>({ columns, data, keyField, isLoading, emptyText = 'لا توجد بيانات' }: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-black/5 dark:border-white/5">
      <table className="w-full text-sm" dir="rtl">
        <thead>
          <tr className="bg-gray-50 dark:bg-white/5 border-b border-black/5 dark:border-white/5">
            {columns.map(c => (
              <th
                key={c.key}
                style={{ width: c.width }}
                className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-[#1a2e1a] divide-y divide-black/4 dark:divide-white/4">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <tr key={i} className="animate-skeleton">
                {columns.map(c => (
                  <td key={c.key} className="px-4 py-3">
                    <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-gray-400 text-sm">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map(row => (
              <tr key={String(row[keyField])} className="hover:bg-gray-50 dark:hover:bg-white/3 transition-colors">
                {columns.map(c => (
                  <td key={c.key} className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                    {c.render ? c.render(row) : String((row as any)[c.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}


// ══════════════════════════════════════════════════════════════
// MISC
// ══════════════════════════════════════════════════════════════
interface SpinnerProps { size?: 'xs' | 'sm' | 'md' }
export function Spinner({ size = 'sm' }: SpinnerProps) {
  const s = { xs: 'w-3 h-3 border', sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2' }[size]
  return (
    <div className={`${s} border-current/30 border-t-current rounded-full animate-spin`} />
  )
}

interface BadgeProps { children: ReactNode; color?: 'green' | 'gray' | 'red' | 'blue' | 'amber' }
export function Badge({ children, color = 'gray' }: BadgeProps) {
  const c = {
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    gray:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    red:   'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    blue:  'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  }[color]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c}`}>
      {children}
    </span>
  )
}

interface PageHeaderProps {
  title:       string
  subtitle?:   string
  action?:     ReactNode
}
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function ActionBtn({
  onClick, variant = 'primary', children, loading, disabled,
}: {
  onClick?: () => void
  variant?: 'primary' | 'danger' | 'ghost'
  children: ReactNode
  loading?:  boolean
  disabled?: boolean
}) {
  const v = {
    primary: 'bg-[#1B5E20] hover:bg-[#2E7D32] text-white',
    danger:  'bg-red-500 hover:bg-red-600 text-white',
    ghost:   'bg-gray-100 dark:bg-white/8 hover:bg-gray-200 dark:hover:bg-white/12 text-gray-700 dark:text-gray-300',
  }[variant]

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
        transition-all disabled:opacity-50 tap-bounce
        ${v}
      `}
    >
      {loading && <Spinner size="xs" />}
      {children}
    </button>
  )
}
