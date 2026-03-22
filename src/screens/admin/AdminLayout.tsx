// src/screens/admin/AdminLayout.tsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useState } from 'react'

const NAV = [
  { to: '/admin',           icon: '◈', label: 'الإحصائيات',  end: true },
  { to: '/admin/subjects',  icon: '◉', label: 'المواد'               },
  { to: '/admin/lectures',  icon: '◎', label: 'المحاضرات'            },
  { to: '/admin/users',     icon: '◍', label: 'المستخدمون'           },
  { to: '/admin/questions', icon: '◌', label: 'الأسئلة'              },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [sideOpen, setSideOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/auth', { replace: true })
  }

  return (
    <div className="min-h-screen flex bg-[#f4f6f3] dark:bg-[#0d1510]" dir="rtl">

      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 right-0 z-40 flex flex-col
        w-56 bg-[#1B5E20] text-white
        transition-transform duration-300
        ${sideOpen ? 'translate-x-0' : 'translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex
      `}>

        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-lg">
              🕌
            </div>
            <div>
              <p className="text-sm font-bold leading-none">لوحة الإدارة</p>
              <p className="text-[10px] text-white/50 mt-0.5">المحاضرات الإسلامية</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSideOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                transition-all duration-150
                ${isActive
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
                }
              `}
            >
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Profile */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-sm font-bold">
              {profile?.full_name?.[0] ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{profile?.full_name ?? 'Admin'}</p>
              <p className="text-[10px] text-white/40">مشرف</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full text-xs text-white/50 hover:text-white/80 text-right transition-colors"
          >
            ← تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sideOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSideOpen(false)}
        />
      )}

      {/* ── Main ── */}
      <main className="flex-1 min-w-0 flex flex-col">

        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-[#f4f6f3]/80 dark:bg-[#0d1510]/80 backdrop-blur-md border-b border-black/5 dark:border-white/5 px-5 py-3 flex items-center justify-between">
          <button
            onClick={() => setSideOpen(v => !v)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-[#1B5E20]/10 text-[#1B5E20]"
          >
            ☰
          </button>
          <div className="flex items-center gap-2 mr-auto">
            <NavLink
              to="/"
              className="text-xs text-gray-400 hover:text-[#1B5E20] transition-colors flex items-center gap-1"
            >
              <span>←</span> التطبيق
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-5 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
