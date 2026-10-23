// src/services/subjects.service.ts
import { supabase } from '../lib/supabase'
import type { Subject } from '../lib/database.types'

export interface CreateSubjectDTO {
  title:        string
  description?: string
  icon?:        string
  color?:       string
  order_index?: number
}
export type UpdateSubjectDTO = Partial<CreateSubjectDTO>

// ─── Queries ──────────────────────────────────────────────────

export async function getSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Subject[]
}

/** كل المواد للادمن (حتى غير الفعّالة) */
export async function getAllSubjectsAdmin(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('order_index', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Subject[]
}

// ─── Mutations (Admin Only) ────────────────────────────────────

export async function createSubject(dto: CreateSubjectDTO): Promise<Subject> {
  const { data, error } = await supabase
    .from('subjects')
    .insert(dto)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Subject
}

export async function updateSubject(id: string, dto: UpdateSubjectDTO): Promise<Subject> {
  const { data, error } = await supabase
    .from('subjects')
    .update(dto)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Subject
}

export async function deleteSubject(id: string): Promise<void> {
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}


// ══════════════════════════════════════════════════════════════
// src/services/bookmarks.service.ts
// ══════════════════════════════════════════════════════════════
import type { Bookmark, LectureWithSubject } from '../lib/database.types'

/** كل مفضلات المستخدم مع بيانات المحاضرة */
export async function getBookmarks(userId: string): Promise<
  (Bookmark & { lectures: LectureWithSubject })[]
> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*, lectures(*, subjects(title, color, icon))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as any
}

/** هل محاضرة معينة في المفضلة؟ */
export async function isBookmarked(userId: string, lectureId: string): Promise<boolean> {
  const { data } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('lecture_id', lectureId)
    .maybeSingle()

  return !!data
}

export async function addBookmark(userId: string, lectureId: string): Promise<void> {
  const { error } = await supabase
    .from('bookmarks')
    .insert({ user_id: userId, lecture_id: lectureId })

  if (error) throw new Error(error.message)
}

export async function removeBookmark(userId: string, lectureId: string): Promise<void> {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('lecture_id', lectureId)

  if (error) throw new Error(error.message)
}


// ══════════════════════════════════════════════════════════════
// src/services/progress.service.ts
// ══════════════════════════════════════════════════════════════
import type { UserProgress } from '../lib/database.types'

/** كل تقدم المستخدم */
export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  return (data ?? []) as UserProgress[]
}

/** تقدم مستخدم في مادة معينة */
export async function getProgressBySubject(
  userId: string,
  subjectId: string
): Promise<{ completed: number; total: number; percent: number }> {
  // كل محاضرات المادة
  const { data: lectures } = await supabase
    .from('lectures')
    .select('id')
    .eq('subject_id', subjectId)
    .eq('is_published', true)

  const total = lectures?.length ?? 0
  if (total === 0) return { completed: 0, total: 0, percent: 0 }

  const lectureIds = lectures!.map(l => l.id)

  const { count } = await supabase
    .from('user_progress')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_complete', true)
    .in('lecture_id', lectureIds)

  const completed = count ?? 0
  return { completed, total, percent: Math.round((completed / total) * 100) }
}

/** تحديث أو إنشاء تقدم محاضرة */
export async function upsertProgress(
  userId: string,
  lectureId: string,
  updates: { is_complete?: boolean; last_position_sec?: number }
): Promise<UserProgress> {
  const payload: any = {
    user_id:    userId,
    lecture_id: lectureId,
    ...updates,
  }
  if (updates.is_complete) payload.completed_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('user_progress')
    .upsert(payload, { onConflict: 'user_id,lecture_id' })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as UserProgress
}
