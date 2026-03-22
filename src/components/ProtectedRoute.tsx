// src/components/ProtectedRoute.tsx
import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// ─── شاشة تحميل بسيطة ─────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">جاري التحميل...</p>
      </div>
    </div>
  )
}

// ─── Protected Route: يحتاج تسجيل دخول ───────────────────────
interface ProtectedRouteProps {
  children: ReactNode
  redirectTo?: string
}

export function ProtectedRoute({
  children,
  redirectTo = '/auth',
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <LoadingScreen />
  if (!user) return <Navigate to={redirectTo} replace />

  return <>{children}</>
}

// ─── Admin Route: يحتاج صلاحية admin ─────────────────────────
interface AdminRouteProps {
  children: ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAdmin, isLoading } = useAuth()

  if (isLoading) return <LoadingScreen />
  if (!user)    return <Navigate to="/auth" replace />
  if (!isAdmin) return <Navigate to="/"    replace />

  return <>{children}</>
}
