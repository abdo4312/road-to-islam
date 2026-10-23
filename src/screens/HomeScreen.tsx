// src/screens/MainScreens.tsx
import React from 'react'
import { Screen } from '../types'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, ChevronRight, Sun, Moon,
  Clock, BookOpen, Compass, MapPin,
  HelpCircle, Users, X,
} from 'lucide-react'
import { useDailyJourney } from '../hooks/useProgress'
import { usePrayerTimes } from '../hooks/usePrayerTimes'
import { useLiveCountdown } from '../hooks/useLiveCountdown'
import { useDarkMode } from '../hooks/useDarkMode'
import { useNotifications } from '../hooks/useNotifications'
import { LESSONS } from '../constants/lessons'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'

// ── Home ──────────────────────────────────────────────────────
export const Home = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const { t } = useTranslation()
  const { currentDay, progressPercent, userName } = useDailyJourney()
  const { nextPrayer } = usePrayerTimes()
  const { countdown, prayerNameAr: liveNextNameAr } = useLiveCountdown()
  const { isDark, toggle: toggleDarkMode } = useDarkMode()
  const { unreadCount } = useNotifications()
  const { user } = useAuth()
  const isMentor = user?.user_metadata?.role === 'mentor'
  const currentLesson = LESSONS.find(l => l.day === currentDay) || LESSONS[0]

  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null)
  const [showInstallBanner, setShowInstallBanner] = React.useState(false)

  React.useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') { setDeferredPrompt(null); setShowInstallBanner(false) }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col bg-bg-light pb-6 overflow-y-auto relative islamic-pattern min-h-full"
    >
      {/* ── Header ── */}
      <div className="bg-primary text-white p-6 pt-12 pb-6 rounded-b-3xl shadow-lg relative overflow-hidden transition-colors duration-300">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
          <svg viewBox="0 0 24 24" width="160" height="160" fill="currentColor"><path d="M12 2L2 22h20L12 2z" /></svg>
        </div>

        {/* Greeting & Logo */}
        <div className="flex justify-between items-start mb-6 relative z-10" dir="ltr">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl p-2 backdrop-blur-md shadow-inner border border-white/20">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-emerald-100 dark:text-emerald-200/60 text-sm font-medium">{t('home.greeting')}</p>
              <h2 className="text-3xl font-bold font-serif text-accent">{userName}</h2>
            </div>
          </div>
          <div className="flex gap-2" style={{ direction: 'ltr' }}>
            <button 
              onClick={toggleDarkMode} 
              className="p-3 bg-white/10 dark:bg-black/20 hover:bg-white/20 transition rounded-full backdrop-blur-sm border border-white/20 dark:border-white/10 tap-bounce overflow-hidden relative w-12 h-12 flex items-center justify-center shadow-lg"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isDark ? 'dark' : 'light'}
                  initial={{ y: 20, opacity: 0, scale: 0.5, rotate: -90 }}
                  animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ y: -20, opacity: 0, scale: 0.5, rotate: 90 }}
                  transition={{ duration: 0.25, ease: "backOut" }}
                >
                  {isDark ? <Sun size={24} className="text-accent" /> : <Moon size={24} className="text-white" />}
                </motion.div>
              </AnimatePresence>
            </button>
            <button 
              onClick={() => setScreen('NOTIFICATIONS')}
              className="p-3 bg-white/10 hover:bg-white/20 transition rounded-full relative backdrop-blur-sm border border-white/20 tap-bounce"
            >
              <Bell size={24} className="text-white" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full border-2 border-primary text-[10px] font-bold flex items-center justify-center text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Next Prayer */}
        <div className="bg-black/30 backdrop-blur-md rounded-2xl p-5 flex items-center justify-between border border-white/25 shadow-inner relative z-10">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1 flex items-center gap-1">
              <Clock size={14} /> {t('home.nextPrayer')}
            </p>
            <h3 className="text-2xl font-bold text-white">
              {liveNextNameAr || nextPrayer?.name || t('common.loading')}
            </h3>
            <p className="text-sm mt-1 text-emerald-200 font-mono tabular-nums">
              {nextPrayer?.time || '--:--'} · {countdown || '--:--:--'}
            </p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Clock size={32} className="text-white drop-shadow-md" />
          </div>
        </div>
      </div>

      <div className="p-6 relative z-10">
        {/* Progress */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-bold text-primary dark:text-accent font-serif">{t('homeScreen.dailyProgress')}</h3>
          <button onClick={() => setScreen('LEARN_PROGRAM')} className="text-primary dark:text-accent text-sm font-semibold flex items-center tap-bounce">
            {t('homeScreen.viewAll')} <ChevronRight size={16} />
          </button>
        </div>

        <div
          onClick={() => setScreen('LEARN_PROGRAM')}
          className="bg-bg-light rounded-2xl p-5 shadow-md border-2 border-primary/10 dark:border-accent/10 mb-8 cursor-pointer hover:border-primary/30 transition tap-bounce"
        >
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase tracking-wider">
                {t('learn.weekLabel', { num: currentLesson.week })}
              </p>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">{t('learn.dayOf30', { day: currentDay })}</h4>
            </div>
            <span className="text-primary dark:text-accent font-bold text-2xl">{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 mb-4 shadow-inner">
            <div
              className="bg-primary dark:bg-accent h-3 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border-l-4 border-l-primary dark:border-l-accent flex items-center gap-2">
            <BookOpen size={16} className="text-primary dark:text-accent shrink-0" />
            {currentLesson.title}
          </p>
        </div>

        {/* Quick Access */}
        <h3 className="text-xl font-bold text-primary dark:text-accent font-serif mb-5">{t('homeScreen.quickAccess')}</h3>
        <div className="grid grid-cols-3 gap-4">
          <QuickCard icon={Clock} label={t('quickAccess.prayer')} onClick={() => setScreen('PRAYER_TIMES')} color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" />
          <QuickCard icon={BookOpen} label={t('quickAccess.learn')} onClick={() => setScreen('LEARN_PROGRAM')} color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" />
          <QuickCard icon={Compass} label={t('quickAccess.qibla')} onClick={() => setScreen('QIBLA')} color="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" />
          <QuickCard icon={HelpCircle} label={t('quickAccess.faq')} onClick={() => setScreen('ASK_CATEGORIES')} color="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" />
          {isMentor ? (
            <QuickCard icon={Users} label={t('quickAccess.requests')} onClick={() => setScreen('MENTOR_DASHBOARD')} color="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" />
          ) : (
            <QuickCard icon={Users} label={t('quickAccess.mentor')} onClick={() => setScreen('FIND_MENTOR')} color="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" />
          )}
          <QuickCard icon={MapPin} label={t('quickAccess.mosques')} onClick={() => setScreen('MOSQUES')} color="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" />
        </div>
      </div>

      {/* Install Banner */}
      <AnimatePresence>
        {showInstallBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 z-50 bg-primary dark:bg-emerald-900 text-white p-4 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-xl">🕌</span>
                </div>
                <div>
                  <p className="font-bold text-sm">{t('homeScreen.installApp')}</p>
                  <p className="text-xs text-emerald-100">{t('homeScreen.addToHomeScreen')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleInstallClick} className="bg-white text-primary px-4 py-2 rounded-lg text-xs font-bold tap-bounce shadow-md">{t('homeScreen.install')}</button>
                <button onClick={() => setShowInstallBanner(false)} className="p-2 text-white/60 hover:text-white transition tap-bounce"><X size={18} /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface QuickCardProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color: string;
}

const QuickCard = ({ icon: Icon, label, onClick, color }: QuickCardProps) => (
  <button
    onClick={onClick}
    className="bg-bg-light rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm border border-gray-100 dark:border-white/5 gap-3 transition hover:shadow-md hover:border-primary/20 cursor-pointer tap-bounce"
  >
    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${color}`}><Icon size={28} /></div>
    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{label}</span>
  </button>
)
