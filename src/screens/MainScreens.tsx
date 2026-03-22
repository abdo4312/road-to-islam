// src/screens/MainScreens.tsx
import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Screen, LocationState } from '../types'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, ChevronRight, Sun, Moon,
  CheckCircle2, Circle, Play, CheckSquare, X,
  Clock, BookOpen, Compass, MapPin,
  HelpCircle, Users, Download,
} from 'lucide-react'
import { useDailyJourney } from '../hooks/useProgress'
import { usePrayerTimes } from '../hooks/usePrayerTimes'
import { useDarkMode } from '../hooks/useDarkMode'
import { useNotifications } from '../hooks/useNotifications'
import { LESSONS } from '../constants/lessons'
import { Notifications } from './Notifications'
import { useAuth } from '../contexts/AuthContext'
import { FindMentor } from './FindMentor'
import { MentorDashboard } from './MentorDashboard'
import { MentorChat } from './MentorChat'
import { supabase } from '../lib/supabase'
import { useTranslation } from 'react-i18next'

// ── Home ──────────────────────────────────────────────────────
export const Home = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const { t } = useTranslation()
  const { currentDay, progressPercent, userName } = useDailyJourney()
  const { nextPrayer, countdown } = usePrayerTimes()
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
            <h3 className="text-2xl font-bold text-white">{nextPrayer?.name || t('common.loading')}</h3>
            <p className="text-sm mt-1 text-emerald-200">{nextPrayer?.time || '--:--'} • in {countdown || '--h --m'}</p>
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

// ── LearnProgram ──────────────────────────────────────────────
export const LearnProgram = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const { t } = useTranslation()
  const { currentDay, progressPercent, isCompleted } = useDailyJourney()
  const weeks = [1, 2, 3, 4, 5]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col bg-bg-light dark:bg-bg-dark pb-6 overflow-y-auto islamic-pattern relative min-h-full"
    >
      <div className="bg-primary text-white p-6 pt-12 sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setScreen('HOME')} className="p-1 -ml-2 rounded-full hover:bg-white/10 transition tap-bounce">
            <ChevronRight className="rotate-180" size={24} />
          </button>
          <h2 className="text-2xl font-bold font-serif text-accent">{t('learn.program30')}</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-white/20 rounded-full h-3">
            <div className="bg-accent h-3 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="text-sm font-bold text-accent">{progressPercent}%</span>
        </div>
      </div>

      <div className="p-6 space-y-8 relative z-10">
        {weeks.map(week => {
          const weekLessons = LESSONS.filter(l => l.week === week)
          if (weekLessons.length === 0) return null
          if (weekLessons.every(l => l.coming_soon)) {
            return (
              <div key={week} className="opacity-60">
                <h3 className="text-xl font-bold font-serif text-gray-900 dark:text-gray-100 mb-4">{t('learn.week', { num: week })}</h3>
                <div className="p-5 bg-gray-100 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 text-center">
                  <p className="font-bold text-gray-700 dark:text-gray-300">{t('learn.comingSoon')}</p>
                </div>
              </div>
            )
          }
          return (
            <div key={week}>
              <h3 className="text-xl font-bold font-serif text-primary dark:text-accent mb-4">{t('learn.week', { num: week })}</h3>
              <div className="space-y-3">
                {weekLessons.map(lesson => {
                  const completed = isCompleted(lesson.day)
                  const isCurrent = lesson.day === currentDay
                  if (completed) return (
                    <div key={lesson.day} onClick={() => { localStorage.setItem('selected_lesson_day', lesson.day.toString()); setScreen('LEARN_DAY_DETAIL') }} className="flex items-center p-4 bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-gray-800 opacity-80 cursor-pointer hover:opacity-100 transition tap-bounce">
                      <CheckCircle2 size={24} className="text-primary dark:text-accent mr-4 shrink-0" />
                      <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100">{t('learn.day', { num: lesson.day })}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{lesson.title}</p>
                      </div>
                    </div>
                  )
                  if (isCurrent) return (
                    <div key={lesson.day} className="flex items-center p-4 bg-primary/5 dark:bg-accent/10 rounded-xl border-2 border-primary dark:border-accent shadow-md">
                      <Circle size={24} className="text-primary dark:text-accent mr-4 shrink-0" />
                      <div className="flex-1">
                        <p className="font-bold text-primary dark:text-accent text-lg">{t('learn.day', { num: lesson.day })}</p>
                        <p className="text-sm text-primary/80 dark:text-accent/80 font-semibold">{lesson.title}</p>
                      </div>
                      <button onClick={() => { localStorage.setItem('selected_lesson_day', lesson.day.toString()); setScreen('LEARN_DAY_DETAIL') }} className="bg-primary dark:bg-accent text-white font-bold py-2 px-4 rounded-lg text-sm tap-bounce">
                        {t('learn.continue')}
                      </button>
                    </div>
                  )
                  return (
                    <div key={lesson.day} className="flex items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 opacity-60">
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 mr-4 shrink-0" />
                      <div>
                        <p className="font-bold text-gray-500 dark:text-gray-400">{t('learn.day', { num: lesson.day })}</p>
                        <p className="text-sm text-gray-400">{t('learn.locked')}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── DayDetail ─────────────────────────────────────────────────
export const DayDetail = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const { t } = useTranslation()
  const { currentDay, completeDay } = useDailyJourney()
  const lessonDay = parseInt(localStorage.getItem('selected_lesson_day') || String(currentDay), 10)

  // ✅ جديد: جلب من Supabase أولاً
  const [dbLecture, setDbLecture] = React.useState<any>(null)
  const [dbLoading, setDbLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchLecture = async () => {
      setDbLoading(true)
      try {
        const { data } = await supabase
          .from('lectures')
          .select('*')
          .eq('day_number', lessonDay)
          .eq('is_published', true)
          .maybeSingle()
        setDbLecture(data)
      } catch {
        setDbLecture(null)
      } finally {
        setDbLoading(false)
      }
    }
    fetchLecture()
  }, [lessonDay])

  // Fallback: hard-coded lesson لو مفيش محاضرة في DB
  const hardcodedLesson = LESSONS.find(l => l.day === lessonDay) || LESSONS[0]

  // البيانات النهائية: DB تكسب على hard-coded
  const title = dbLecture?.title || hardcodedLesson.title
  const content = dbLecture?.content || hardcodedLesson.content
  const keyPoints = hardcodedLesson.keyPoints // hard-coded دايماً
  const task = hardcodedLesson.task
  const taskLink = hardcodedLesson.taskLink
  const videoUrl = dbLecture?.video_url || null
  const pdfUrl = dbLecture?.pdf_url || null
  const imageUrl = hardcodedLesson.imageUrl || 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?q=80&w=1000&auto=format&fit=crop'

  const [taskCompleted, setTaskCompleted] = React.useState(
    () => localStorage.getItem(`task_${lessonDay}_completed`) === 'true'
  )
  const [showSuccess, setSuccess] = React.useState(false)

  // Helper: هل الفيديو من YouTube?
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
    return match ? match[1] : null
  }

  const handleTaskToggle = () => {
    const nv = !taskCompleted
    setTaskCompleted(nv)
    localStorage.setItem(`task_${lessonDay}_completed`, nv.toString())
  }

  if (dbLoading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col bg-bg-light dark:bg-bg-dark pb-6 overflow-y-auto relative islamic-pattern min-h-full"
    >
      {/* ── Video / Thumbnail ── */}
      <div className="relative w-full aspect-video bg-gray-900 flex items-center justify-center shrink-0">
        {videoUrl ? (
          getYouTubeId(videoUrl) ? (
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${getYouTubeId(videoUrl)}?autoplay=0`}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <video
              src={videoUrl}
              controls
              className="absolute inset-0 w-full h-full object-contain"
              controlsList="nodownload"
            />
          )
        ) : (
          <>
            <img
              src={imageUrl}
              alt="Mosque"
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <button className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center z-10 tap-bounce">
              <Play size={32} className="text-white ml-1" />
            </button>
          </>
        )}
        <div className="absolute top-4 left-4 z-10">
          <button onClick={() => setScreen('LEARN_PROGRAM')} className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1 tap-bounce">
            <ChevronRight size={18} className="rotate-180" /> {t('common.back')}
          </button>
        </div>
      </div>

      <div className="p-6 relative z-10">
        <span className="text-primary dark:text-accent font-bold text-sm bg-primary/10 dark:bg-accent/10 px-3 py-1 rounded-full">
          Day {lessonDay}
        </span>
        <h2 className="text-3xl font-bold font-serif text-gray-900 dark:text-white mt-4 mb-3 leading-tight">{title}</h2>

        {/* PDF Download Button */}
        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold mb-4 transition tap-bounce"
          >
            <Download size={18} />
            تحميل PDF
          </a>
        )}

        <div className="space-y-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-8">
          {content.split('\n\n').map((p: string, i: number) => <p key={i}>{p}</p>)}
        </div>

        <div className="bg-primary/5 dark:bg-accent/5 rounded-2xl p-6 mb-8 border border-primary/20 dark:border-accent/20">
          <h3 className="font-bold text-primary dark:text-accent font-serif text-xl mb-4 flex items-center gap-2">
            <BookOpen size={24} /> Key Points
          </h3>
          <ul className="space-y-3 text-gray-800 dark:text-gray-200">
            {keyPoints.map((point: string, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 text-primary dark:text-accent">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-10">
          <h3 className="text-xl font-bold font-serif text-primary dark:text-accent mb-4">Today's Task</h3>
          <label className="flex items-start gap-4 p-5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-sm rounded-2xl cursor-pointer hover:border-primary/40 transition tap-bounce">
            <input
              type="checkbox"
              checked={taskCompleted}
              onChange={handleTaskToggle}
              className="w-6 h-6 text-primary rounded-md mt-1 cursor-pointer"
            />
            <div className="flex-1">
              <p className={`font-bold transition ${taskCompleted ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                {task}
              </p>
              {taskLink && !taskCompleted && (
                <button
                  onClick={(e) => { e.preventDefault(); setScreen(taskLink!) }}
                  className="mt-3 text-primary dark:text-accent text-sm font-bold flex items-center gap-1 hover:underline tap-bounce"
                >
                  Open Tool <ChevronRight size={14} />
                </button>
              )}
            </div>
          </label>
        </div>

        <button
          onClick={() => { completeDay(lessonDay); setSuccess(true); setTimeout(() => setScreen('LEARN_PROGRAM'), 1500) }}
          disabled={!taskCompleted}
          className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition tap-bounce ${taskCompleted ? 'bg-primary hover:bg-green-800 text-white shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
          <CheckSquare size={20} /> Mark Day as Complete
        </button>
      </div>

      {showSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-bg-light/80 dark:bg-bg-dark/80 backdrop-blur-sm p-6"
        >
          <div className="bg-white dark:bg-black p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-sm w-full border border-primary/20">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={48} className="text-primary dark:text-accent" />
            </div>
            <h3 className="text-2xl font-bold font-serif text-primary dark:text-accent mb-2">{t('homeScreen.alhamdulillah')}</h3>
            <p className="text-gray-600 dark:text-gray-300">You've completed Day {lessonDay}. Keep up the great work!</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// ── Router ────────────────────────────────────────────────────
// ✅ FIX: استبدلنا Navigate declarative + useEffect([initial]) بـ useNavigate imperative
// المشكلة الأصلية: الـ useEffect كان بيعيد setScreen('LEARN_PROGRAM') بعد الضغط على Qibla
// لأن الـ location.state كانت بتتغير وبتعيد trigger الـ effect بشكل غلط
export default function MainScreens() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const initial = (state as LocationState)?.initialScreen
  const [screen, setScreen] = React.useState<Screen>(initial ?? 'HOME')
  const [chatParams, setChatParams] = React.useState<{ requestId: string; otherPersonName: string } | null>(null)

  // Extract chat params from location state or localStorage for notification navigation
  const chatStateParams = (state as LocationState)?.chatParams as { requestId: string; otherPersonName: string } | undefined

  React.useEffect(() => {
    // First check localStorage (from notification click)
    const pendingChat = localStorage.getItem('pending_chat');
    if (pendingChat) {
      try {
        const params = JSON.parse(pendingChat);
        setChatParams(params);
        localStorage.removeItem('pending_chat');
      } catch (e) {
        console.error('Failed to parse pending_chat', e);
      }
    } else if (chatStateParams) {
      // Fallback to state params
      setChatParams(chatStateParams);
    }
  }, [chatStateParams])

  const lastInitialRef = React.useRef<Screen | undefined>(initial)
  React.useEffect(() => {
    if (initial && initial !== lastInitialRef.current) {
      lastInitialRef.current = initial
      setScreen(initial)
    }
  }, [initial])

  const handleSetScreen = React.useCallback((s: Screen) => {
    switch (s) {
      case 'ASK_CATEGORIES':
      case 'MENTOR':
        navigate('/ask', { replace: true })
        break
      case 'QIBLA':
        navigate('/tools', { state: { initialScreen: 'QIBLA' }, replace: true })
        break
      case 'PRAYER_TIMES':
        navigate('/tools', { state: { initialScreen: 'PRAYER_TIMES' }, replace: true })
        break
      case 'MOSQUES':
        navigate('/tools', { state: { initialScreen: 'MOSQUES' }, replace: true })
        break
      case 'SETTINGS':
        navigate('/settings', { replace: true })
        break
      case 'MENTOR_CHAT':
        if (chatParams) {
          navigate('/', { state: { initialScreen: 'MENTOR_CHAT', chatParams }, replace: true })
        }
        break
      default:
        setScreen(s)
    }
  }, [navigate])

  return (
    <>
      {screen === 'HOME' && <Home setScreen={handleSetScreen} />}
      {screen === 'LEARN_PROGRAM' && <LearnProgram setScreen={handleSetScreen} />}
      {screen === 'LEARN_DAY_DETAIL' && <DayDetail setScreen={handleSetScreen} />}
      {screen === 'NOTIFICATIONS' && <Notifications setScreen={handleSetScreen} />}
      {screen === 'FIND_MENTOR' && <FindMentor goBack={() => handleSetScreen('HOME')} />}
      {screen === 'MENTOR_DASHBOARD' && <MentorDashboard goBack={() => handleSetScreen('HOME')} />}
      {screen === 'MENTOR_CHAT' && chatParams && (
        <MentorChat
          requestId={chatParams.requestId}
          otherPersonName={chatParams.otherPersonName}
          goBack={() => { setChatParams(null); handleSetScreen('HOME') }}
        />
      )}
    </>
  )
}
