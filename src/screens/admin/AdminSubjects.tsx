// src/screens/admin/AdminSubjects.tsx
import { useState } from 'react'
import { useSubjectsAdmin } from '../../hooks/queries'
import { Modal, Confirm, Field, Input, Textarea, Table, Badge, PageHeader, ActionBtn } from './ui'
import type { Subject } from '../../lib/database.types'
import type { CreateSubjectDTO } from '../../services/subjects.service'

const COLORS = ['#1B5E20','#0D47A1','#4A148C','#BF360C','#006064','#E65100','#880E4F','#37474F']
const ICONS  = ['📖','📜','🌙','⭐','🕌','🤲','📿','🕋','🌿','✨']

// ─── Form ─────────────────────────────────────────────────────
interface FormState {
  title:        string
  description:  string
  icon:         string
  color:        string
  order_index:  string
}

const EMPTY: FormState = { title: '', description: '', icon: '📖', color: '#1B5E20', order_index: '0' }

function fromSubject(s: Subject): FormState {
  return {
    title:       s.title,
    description: s.description ?? '',
    icon:        s.icon ?? '📖',
    color:       s.color,
    order_index: String(s.order_index),
  }
}

interface SubjectFormProps {
  initial:   FormState
  onSave:    (data: CreateSubjectDTO) => Promise<void>
  onCancel:  () => void
  isSaving:  boolean
}

function SubjectForm({ initial, onSave, onCancel, isSaving }: SubjectFormProps) {
  const [form, setForm] = useState<FormState>(initial)
  const [error, setError] = useState('')

  function set(key: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    if (!form.title.trim()) { setError('العنوان مطلوب'); return }
    setError('')
    await onSave({
      title:       form.title.trim(),
      description: form.description.trim() || undefined,
      icon:        form.icon,
      color:       form.color,
      order_index: Number(form.order_index) || 0,
    })
  }

  return (
    <div className="space-y-4">
      <Field label="العنوان" required error={error}>
        <Input
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="مثال: الفقه الإسلامي"
        />
      </Field>

      <Field label="الوصف">
        <Textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="وصف مختصر للمادة..."
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="الترتيب">
          <Input
            type="number"
            value={form.order_index}
            onChange={e => set('order_index', e.target.value)}
            min="0"
          />
        </Field>

        {/* معاينة */}
        <Field label="معاينة">
          <div
            className="h-10 rounded-xl flex items-center gap-2 px-3 text-sm font-medium"
            style={{ backgroundColor: form.color + '20', color: form.color }}
          >
            <span>{form.icon}</span>
            <span className="truncate">{form.title || 'المادة'}</span>
          </div>
        </Field>
      </div>

      {/* اختيار الأيقونة */}
      <Field label="الأيقونة">
        <div className="flex flex-wrap gap-2">
          {ICONS.map(ic => (
            <button
              key={ic}
              onClick={() => set('icon', ic)}
              className={`
                w-9 h-9 rounded-xl text-lg transition-all
                ${form.icon === ic
                  ? 'ring-2 ring-[#1B5E20] bg-[#1B5E20]/10 scale-110'
                  : 'bg-gray-100 dark:bg-white/5 hover:scale-105'
                }
              `}
            >
              {ic}
            </button>
          ))}
        </div>
      </Field>

      {/* اختيار اللون */}
      <Field label="اللون">
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => set('color', c)}
              className={`
                w-7 h-7 rounded-full transition-all
                ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}
              `}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </Field>

      {/* Buttons */}
      <div className="flex gap-2 justify-end pt-2">
        <ActionBtn variant="ghost" onClick={onCancel}>إلغاء</ActionBtn>
        <ActionBtn onClick={handleSubmit} loading={isSaving}>حفظ</ActionBtn>
      </div>
    </div>
  )
}

// ─── AdminSubjects ────────────────────────────────────────────
export default function AdminSubjects() {
  const { subjects, isLoading, create, update, remove, isMutating } = useSubjectsAdmin()

  const [modal,   setModal]   = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Subject | null>(null)
  const [delId,   setDelId]   = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleSave(dto: CreateSubjectDTO) {
    if (editing) {
      await update(editing.id, dto)
    } else {
      await create(dto)
    }
    setModal(null)
    setEditing(null)
  }

  async function handleDelete() {
    if (!delId) return
    setDeleting(true)
    try { await remove(delId) } finally {
      setDeleting(false)
      setDelId(null)
    }
  }

  const columns = [
    {
      key: 'title', label: 'المادة',
      render: (s: Subject) => (
        <div className="flex items-center gap-2">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
            style={{ backgroundColor: s.color + '20' }}
          >
            {s.icon}
          </span>
          <div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">{s.title}</p>
            {s.description && (
              <p className="text-xs text-gray-400 truncate max-w-[200px]">{s.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'order_index', label: 'الترتيب', width: '80px',
      render: (s: Subject) => (
        <span className="text-gray-500 dark:text-gray-400">{s.order_index}</span>
      ),
    },
    {
      key: 'is_active', label: 'الحالة', width: '90px',
      render: (s: Subject) => (
        <Badge color={s.is_active ? 'green' : 'gray'}>
          {s.is_active ? 'فعّال' : 'مخفي'}
        </Badge>
      ),
    },
    {
      key: 'actions', label: '', width: '100px',
      render: (s: Subject) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setEditing(s); setModal('edit') }}
            className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-white/8 hover:bg-gray-200 dark:hover:bg-white/12 text-gray-600 dark:text-gray-300 transition-all"
          >
            تعديل
          </button>
          <button
            onClick={() => setDelId(s.id)}
            className="px-3 py-1.5 text-xs rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-500 transition-all"
          >
            حذف
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="المواد الدراسية"
        subtitle={`${subjects.length} مادة`}
        action={
          <ActionBtn onClick={() => { setEditing(null); setModal('add') }}>
            + إضافة مادة
          </ActionBtn>
        }
      />

      <Table
        columns={columns}
        data={subjects}
        keyField="id"
        isLoading={isLoading}
        emptyText="لا توجد مواد بعد"
      />

      {/* Modal إضافة / تعديل */}
      <Modal
        open={modal !== null}
        onClose={() => { setModal(null); setEditing(null) }}
        title={editing ? 'تعديل المادة' : 'إضافة مادة جديدة'}
      >
        <SubjectForm
          initial={editing ? fromSubject(editing) : EMPTY}
          onSave={handleSave}
          onCancel={() => { setModal(null); setEditing(null) }}
          isSaving={isMutating}
        />
      </Modal>

      {/* Confirm حذف */}
      <Confirm
        open={!!delId}
        message="هل أنت متأكد من حذف هذه المادة؟ سيتم حذف كل محاضراتها أيضاً."
        onConfirm={handleDelete}
        onCancel={() => setDelId(null)}
        loading={deleting}
      />
    </>
  )
}
