// src/services/lectures.service.ts
// طبقة البيانات — كل حاجة ليها علاقة بالمحاضرات

import { supabase } from '../lib/supabase'
import type { Lecture, LectureWithSubject } from '../lib/database.types'

// ─── Types ────────────────────────────────────────────────────
export interface LecturesFilter {
  subjectId?:  string
  search?:     string
  published?:  boolean       // الادمن ممكن يشوف غير المنشور
}

export interface PaginationParams {
  page:     number           // يبدأ من 1
  pageSize: number
}

export interface PaginatedResult<T> {
  data:       T[]
  total:      number
  page:       number
  pageSize:   number
  totalPages: number
}

export interface CreateLectureDTO {
  subject_id:   string
  title:        string
  description?: string
  content?:     string
  audio_url?:   string
  pdf_url?:     string
  video_url?:   string
  day_number?:  number
  duration_min?: number
  order_index?: number
  is_published?: boolean
}

export type UpdateLectureDTO = Partial<CreateLectureDTO>

// ─── Queries ──────────────────────────────────────────────────

/** جلب المحاضرات مع فلتر وبحث وتقسيم صفحات */
export async function getLectures(
  filter: LecturesFilter = {},
  pagination: PaginationParams = { page: 1, pageSize: 20 }
): Promise<PaginatedResult<LectureWithSubject>> {
  const { subjectId, search, published = true } = filter
  const { page, pageSize } = pagination
  const from = (page - 1) * pageSize
  const to   = from + pageSize - 1

  let query = supabase
    .from('lectures')
    .select('*, subjects(title, color, icon)', { count: 'exact' })
    .order('order_index', { ascending: true })
    .range(from, to)

  if (published) query = query.eq('is_published', true)
  if (subjectId) query = query.eq('subject_id', subjectId)
  if (search?.trim()) query = query.ilike('title', `%${search.trim()}%`)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  return {
    data:       (data ?? []) as LectureWithSubject[],
    total:      count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

/** جلب محاضرة واحدة بالـ ID */
export async function getLectureById(id: string): Promise<LectureWithSubject> {
  const { data, error } = await supabase
    .from('lectures')
    .select('*, subjects(title, color, icon)')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data as LectureWithSubject
}

/** جلب كل محاضرات مادة معينة بالترتيب */
export async function getLecturesBySubject(subjectId: string): Promise<Lecture[]> {
  const { data, error } = await supabase
    .from('lectures')
    .select('*')
    .eq('subject_id', subjectId)
    .eq('is_published', true)
    .order('order_index', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Lecture[]
}

// ─── Mutations (Admin Only) ────────────────────────────────────

/** إضافة محاضرة جديدة */
export async function createLecture(dto: CreateLectureDTO): Promise<Lecture> {
  const { data, error } = await supabase
    .from('lectures')
    .insert(dto)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Lecture
}

/** تعديل محاضرة */
export async function updateLecture(id: string, dto: UpdateLectureDTO): Promise<Lecture> {
  const { data, error } = await supabase
    .from('lectures')
    .update(dto)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Lecture
}

/** حذف محاضرة */
export async function deleteLecture(id: string): Promise<void> {
  const { error } = await supabase
    .from('lectures')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

/** تغيير ترتيب محاضرتين (swap) */
export async function swapLectureOrder(
  idA: string, orderA: number,
  idB: string, orderB: number
): Promise<void> {
  const [r1, r2] = await Promise.all([
    supabase.from('lectures').update({ order_index: orderB }).eq('id', idA),
    supabase.from('lectures').update({ order_index: orderA }).eq('id', idB),
  ])
  if (r1.error) throw new Error(r1.error.message)
  if (r2.error) throw new Error(r2.error.message)
}

/** جلب محاضرة بالـ day_number (لـ 30-Day Program) */
export async function getLectureByDay(dayNumber: number) {
  const { data, error } = await supabase
    .from('lectures')
    .select('*')
    .eq('day_number', dayNumber)
    .eq('is_published', true)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}
