// src/screens/admin/AdminUsers.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Table, Badge, PageHeader, Confirm } from './ui'
import type { Profile } from '../../lib/database.types'
import React, { useState } from 'react'

async function getUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Profile[]
}

async function setUserRole(id: string, role: 'student' | 'admin' | 'mentor') {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export default function AdminUsers() {
  const qc = useQueryClient()
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn:  getUsers,
  })

  const [confirm, setConfirm] = useState<{ id: string; role: 'admin' | 'student' | 'mentor' } | null>(null)

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'admin' | 'student' | 'mentor' }) =>
      setUserRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      setConfirm(null)
    },
  })

  const columns = [
    {
      key: 'full_name', label: 'المستخدم',
      render: (u: Profile) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#1B5E20]/10 flex items-center justify-center text-sm font-bold text-[#1B5E20] flex-shrink-0">
            {u.full_name?.[0] ?? '؟'}
          </div>
          <p className="font-medium text-sm text-gray-900 dark:text-white">
            {u.full_name ?? 'بدون اسم'}
          </p>
        </div>
      ),
    },
    {
      key: 'role', label: 'الصلاحية', width: '100px',
      render: (u: Profile) => (
        <Badge color={u.role === 'admin' ? 'amber' : u.role === 'mentor' ? 'green' : 'blue'}>
          {u.role === 'admin' ? '👑 مشرف' : u.role === 'mentor' ? '🌟 منتور' : '🎓 طالب'}
        </Badge>
      ),
    },
    {
      key: 'created_at', label: 'تاريخ التسجيل', width: '130px',
      render: (u: Profile) => (
        <span className="text-xs text-gray-400">
          {new Date(u.created_at).toLocaleDateString('ar-EG')}
        </span>
      ),
    },
    {
      key: 'actions', label: '', width: '200px',
      render: (u: Profile) => (
        <div className="flex gap-2">
          {u.role !== 'admin' && (
            <button
              onClick={() => setConfirm({ id: u.id, role: 'admin' })}
              className="px-2 py-1.5 text-xs rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100"
            >
              ترقية لمشرف
            </button>
          )}
          {u.role !== 'mentor' && (
            <button
              onClick={() => setConfirm({ id: u.id, role: 'mentor' })}
              className="px-2 py-1.5 text-xs rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
            >
              ترقية لمنتور
            </button>
          )}
          {u.role !== 'student' && (
            <button
              onClick={() => setConfirm({ id: u.id, role: 'student' })}
              className="px-2 py-1.5 text-xs rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
            >
              إلغاء الترقية
            </button>
          )}
        </div>
      ),
    },
  ]

  const admins   = users.filter(u => u.role === 'admin').length
  const students = users.filter(u => u.role === 'student').length

  return (
    <>
      <PageHeader
        title="المستخدمون"
        subtitle={`${users.length} مستخدم — ${admins} مشرف · ${students} طالب`}
      />

      <Table
        columns={columns}
        data={users}
        keyField="id"
        isLoading={isLoading}
        emptyText="لا يوجد مستخدمون"
      />

      <Confirm
        open={!!confirm}
        message={
          confirm?.role === 'admin'
            ? 'هل تريد ترقية هذا المستخدم لمشرف؟ سيتمكن من إدارة كل المحتوى.'
            : 'هل تريد إلغاء صلاحيات الإشراف؟'
        }
        onConfirm={() => confirm && roleMutation.mutate(confirm)}
        onCancel={() => setConfirm(null)}
        loading={roleMutation.isPending}
      />
    </>
  )
}


// ══════════════════════════════════════════════════════════════
// src/screens/admin/AdminQuestions.tsx
// ══════════════════════════════════════════════════════════════
import { useAuth } from '../../contexts/AuthContext'
import { Modal, Field, Textarea, ActionBtn } from './ui'
import type { Question } from '../../lib/database.types'

async function getQuestions(): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Question[]
}

export function AdminQuestions() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [answering, setAnswering] = useState<Question | null>(null)
  const [answerText, setAnswerText] = useState('')

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['admin-questions'],
    queryFn:  getQuestions,
  })

  const answerMutation = useMutation({
    mutationFn: async ({ id, answer }: { id: string; answer: string }) => {
      const { error } = await supabase
        .from('questions')
        .update({
          answer,
          is_answered:  true,
          answered_by:  user?.id,
          answered_at:  new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-questions'] })
      setAnswering(null)
      setAnswerText('')
    },
  })

  const columns = [
    {
      key: 'question', label: 'السؤال',
      render: (q: Question) => (
        <div>
          <p className="text-sm text-gray-900 dark:text-white leading-relaxed">{q.question}</p>
          {q.answer && (
            <p className="text-xs text-[#1B5E20] dark:text-green-400 mt-1 leading-relaxed">
              ↳ {q.answer}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'is_answered', label: 'الحالة', width: '100px',
      render: (q: Question) => (
        <Badge color={q.is_answered ? 'green' : 'amber'}>
          {q.is_answered ? 'مُجاب' : 'بانتظار'}
        </Badge>
      ),
    },
    {
      key: 'created_at', label: 'التاريخ', width: '110px',
      render: (q: Question) => (
        <span className="text-xs text-gray-400">
          {new Date(q.created_at).toLocaleDateString('ar-EG')}
        </span>
      ),
    },
    {
      key: 'actions', label: '', width: '100px',
      render: (q: Question) => (
        !q.is_answered ? (
          <button
            onClick={() => { setAnswering(q); setAnswerText('') }}
            className="px-3 py-1.5 text-xs rounded-lg bg-[#1B5E20]/10 hover:bg-[#1B5E20]/20 text-[#1B5E20] dark:text-green-400 transition-all"
          >
            أجب الآن
          </button>
        ) : (
          <button
            onClick={() => { setAnswering(q); setAnswerText(q.answer ?? '') }}
            className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-white/8 text-gray-500 hover:bg-gray-200 transition-all"
          >
            تعديل
          </button>
        )
      ),
    },
  ]

  const pending = questions.filter(q => !q.is_answered).length

  return (
    <>
      <PageHeader
        title="الأسئلة"
        subtitle={`${questions.length} سؤال${pending > 0 ? ` — ${pending} بانتظار الإجابة` : ''}`}
      />

      <Table
        columns={columns}
        data={questions}
        keyField="id"
        isLoading={isLoading}
        emptyText="لا توجد أسئلة"
      />

      <Modal
        open={!!answering}
        onClose={() => setAnswering(null)}
        title="الإجابة على السؤال"
      >
        {answering && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 text-sm text-gray-700 dark:text-gray-300 text-right leading-relaxed">
              {answering.question}
            </div>
            <Field label="الإجابة" required>
              <Textarea
                value={answerText}
                onChange={e => setAnswerText(e.target.value)}
                rows={5}
                placeholder="اكتب إجابتك هنا..."
              />
            </Field>
            <div className="flex gap-2 justify-end">
              <ActionBtn variant="ghost" onClick={() => setAnswering(null)}>إلغاء</ActionBtn>
              <ActionBtn
                onClick={() => answerMutation.mutate({ id: answering.id, answer: answerText })}
                loading={answerMutation.isPending}
                disabled={!answerText.trim()}
              >
                نشر الإجابة
              </ActionBtn>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

