import { Screen } from '../types'
import { motion } from 'framer-motion'
import { ChevronRight, CheckCircle2, Circle } from 'lucide-react'
import { useDailyJourney } from '../hooks/useProgress'
import { LESSONS } from '../constants/lessons'
import { useTranslation } from 'react-i18next'

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
