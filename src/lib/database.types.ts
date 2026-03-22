// src/lib/database.types.ts
// Compatible with @supabase/supabase-js v2.99+ (postgrest-js v2, PostgrestVersion "12")

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

// مش محتاج enum — بس وسّع الـ type:
export type UserRole = 'student' | 'admin' | 'mentor'

export interface Database {
  PostgrestVersion: "1"
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          role: UserRole
          gender: 'male' | 'female' | null
          whatsapp_number: string | null
          fcm_token: string | null
          created_at: string
          updated_at: string
          country: string | null
          city: string | null
          latitude: number | null
          longitude: number | null
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          role?: UserRole
          gender?: 'male' | 'female' | null
          whatsapp_number?: string | null
          fcm_token?: string | null
          created_at?: string
          updated_at?: string
          country?: string | null
          city?: string | null
          latitude?: number | null
          longitude?: number | null
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
          role?: UserRole
          gender?: 'male' | 'female' | null
          whatsapp_number?: string | null
          fcm_token?: string | null
          updated_at?: string
          country?: string | null
          city?: string | null
          latitude?: number | null
          longitude?: number | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          id: string
          title: string
          description: string | null
          icon: string | null
          color: string
          order_index: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          icon?: string | null
          color?: string
          order_index?: number
          is_active?: boolean
        }
        Update: {
          title?: string
          description?: string | null
          icon?: string | null
          color?: string
          order_index?: number
          is_active?: boolean
        }
        Relationships: []
      }
      lectures: {
        Row: {
          id: string
          subject_id: string
          title: string
          description: string | null
          content: string | null
          audio_url: string | null
          pdf_url: string | null
          video_url: string | null
          day_number: number | null
          duration_min: number | null
          order_index: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subject_id: string
          title: string
          description?: string | null
          content?: string | null
          audio_url?: string | null
          pdf_url?: string | null
          video_url?: string | null
          day_number?: number | null
          duration_min?: number | null
          order_index?: number
          is_published?: boolean
        }
        Update: {
          subject_id?: string
          title?: string
          description?: string | null
          content?: string | null
          audio_url?: string | null
          pdf_url?: string | null
          video_url?: string | null
          day_number?: number | null
          duration_min?: number | null
          order_index?: number
          is_published?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "lectures_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          }
        ]
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          lecture_id: string
          is_complete: boolean
          last_position_sec: number
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lecture_id: string
          is_complete?: boolean
          last_position_sec?: number
          completed_at?: string | null
        }
        Update: {
          is_complete?: boolean
          last_position_sec?: number
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lecture_id_fkey"
            columns: ["lecture_id"]
            isOneToOne: false
            referencedRelation: "lectures"
            referencedColumns: ["id"]
          }
        ]
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          lecture_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lecture_id: string
        }
        Update: {
          user_id?: string
          lecture_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_lecture_id_fkey"
            columns: ["lecture_id"]
            isOneToOne: false
            referencedRelation: "lectures"
            referencedColumns: ["id"]
          }
        ]
      }
      questions: {
        Row: {
          id: string
          user_id: string | null
          question: string
          answer: string | null
          is_answered: boolean
          is_public: boolean
          answered_by: string | null
          answered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          question: string
          answer?: string | null
          is_answered?: boolean
          is_public?: boolean
        }
        Update: {
          answer?: string | null
          is_answered?: boolean
          is_public?: boolean
          answered_by?: string | null
          answered_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string
          type: string
          is_read: boolean
          created_at: string
          action_type: string | null
          action_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body: string
          type?: string
          is_read?: boolean
          created_at?: string
          action_type?: string | null
          action_id?: string | null
        }
        Update: {
          title?: string
          body?: string
          type?: string
          is_read?: boolean
          action_type?: string | null
          action_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_journey: {
        Row: {
          user_id: string
          completed_days: number[]
          updated_at: string
        }
        Insert: {
          user_id: string
          completed_days?: number[]
          updated_at?: string
        }
        Update: {
          completed_days?: number[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_journey_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      mentor_requests: {
        Row: {
          id: string
          student_id: string
          mentor_id: string
          status: 'pending' | 'approved' | 'declined'
          question_text: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          mentor_id: string
          status?: 'pending' | 'approved' | 'declined'
          question_text: string
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'approved' | 'declined'
        }
        Relationships: []
      }
      mentor_messages: {
        Row: {
          id: string
          request_id: string
          sender_id: string
          body: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          sender_id: string
          body: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          is_read?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "mentor_messages_request_id_fkey",
            columns: ["request_id"],
            referencedRelation: "mentor_requests",
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_messages_sender_id_fkey",
            columns: ["sender_id"],
            referencedRelation: "profiles",
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      get_mentor_whatsapp: {
        Args: {
          mentor_uuid: string
          student_uuid: string
        }
        Returns: string
      }
    }
    Enums: {
      user_role: 'student' | 'admin' | 'mentor'
    }
    CompositeTypes: Record<string, never>
  }
}

export type Profile      = Database['public']['Tables']['profiles']['Row']
export type Subject      = Database['public']['Tables']['subjects']['Row']
export type Lecture      = Database['public']['Tables']['lectures']['Row']
export type UserProgress = Database['public']['Tables']['user_progress']['Row']
export type Bookmark     = Database['public']['Tables']['bookmarks']['Row']
export type Question     = Database['public']['Tables']['questions']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type MentorMessage = Database['public']['Tables']['mentor_messages']['Row']
export type MentorRequest = Database['public']['Tables']['mentor_requests']['Row']
export type UserJourney  = Database['public']['Tables']['user_journey']['Row']

export type LectureWithSubject = Lecture & {
  subjects: Pick<Subject, 'title' | 'color' | 'icon'>
}

export type ProgressWithLecture = UserProgress & {
  lectures: Pick<Lecture, 'title' | 'duration_min' | 'subject_id'>
}
