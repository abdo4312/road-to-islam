// src/components/UserMenu.tsx
// مثال على استخدام useAuth في أي component
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function UserMenu() {
  const { profile, isAdmin, signOut } = useAuth()
  const navigate  = useNavigate()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    try {
      await signOut()
      navigate('/auth', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  if (!profile) return null

  return (
    <div className="flex items-center gap-3 p-4 bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-800">

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <span className="text-primary font-bold text-base">
            {profile.full_name?.[0] ?? '؟'}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 text-right min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {profile.full_name ?? 'مستخدم'}
        </p>
        <span className={`
          text-xs px-2 py-0.5 rounded-full font-medium
          ${isAdmin
            ? 'bg-accent/20 text-yellow-700 dark:text-yellow-400'
            : 'bg-primary/10 text-primary'
          }
        `}>
          {isAdmin ? '👑 مشرف' : '🎓 طالب'}
        </span>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        disabled={loading}
        className="text-xs text-gray-400 dark:text-gray-600 hover:text-red-500 tap-bounce transition-colors"
      >
        {loading ? '...' : 'خروج'}
      </button>
    </div>
  )
}
