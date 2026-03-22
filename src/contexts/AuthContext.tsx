// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/database.types'
import { initializePushNotifications } from '../services/push'
import { runResumeSync } from '../lib/syncService'

// ─── Types ────────────────────────────────────────────────────
interface AuthContextValue {
  user:        User | null
  profile:     Profile | null
  session:     Session | null
  isLoading:   boolean
  isAdmin:     boolean
  signUp:      (email: string, password: string, fullName: string) => Promise<void>
  signIn:      (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut:     () => Promise<void>
  refreshProfile: () => Promise<void>
}

// ─── Context ──────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const profileFetchedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let disposed = false
    let removeListener: (() => void) | null = null
    let removeResumeListener: (() => void) | null = null

    const handleAuthCallbackUrl = async (url?: string) => {
      if (!url || disposed) return

      try {
        const parsed = new URL(url)
        const isAuthCallback =
          parsed.protocol === 'com.islame.app:' &&
          parsed.hostname === 'login-callback'

        if (!isAuthCallback) return

        const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const code = parsed.searchParams.get('code')
        const authError = parsed.searchParams.get('error_description') || hashParams.get('error_description')

        if (authError) {
          throw new Error(decodeURIComponent(authError))
        }

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (error) throw error
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else {
          console.warn('Auth: callback received without session params')
          return
        }

        // Some Android callback flows do not trigger a fresh auth event reliably.
        // Read session explicitly to unblock route guards immediately.
        const { data: { session } } = await supabase.auth.getSession()
        if (!disposed) {
          setSession(session)
          setUser(session?.user ?? null)
          if (session?.user) {
            profileFetchedRef.current = null
            await fetchProfile(session.user.id)
          } else {
            setProfile(null)
            profileFetchedRef.current = null
          }
        }
        await Browser.close().catch(() => {})

        // ── Force fresh session after Google OAuth ──────────────
        // Wait 800ms for Supabase to finish saving the session in storage
        await new Promise(resolve => setTimeout(resolve, 800))

        if (!disposed) {
          try {
            const { data: { session: freshSession } } = await supabase.auth.getSession()
            if (freshSession?.user) {
              setSession(freshSession)
              setUser(freshSession.user)
              profileFetchedRef.current = null
              await fetchProfile(freshSession.user.id)
            }
          } catch (refreshErr) {
            console.error('Auth: post-callback refresh failed:', refreshErr)
          }
        }
      } catch (err) {
        if (!disposed) console.error('Auth: callback session handling failed:', err)
      }
    }

    App.getLaunchUrl().then(({ url }) => {
      void handleAuthCallbackUrl(url)
    }).catch((err) => {
      if (!disposed) console.error('Auth: getLaunchUrl failed:', err)
    })

    App.addListener('appUrlOpen', ({ url }) => {
      void handleAuthCallbackUrl(url)
    }).then((listener) => {
      removeListener = () => { listener.remove() }
    })

    App.addListener('resume', async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!disposed && session) {
          setSession(session)
          setUser(session.user)
        }
        // ── Sync البيانات لما التطبيق يرجع من الخلفية ─────────
        runResumeSync().catch(err => {
          console.warn('Auth: resume sync failed', err)
        })
      } catch (err) {
        if (!disposed) console.error('Auth: resume getSession failed:', err)
      }
    }).then((listener) => {
      removeResumeListener = () => { listener.remove() }
    })

    return () => {
      disposed = true
      if (removeListener) removeListener()
      if (removeResumeListener) removeResumeListener()
    }
  }, [])

  // جلب الـ profile من جدول profiles
  async function fetchProfile(userId: string) {
    if (profileFetchedRef.current === userId) return
    profileFetchedRef.current = userId

    try {
      console.log('Auth: Fetching profile for', userId)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.warn('Auth: Profile fetch error:', error)
        profileFetchedRef.current = null
      } else if (data) {
        console.log('Auth: Profile loaded')
        setProfile(data)
      }
    } catch (err) {
      console.error('Auth: fetchProfile failed:', err)
      profileFetchedRef.current = null
    }
  }

  async function refreshProfile() {
    if (user) {
      profileFetchedRef.current = null
      await fetchProfile(user.id)
    }
  }

  // مراقبة حالة الـ Auth
  useEffect(() => {
    console.log('Auth: Initializing...')
    
    // ✅ Safety Timeout: If loading takes > 10s, force it to stop
    const safetyTimer = setTimeout(() => {
      if (isLoading) {
        console.warn('Auth: Safety timeout reached. Forcing isLoading to false.')
        setIsLoading(false)
      }
    }, 10000)

    // جلب الـ session الحالية عند فتح التطبيق
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        console.log('Auth: Session retrieved', !!session)
        setSession(session)
        setUser(session?.user ?? null) // ← ADDED
        if (session?.user) {
          await fetchProfile(session.user.id)
          initializePushNotifications() // 🟢 Init push
        }
      })
      .catch(err => {
        console.error('Auth: getSession error:', err)
      })
      .finally(() => {
        console.log('Auth: isLoading set to false (getSession)')
        setIsLoading(false)
        clearTimeout(safetyTimer)
      })

    // الاستماع لأي تغيير في حالة الـ Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          console.log('Auth: Auth state changed', _event, !!session)
          setSession(session)
          setUser(session?.user ?? null)
          if (session?.user) {
            await fetchProfile(session.user.id)
            initializePushNotifications() // 🟢 Init push on login
          } else {
            setProfile(null)
            profileFetchedRef.current = null
          }
        } catch (err) {
          console.error('Auth: onAuthStateChange logic error:', err)
        } finally {
          console.log('Auth: isLoading set to false (onAuthStateChange)')
          setIsLoading(false)
          clearTimeout(safetyTimer)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      clearTimeout(safetyTimer)
    }
  }, [])

  // ─── Auth Actions ──────────────────────────────────────────
  async function signUp(email: string, password: string, fullName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })
    if (error) throw error
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signInWithGoogle() {
    if (Capacitor.isNativePlatform()) {
      await supabase.auth.signOut().catch(() => {})
      setSession(null)
      setUser(null)
      setProfile(null)
      profileFetchedRef.current = null

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'com.islame.app://login-callback',
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      })
      if (error) throw error
      if (!data?.url) throw new Error('Missing Google OAuth URL')
      await Browser.open({ url: data.url })
      return
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value: AuthContextValue = {
    user,
    profile,
    session,
    isLoading,
    isAdmin: profile?.role === 'admin',
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth لازم يتستخدم جوا AuthProvider')
  return ctx
}
