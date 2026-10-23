// src/screens/admin/AdminDashboard.tsx
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

// ─── جلب الإحصائيات من Supabase ──────────────────────────────
async function getStats() {
  const [subjects, lectures, users, questions] = await Promise.all([
    supabase.from('subjects').select('id', { count: 'exact', head: true }),
    supabase.from('lectures').select('id, is_published', { count: 'exact' }),
    supabase.from('profiles').select('id, role', { count: 'exact' }),
    supabase.from('questions').select('id, is_answered', { count: 'exact' }),
  ])

  const publishedCount  = lectures.data?.filter(l => l.is_published).length  ?? 0
  const draftCount      = lectures.data?.filter(l => !l.is_published).length ?? 0
  const adminCount      = users.data?.filter(u => u.role === 'admin').length  ?? 0
  const studentCount    = users.data?.filter(u => u.role === 'student').length ?? 0
  const answeredCount   = questions.data?.filter(q => q.is_answered).length   ?? 0
  const unansweredCount = questions.data?.filter(q => !q.is_answered).length  ?? 0

  return {
    subjects:    subjects.count  ?? 0,
    lectures:    lectures.count  ?? 0,
    published:   publishedCount,
    drafts:      draftCount,
    users:       users.count     ?? 0,
    admins:      adminCount,
    students:    studentCount,
    questions:   questions.count ?? 0,
    answered:    answeredCount,
    unanswered:  unansweredCount,
  } as Stats
}

interface Stats {
  subjects: number
  lectures: number
  published: number
  drafts: number
  users: number
  admins: number
  students: number
  questions: number
  answered: number
  unanswered: number
}

// ─── Stat Card ────────────────────────────────────────────────
interface StatCardProps {
  label:    string
  value:    number
  icon:     string
  color:    string
  sub?:     string
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, sub }) => {
  return (
    <div className="bg-white dark:bg-[#1a2e1a] rounded-2xl p-5 border border-black/5 dark:border-white/5">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ backgroundColor: color + '18' }}
        >
          {icon}
        </div>
        <span className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
          {value.toLocaleString('ar-EG')}
        </span>
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-right">{label}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 text-right">{sub}</p>}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#1a2e1a] rounded-2xl p-5 border border-black/5 dark:border-white/5 animate-skeleton">
      <div className="flex justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700" />
        <div className="w-12 h-7 rounded-lg bg-gray-100 dark:bg-gray-700" />
      </div>
      <div className="h-4 w-24 rounded bg-gray-100 dark:bg-gray-700 mr-auto" />
    </div>
  )
}

// ─── AdminDashboard ───────────────────────────────────────────
export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn:  getStats,
    staleTime: 1000 * 60,
  })

  const cards: StatCardProps[] = stats ? [
    {
      label: 'المواد الدراسية',
      value: stats.subjects,
      icon:  '📂',
      color: '#1B5E20',
      sub:   'مواد فعّالة',
    },
    {
      label: 'المحاضرات',
      value: stats.lectures,
      icon:  '📖',
      color: '#0D47A1',
      sub:   `${stats.published} منشورة · ${stats.drafts} مسودة`,
    },
    {
      label: 'المستخدمون',
      value: stats.users,
      icon:  '👥',
      color: '#4A148C',
      sub:   `${stats.students} طالب · ${stats.admins} مشرف`,
    },
    {
      label: 'الأسئلة',
      value: stats.questions,
      icon:  '❓',
      color: '#E65100',
      sub:   `${stats.unanswered} بانتظار الإجابة`,
    },
  ] : []

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          الإحصائيات العامة
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">نظرة عامة على محتوى التطبيق</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {isLoading
          ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
          : cards.map(c => (
              <StatCard
                key={c.label}
                label={c.label}
                value={c.value}
                icon={c.icon}
                color={c.color}
                sub={c.sub}
              />
            ))
        }
      </div>

      {/* نسبة النشر */}
      {stats && (
        <div className="bg-white dark:bg-[#1a2e1a] rounded-2xl p-5 border border-black/5 dark:border-white/5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            نسبة نشر المحاضرات
          </h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>منشورة</span>
                <span>{stats.lectures > 0 ? Math.round((stats.published / stats.lectures) * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1B5E20] rounded-full transition-all duration-700"
                  style={{ width: stats.lectures > 0 ? `${(stats.published / stats.lectures) * 100}%` : '0%' }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>أسئلة مُجابة</span>
                <span>{stats.questions > 0 ? Math.round((stats.answered / stats.questions) * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0D47A1] rounded-full transition-all duration-700"
                  style={{ width: stats.questions > 0 ? `${(stats.answered / stats.questions) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
