import { useNavigate, useLocation } from 'react-router-dom'
import { Home, BookOpen, Compass, MessageCircle, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LocationState } from '../types'

// ─── BottomNav ────────────────────────────────────────────────
export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname, state } = useLocation()
  const { t } = useTranslation()
  const locationState = state as LocationState

  const TABS = [
    {
      label: t('nav.home'),
      icon: Home,
      path: '/',
      state: {},
      active: (p: string, s?: LocationState) => p === '/' && (!s?.initialScreen || s?.initialScreen === 'HOME'),
    },
    {
      label: t('nav.learn'),
      icon: BookOpen,
      path: '/',
      state: { initialScreen: 'LEARN_PROGRAM' },
      active: (_: string, s?: LocationState) => s?.initialScreen === 'LEARN_PROGRAM',
    },
    {
      label: t('nav.qibla'),
      icon: Compass,
      path: '/tools',
      state: { initialScreen: 'QIBLA' },
      active: (p: string, s?: LocationState) => p === '/tools' && s?.initialScreen === 'QIBLA',
    },
    {
      label: t('nav.ask'),
      icon: MessageCircle,
      path: '/ask',
      state: {},
      active: (p: string) => p === '/ask',
    },
    {
      label: t('nav.settings'),
      icon: Settings,
      path: '/settings',
      state: {},
      active: (p: string) => p === '/settings',
    },
  ]

  return (
    <nav className="
      fixed bottom-0 left-0 right-0 z-50
      bg-bg-light
      border-t border-gray-100 dark:border-white/8
      px-2 pb-safe
      shadow-[0_-4px_24px_rgba(0,0,0,0.06)]
    ">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {TABS.map(({ label, icon: Icon, path, state: tabState, active }) => {
          // ✅ FIX: بنمرر locationState عشان يحسب الـ active highlight بصح
          const isActive = active(pathname, locationState)

          return (
            <button
              key={label}
              // ✅ FIX: كانت بتبعت state (الـ location state الحالية) بالغلط
              // ده كان بيخلي كل tab يفتح الـ screen اللي كانت مفتوحة قبله
              // الصح: tabState — وهو الـ state الخاص بكل tab زي { initialScreen: 'QIBLA' }
              onClick={() => navigate(path, { state: tabState })}
              className="
                relative flex flex-col items-center gap-1
                py-3 px-3 min-w-[60px]
                tap-bounce transition-all duration-150
              "
            >
              {/* Active pill indicator */}
              {isActive && (
                <span className="
                  absolute top-2 left-1/2 -translate-x-1/2
                  w-10 h-10 rounded-full
                  bg-primary/10 dark:bg-primary/20
                " />
              )}

              {/* Icon */}
              <Icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.7}
                className={`
                  relative z-10 transition-all duration-150
                  ${isActive
                    ? 'text-primary dark:text-accent scale-110'
                    : 'text-gray-400 dark:text-gray-600'
                  }
                `}
              />

              {/* Label */}
              <span className={`
                text-[10px] font-semibold leading-none relative z-10
                transition-colors duration-150
                ${isActive
                  ? 'text-primary dark:text-accent'
                  : 'text-gray-400 dark:text-gray-600'
                }
              `}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}