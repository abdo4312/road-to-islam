import React from 'react'
import { Screen } from '../types'
import { motion } from 'framer-motion'
import {
  ChevronRight, Play, CheckSquare, BookOpen,
  Download, CheckCircle2,
} from 'lucide-react'
import { useDailyJourney } from '../hooks/useProgress'
import { LESSONS } from '../constants/lessons'
import { supabase } from '../lib/supabase'
import { useTranslation } from 'react-i18next'

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
