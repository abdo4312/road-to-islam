// src/components/LectureCard.tsx
// مثال حقيقي على استخدام الـ hooks في الـ UI

import { useBookmarks } from '../hooks/queries'
import { useLectureProgress } from '../hooks/queries'
import type { LectureWithSubject } from '../lib/database.types'

interface LectureCardProps {
  lecture:  LectureWithSubject
  onClick?: () => void
}

export function LectureCard({ lecture, onClick }: LectureCardProps) {
  const { isBookmarked, toggle, isToggling } = useBookmarks()
  const { isComplete, lastPosition }         = useLectureProgress()

  const bookmarked = isBookmarked(lecture.id)
  const complete   = isComplete(lecture.id)
  const position   = lastPosition(lecture.id)

  return (
    <div
      onClick={onClick}
      className="
        bg-white dark:bg-dark-card rounded-2xl border
        border-gray-100 dark:border-gray-800
        p-4 flex items-start gap-3 cursor-pointer
        tap-bounce transition-all duration-150
        hover:border-primary/30 hover:shadow-sm
      "
    >
      {/* أيقونة المادة */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: lecture.subjects?.color + '22' }}
      >
        {lecture.subjects?.icon ?? '📖'}
      </div>

      {/* المحتوى */}
      <div className="flex-1 min-w-0 text-right">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug truncate">
          {lecture.title}
        </h3>

        <div className="flex items-center justify-end gap-2 mt-1">
          {/* اسم المادة */}
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: (lecture.subjects?.color ?? '#1B5E20') + '18',
              color: lecture.subjects?.color ?? '#1B5E20',
            }}
          >
            {lecture.subjects?.title}
          </span>

          {/* المدة */}
          {lecture.duration_min && (
            <span className="text-xs text-gray-400">
              {lecture.duration_min} د
            </span>
          )}
        </div>

        {/* شريط التقدم لو بدأ المستخدم الاستماع */}
        {position > 0 && !complete && lecture.duration_min && (
          <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{
                width: `${Math.min(100, (position / (lecture.duration_min * 60)) * 100)}%`
              }}
            />
          </div>
        )}
      </div>

      {/* الأزرار */}
      <div className="flex flex-col items-center gap-2">
        {/* زر المفضلة */}
        <button
          onClick={e => { e.stopPropagation(); toggle(lecture.id) }}
          disabled={isToggling}
          className="tap-bounce transition-transform"
          aria-label={bookmarked ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
        >
          <span className={`text-lg ${bookmarked ? 'text-accent' : 'text-gray-300 dark:text-gray-600'}`}>
            {bookmarked ? '★' : '☆'}
          </span>
        </button>

        {/* علامة الاكتمال */}
        {complete && (
          <span className="text-secondary text-sm" title="مكتملة">✓</span>
        )}
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// SubjectCard مع نسبة التقدم
// ─────────────────────────────────────────────────────────────
import { useSubjectProgress } from '../hooks/queries'
import type { Subject } from '../lib/database.types'

interface SubjectCardProps {
  subject:  Subject
  onClick?: () => void
}

export function SubjectCard({ subject, onClick }: SubjectCardProps) {
  const { percent, completed, total, isLoading } = useSubjectProgress(subject.id)

  return (
    <div
      onClick={onClick}
      className="
        bg-white dark:bg-dark-card rounded-2xl p-4
        border border-gray-100 dark:border-gray-800
        cursor-pointer tap-bounce transition-all
        hover:border-primary/30 hover:shadow-sm text-right
      "
    >
      {/* أيقونة + عنوان */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: subject.color + '22' }}
        >
          {subject.icon ?? '📚'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            {subject.title}
          </h3>
          {subject.description && (
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
              {subject.description}
            </p>
          )}
        </div>
      </div>

      {/* شريط التقدم */}
      {!isLoading && total > 0 && (
        <>
          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width:      `${percent}%`,
                backgroundColor: subject.color,
              }}
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-left">
            {completed} / {total} محاضرة
            <span className="mr-1 font-medium" style={{ color: subject.color }}>
              {percent}%
            </span>
          </p>
        </>
      )}
    </div>
  )
}
