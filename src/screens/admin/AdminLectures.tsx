// src/screens/admin/AdminLectures.tsx
import { useState } from 'react'
import { useSubjects, useLectureMutations } from '../../hooks/queries'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getLectures, type CreateLectureDTO, type UpdateLectureDTO } from '../../services/lectures.service'
import { Modal, Confirm, Field, Input, Textarea, Select, Table, Badge, PageHeader, ActionBtn } from './ui'
import type { LectureWithSubject } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'
import { Upload, X, Film, FileText, Loader2 } from 'lucide-react'

// ─── Form ─────────────────────────────────────────────────────
interface LectureFormState {
  subject_id:   string
  title:        string
  description:  string
  content:      string
  video_url:    string
  audio_url:    string
  pdf_url:      string
  duration_min: string
  order_index:  string
  day_number:   string
  is_published: boolean
}

const EMPTY_FORM: LectureFormState = {
  subject_id: '', title: '', description: '', content: '',
  video_url: '', audio_url: '', pdf_url: '', duration_min: '',
  order_index: '0', day_number: '', is_published: false,
}

function fromLecture(l: LectureWithSubject): LectureFormState {
  return {
    subject_id:   l.subject_id,
    title:        l.title,
    description:  l.description  ?? '',
    content:      l.content      ?? '',
    video_url:    (l as any).video_url ?? '',
    audio_url:    l.audio_url    ?? '',
    pdf_url:      l.pdf_url      ?? '',
    duration_min: l.duration_min ? String(l.duration_min) : '',
    order_index:  String(l.order_index),
    day_number:   (l as any).day_number ? String((l as any).day_number) : '',
    is_published: l.is_published,
  }
}

interface LectureFormProps {
  initial:  LectureFormState
  subjects: { id: string; title: string }[]
  onSave:   (dto: CreateLectureDTO) => Promise<void>
  onCancel: () => void
  isSaving: boolean
}

function LectureForm({ initial, subjects, onSave, onCancel, isSaving }: LectureFormProps) {
  const [form, setForm] = useState<LectureFormState>(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof LectureFormState, string>>>({})
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)

  function set(key: keyof LectureFormState, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  async function handleFileUpload(
    file: File,
    bucket: 'lecture-videos' | 'lecture-pdfs',
    field: 'video_url' | 'pdf_url',
    setSaving: (v: boolean) => void
  ) {
    setSaving(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

      set(field, publicUrl)
    } catch (err: any) {
      alert('فشل الرفع: ' + (err.message || 'خطأ غير معروف'))
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit() {
    const e: typeof errors = {}
    if (!form.subject_id)   e.subject_id = 'اختر المادة'
    if (!form.title.trim()) e.title      = 'العنوان مطلوب'
    if (Object.keys(e).length) { setErrors(e); return }

    await onSave({
      subject_id:   form.subject_id,
      title:        form.title.trim(),
      description:  form.description.trim()  || undefined,
      content:      form.content.trim()      || undefined,
      video_url:    form.video_url.trim()    || undefined,
      audio_url:    form.audio_url.trim()    || undefined,
      pdf_url:      form.pdf_url.trim()      || undefined,
      duration_min: form.duration_min ? Number(form.duration_min) : undefined,
      order_index:  Number(form.order_index) || 0,
      day_number:   form.day_number ? Number(form.day_number) : undefined,
      is_published: form.is_published,
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="المادة" required error={errors.subject_id}>
          <Select
            value={form.subject_id}
            onChange={e => set('subject_id', e.target.value)}
          >
            <option value="">اختر المادة</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </Select>
        </Field>

        <Field label="المدة (دقائق)">
          <Input
            type="number"
            value={form.duration_min}
            onChange={e => set('duration_min', e.target.value)}
            placeholder="60"
            min="1"
          />
        </Field>
      </div>

      <Field label="عنوان المحاضرة" required error={errors.title}>
        <Input
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="مثال: مقدمة في أصول الفقه"
        />
      </Field>

      <Field label="الوصف المختصر">
        <Textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="وصف مختصر يظهر في القائمة..."
          rows={2}
        />
      </Field>

      {/* Day Number */}
      <Field label="رقم اليوم (1-30)">
        <Input
          type="number"
          value={form.day_number}
          onChange={e => set('day_number', e.target.value)}
          placeholder="مثال: 3"
          min="1"
          max="30"
        />
      </Field>

      {/* Video Upload */}
      <Field label="فيديو المحاضرة">
        <div className="space-y-2">
          {form.video_url ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <Film size={18} className="text-green-600 dark:text-green-400 shrink-0" />
              <span className="text-sm text-green-700 dark:text-green-300 flex-1 truncate">
                تم رفع الفيديو ✓
              </span>
              <button
                type="button"
                onClick={() => set('video_url', '')}
                className="p-1 text-red-400 hover:text-red-600 transition"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className={`
              flex flex-col items-center justify-center gap-2 p-6
              border-2 border-dashed rounded-xl cursor-pointer transition
              ${uploadingVideo
                ? 'border-primary/40 bg-primary/5'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-primary/5'
              }
            `}>
              <input
                type="file"
                accept="video/mp4,video/mov,video/avi,video/webm,video/quicktime"
                className="hidden"
                disabled={uploadingVideo}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file, 'lecture-videos', 'video_url', setUploadingVideo)
                }}
              />
              {uploadingVideo ? (
                <>
                  <Loader2 size={28} className="text-primary animate-spin" />
                  <span className="text-sm text-primary font-medium">جاري الرفع...</span>
                  <span className="text-xs text-gray-400">قد يأخذ بعض الوقت حسب حجم الفيديو</span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Film size={24} className="text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    اضغط لرفع الفيديو
                  </span>
                  <span className="text-xs text-gray-400">MP4, MOV, AVI — حد أقصى 500MB</span>
                </>
              )}
            </label>
          )}

          {/* أو رابط URL يدوي */}
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400">أو</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          </div>
          <Input
            placeholder="رابط YouTube / Vimeo / رابط مباشر"
            value={form.video_url.startsWith('http') && !form.video_url.includes('supabase') ? form.video_url : ''}
            onChange={e => set('video_url', e.target.value)}
            disabled={uploadingVideo}
          />
        </div>
      </Field>

      {/* PDF Upload */}
      <Field label="ملف PDF">
        <div className="space-y-2">
          {form.pdf_url ? (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <FileText size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="text-sm text-blue-700 dark:text-blue-300 flex-1 truncate">
                تم رفع الـ PDF ✓
              </span>
              <button
                type="button"
                onClick={() => set('pdf_url', '')}
                className="p-1 text-red-400 hover:text-red-600 transition"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className={`
              flex flex-col items-center justify-center gap-2 p-4
              border-2 border-dashed rounded-xl cursor-pointer transition
              ${uploadingPdf
                ? 'border-blue-400/40 bg-blue-50 dark:bg-blue-900/10'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-400/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
              }
            `}>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                disabled={uploadingPdf}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file, 'lecture-pdfs', 'pdf_url', setUploadingPdf)
                }}
              />
              {uploadingPdf ? (
                <>
                  <Loader2 size={22} className="text-blue-500 animate-spin" />
                  <span className="text-sm text-blue-600 font-medium">جاري الرفع...</span>
                </>
              ) : (
                <>
                  <FileText size={22} className="text-blue-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    اضغط لرفع PDF — حد أقصى 50MB
                  </span>
                </>
              )}
            </label>
          )}
        </div>
      </Field>

      <Field label="محتوى المحاضرة / الملاحظات">
        <Textarea
          value={form.content}
          onChange={e => set('content', e.target.value)}
          placeholder="النص الكامل للمحاضرة أو الملاحظات..."
          rows={5}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="رابط الصوت">
          <Input
            value={form.audio_url}
            onChange={e => set('audio_url', e.target.value)}
            placeholder="https://..."
          />
        </Field>
        <Field label="رابط PDF">
          <Input
            value={form.pdf_url}
            onChange={e => set('pdf_url', e.target.value)}
            placeholder="https://..."
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="الترتيب">
          <Input
            type="number"
            value={form.order_index}
            onChange={e => set('order_index', e.target.value)}
            min="0"
          />
        </Field>

        <Field label="الحالة">
          <button
            onClick={() => set('is_published', !form.is_published)}
            className={`
              flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition-all
              ${form.is_published
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500'
              }
            `}
          >
            <span>{form.is_published ? '✓' : '○'}</span>
            {form.is_published ? 'منشورة' : 'مسودة'}
          </button>
        </Field>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <ActionBtn variant="ghost" onClick={onCancel}>إلغاء</ActionBtn>
        <ActionBtn onClick={handleSubmit} loading={isSaving}>
          {form.is_published ? 'حفظ ونشر' : 'حفظ كمسودة'}
        </ActionBtn>
      </div>
    </div>
  )
}

// ─── AdminLectures ────────────────────────────────────────────
export default function AdminLectures() {
  const qc = useQueryClient()
  const { subjects } = useSubjects()
  const { create, update, remove, isLoading: mutating } = useLectureMutations()

  const [search,    setSearch]    = useState('')
  const [subFilter, setSubFilter] = useState('')
  const [modal,     setModal]     = useState<'add' | 'edit' | null>(null)
  const [editing,   setEditing]   = useState<LectureWithSubject | null>(null)
  const [delId,     setDelId]     = useState<string | null>(null)
  const [deleting,  setDeleting]  = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-lectures', search, subFilter],
    queryFn:  () => getLectures(
      { subjectId: subFilter || undefined, search, published: false },
      { page: 1, pageSize: 100 }
    ),
    staleTime: 0,
  })

  const lectures = data?.data ?? []

  async function handleSave(dto: CreateLectureDTO) {
    if (editing) {
      await update(editing.id, dto as UpdateLectureDTO)
    } else {
      await create(dto)
    }
    qc.invalidateQueries({ queryKey: ['admin-lectures'] })
    setModal(null)
    setEditing(null)
  }

  async function handleDelete() {
    if (!delId) return
    setDeleting(true)
    try {
      await remove(delId)
      qc.invalidateQueries({ queryKey: ['admin-lectures'] })
    } finally {
      setDeleting(false)
      setDelId(null)
    }
  }

  const columns = [
    {
      key: 'title', label: 'المحاضرة',
      render: (l: LectureWithSubject) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white text-sm leading-snug">{l.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{l.subjects?.title}</p>
        </div>
      ),
    },
    {
      key: 'duration_min', label: 'المدة', width: '70px',
      render: (l: LectureWithSubject) => (
        <span className="text-gray-500 text-xs">
          {l.duration_min ? `${l.duration_min} د` : '—'}
        </span>
      ),
    },
    {
      key: 'is_published', label: 'الحالة', width: '90px',
      render: (l: LectureWithSubject) => (
        <Badge color={l.is_published ? 'green' : 'amber'}>
          {l.is_published ? 'منشورة' : 'مسودة'}
        </Badge>
      ),
    },
    {
      key: 'actions', label: '', width: '110px',
      render: (l: LectureWithSubject) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setEditing(l); setModal('edit') }}
            className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-white/8 hover:bg-gray-200 dark:hover:bg-white/12 text-gray-600 dark:text-gray-300 transition-all"
          >
            تعديل
          </button>
          <button
            onClick={() => setDelId(l.id)}
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
        title="المحاضرات"
        subtitle={`${lectures.length} محاضرة`}
        action={
          <ActionBtn onClick={() => { setEditing(null); setModal('add') }}>
            + إضافة محاضرة
          </ActionBtn>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="بحث..."
          dir="rtl"
          className="flex-1 min-w-[160px] px-3 py-2 rounded-xl text-sm bg-white dark:bg-[#1a2e1a] border border-black/5 dark:border-white/5 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B5E20]/30"
        />
        <select
          value={subFilter}
          onChange={e => setSubFilter(e.target.value)}
          dir="rtl"
          className="px-3 py-2 rounded-xl text-sm bg-white dark:bg-[#1a2e1a] border border-black/5 dark:border-white/5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1B5E20]/30"
        >
          <option value="">كل المواد</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
      </div>

      <Table
        columns={columns}
        data={lectures}
        keyField="id"
        isLoading={isLoading}
        emptyText="لا توجد محاضرات"
      />

      <Modal
        open={modal !== null}
        onClose={() => { setModal(null); setEditing(null) }}
        title={editing ? 'تعديل المحاضرة' : 'إضافة محاضرة جديدة'}
        size="lg"
      >
        <LectureForm
          initial={editing ? fromLecture(editing) : EMPTY_FORM}
          subjects={subjects}
          onSave={handleSave}
          onCancel={() => { setModal(null); setEditing(null) }}
          isSaving={mutating}
        />
      </Modal>

      <Confirm
        open={!!delId}
        message="هل أنت متأكد من حذف هذه المحاضرة؟"
        onConfirm={handleDelete}
        onCancel={() => setDelId(null)}
        loading={deleting}
      />
    </>
  )
}
