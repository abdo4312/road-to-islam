// src/hooks/queries.ts
// كل الـ React Query hooks في مكان واحد منظم

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

import {
  getLectures, getLectureById, getLecturesBySubject,
  createLecture, updateLecture, deleteLecture,
  type LecturesFilter, type CreateLectureDTO, type UpdateLectureDTO,
} from '../services/lectures.service'

import {
  getSubjects, getAllSubjectsAdmin,
  createSubject, updateSubject, deleteSubject,
  type CreateSubjectDTO, type UpdateSubjectDTO,
} from '../services/subjects.service'

import {
  getBookmarks, addBookmark, removeBookmark,
} from '../services/subjects.service'

import {
  getUserProgress, getProgressBySubject, upsertProgress,
} from '../services/subjects.service'

// ─── Query Keys (مركزية — لا strings متفرقة) ─────────────────
export const queryKeys = {
  lectures:         (f?: LecturesFilter, p?: number) => ['lectures', f, p] as const,
  lecture:          (id: string)                      => ['lecture', id]   as const,
  lecturesBySubject:(id: string)                      => ['lectures', 'subject', id] as const,
  subjects:         ()                                => ['subjects']       as const,
  subjectsAdmin:    ()                                => ['subjects', 'admin'] as const,
  bookmarks:        (userId: string)                  => ['bookmarks', userId] as const,
  progress:         (userId: string)                  => ['progress', userId]  as const,
  progressSubject:  (userId: string, subId: string)   => ['progress', userId, subId] as const,
}


// ══════════════════════════════════════════════════════════════
// 📚 LECTURES HOOKS
// ══════════════════════════════════════════════════════════════

/**
 * جلب قائمة المحاضرات مع بحث + فلتر + pagination
 *
 * @example
 * const { lectures, isLoading, page, setPage, search, setSearch } = useLectures()
 * const { lectures } = useLectures({ subjectId: 'xxx' })
 */
export function useLectures(initialFilter: LecturesFilter = {}) {
  const [filter,   setFilter]   = useState<LecturesFilter>(initialFilter)
  const [page,     setPage]     = useState(1)
  const [search,   setSearch]   = useState('')
  const pageSize = 20

  // إعادة الصفحة لـ 1 عند تغيير الفلتر أو البحث
  function handleFilterChange(newFilter: Partial<LecturesFilter>) {
    setFilter(prev => ({ ...prev, ...newFilter }))
    setPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  const activeFilter = { ...filter, search }

  const query = useQuery({
    queryKey: queryKeys.lectures(activeFilter, page),
    queryFn:  () => getLectures(activeFilter, { page, pageSize }),
    placeholderData: keepPreviousData, // يفضل البيانات القديمة أثناء التحميل
  })

  return {
    lectures:    query.data?.data ?? [],
    total:       query.data?.total ?? 0,
    totalPages:  query.data?.totalPages ?? 1,
    page,
    setPage,
    search,
    setSearch:   handleSearchChange,
    filter,
    setFilter:   handleFilterChange,
    isLoading:   query.isLoading,
    isFetching:  query.isFetching,
    error:       query.error,
  }
}

/**
 * جلب محاضرة واحدة بالـ ID
 *
 * @example
 * const { lecture, isLoading } = useLecture('lecture-uuid')
 */
export function useLecture(id: string) {
  const query = useQuery({
    queryKey: queryKeys.lecture(id),
    queryFn:  () => getLectureById(id),
    enabled:  !!id,
  })

  return {
    lecture:   query.data,
    isLoading: query.isLoading,
    error:     query.error,
  }
}

/**
 * كل محاضرات مادة معينة
 *
 * @example
 * const { lectures } = useLecturesBySubject('subject-uuid')
 */
export function useLecturesBySubject(subjectId: string) {
  const query = useQuery({
    queryKey: queryKeys.lecturesBySubject(subjectId),
    queryFn:  () => getLecturesBySubject(subjectId),
    enabled:  !!subjectId,
  })

  return {
    lectures:  query.data ?? [],
    isLoading: query.isLoading,
    error:     query.error,
  }
}


// ══════════════════════════════════════════════════════════════
// 📚 LECTURES MUTATIONS (Admin)
// ══════════════════════════════════════════════════════════════

/**
 * إضافة / تعديل / حذف محاضرة
 *
 * @example
 * const { create, update, remove, isLoading } = useLectureMutations()
 * await create({ subject_id: 'x', title: 'محاضرة ١', is_published: true })
 */
export function useLectureMutations() {
  const qc = useQueryClient()

  // دالة مساعدة: تبطل كل cache الـ lectures
  function invalidate() {
    qc.invalidateQueries({ queryKey: ['lectures'] })
  }

  const createMutation = useMutation({
    mutationFn: (dto: CreateLectureDTO) => createLecture(dto),
    onSuccess:  invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLectureDTO }) =>
      updateLecture(id, dto),
    onSuccess: (_, { id }) => {
      invalidate()
      qc.invalidateQueries({ queryKey: queryKeys.lecture(id) })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLecture(id),
    onSuccess:  invalidate,
  })

  return {
    create:    createMutation.mutateAsync,
    update:    (id: string, dto: UpdateLectureDTO) =>
                 updateMutation.mutateAsync({ id, dto }),
    remove:    deleteMutation.mutateAsync,
    isLoading: createMutation.isPending ||
               updateMutation.isPending ||
               deleteMutation.isPending,
  }
}


// ══════════════════════════════════════════════════════════════
// 📂 SUBJECTS HOOKS
// ══════════════════════════════════════════════════════════════

/** جلب المواد للمستخدم العادي */
export function useSubjects() {
  const query = useQuery({
    queryKey: queryKeys.subjects(),
    queryFn:  getSubjects,
    staleTime: 1000 * 60 * 10, // المواد بتتغير نادراً → 10 دقائق
  })

  return {
    subjects:  query.data ?? [],
    isLoading: query.isLoading,
    error:     query.error,
  }
}

/** جلب كل المواد + CRUD للادمن */
export function useSubjectsAdmin() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.subjectsAdmin(),
    queryFn:  getAllSubjectsAdmin,
  })

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['subjects'] })
  }

  const createMutation = useMutation({
    mutationFn: (dto: CreateSubjectDTO) => createSubject(dto),
    onSuccess:  invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSubjectDTO }) =>
      updateSubject(id, dto),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSubject(id),
    onSuccess:  invalidate,
  })

  return {
    subjects:  query.data ?? [],
    isLoading: query.isLoading,
    create:    createMutation.mutateAsync,
    update:    (id: string, dto: UpdateSubjectDTO) =>
                 updateMutation.mutateAsync({ id, dto }),
    remove:    deleteMutation.mutateAsync,
    isMutating: createMutation.isPending ||
                updateMutation.isPending ||
                deleteMutation.isPending,
  }
}


// ══════════════════════════════════════════════════════════════
// 🔖 BOOKMARKS HOOKS
// ══════════════════════════════════════════════════════════════

/**
 * مفضلات المستخدم الحالي مع toggle
 *
 * @example
 * const { bookmarks, toggle, isBookmarked } = useBookmarks()
 * toggle('lecture-uuid')  // يضيف أو يشيل من المفضلة
 */
export function useBookmarks() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const userId = user?.id ?? ''

  const query = useQuery({
    queryKey: queryKeys.bookmarks(userId),
    queryFn:  () => getBookmarks(userId),
    enabled:  !!userId,
  })

  const bookmarkedIds = new Set(
    query.data?.map(b => b.lecture_id) ?? []
  )

  const toggleMutation = useMutation({
    mutationFn: async (lectureId: string) => {
      if (bookmarkedIds.has(lectureId)) {
        await removeBookmark(userId, lectureId)
      } else {
        await addBookmark(userId, lectureId)
      }
    },
    // Optimistic update: يغير الـ UI فوراً قبل ما يرد السيرفر
    onMutate: async (lectureId) => {
      await qc.cancelQueries({ queryKey: queryKeys.bookmarks(userId) })
      const prev = qc.getQueryData(queryKeys.bookmarks(userId))

      qc.setQueryData(queryKeys.bookmarks(userId), (old: any[] = []) =>
        bookmarkedIds.has(lectureId)
          ? old.filter(b => b.lecture_id !== lectureId)
          : [...old, { lecture_id: lectureId, user_id: userId, id: 'temp', created_at: '' }]
      )

      return { prev }
    },
    onError: (_err, _id, ctx) => {
      // لو فشل → رجّع البيانات القديمة
      if (ctx?.prev) qc.setQueryData(queryKeys.bookmarks(userId), ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bookmarks(userId) })
    },
  })

  return {
    bookmarks:    query.data ?? [],
    isLoading:    query.isLoading,
    isBookmarked: (id: string) => bookmarkedIds.has(id),
    toggle:       toggleMutation.mutate,
    isToggling:   toggleMutation.isPending,
  }
}


// ══════════════════════════════════════════════════════════════
// 📊 PROGRESS HOOKS
// ══════════════════════════════════════════════════════════════

/**
 * تقدم المستخدم + تحديثه
 *
 * @example
 * const { markComplete, savePosition, getPercent } = useLectureProgress()
 * markComplete('lecture-uuid')
 * savePosition('lecture-uuid', 342)   // 342 ثانية
 */
export function useLectureProgress() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const userId = user?.id ?? ''

  const query = useQuery({
    queryKey: queryKeys.progress(userId),
    queryFn:  () => getUserProgress(userId),
    enabled:  !!userId,
  })

  const progressMap = new Map(
    query.data?.map(p => [p.lecture_id, p]) ?? []
  )

  const upsertMutation = useMutation({
    mutationFn: ({ lectureId, updates }: {
      lectureId: string
      updates: { is_complete?: boolean; last_position_sec?: number }
    }) => upsertProgress(userId, lectureId, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.progress(userId) })
    },
  })

  return {
    progressList: query.data ?? [],
    isLoading:    query.isLoading,

    // هل المحاضرة مكتملة؟
    isComplete: (lectureId: string) =>
      progressMap.get(lectureId)?.is_complete ?? false,

    // آخر موضع وصله
    lastPosition: (lectureId: string) =>
      progressMap.get(lectureId)?.last_position_sec ?? 0,

    // نسبة إتمام مجموعة محاضرات
    getPercent: (lectureIds: string[]) => {
      if (!lectureIds.length) return 0
      const done = lectureIds.filter(id => progressMap.get(id)?.is_complete).length
      return Math.round((done / lectureIds.length) * 100)
    },

    // إشارة محاضرة كمكتملة
    markComplete: (lectureId: string) =>
      upsertMutation.mutateAsync({ lectureId, updates: { is_complete: true } }),

    // حفظ الموضع الصوتي (بيتنادى كل 10 ثوان مثلاً)
    savePosition: (lectureId: string, seconds: number) =>
      upsertMutation.mutateAsync({ lectureId, updates: { last_position_sec: seconds } }),

    isSaving: upsertMutation.isPending,
  }
}

/**
 * نسبة تقدم مادة معينة (للعرض في بطاقة المادة)
 *
 * @example
 * const { percent, completed, total } = useSubjectProgress('subject-uuid')
 */
export function useSubjectProgress(subjectId: string) {
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const query = useQuery({
    queryKey: queryKeys.progressSubject(userId, subjectId),
    queryFn:  () => getProgressBySubject(userId, subjectId),
    enabled:  !!userId && !!subjectId,
  })

  return {
    percent:   query.data?.percent   ?? 0,
    completed: query.data?.completed ?? 0,
    total:     query.data?.total     ?? 0,
    isLoading: query.isLoading,
  }
}
