// src/screens/AuthScreens.tsx
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'

type AuthMode = 'login' | 'register'

function Input({
  label, type = 'text', value, onChange, placeholder, required, isRTL,
}: {
  label: string; type?: string; value: string
  onChange: (v: string) => void; placeholder?: string; required?: boolean; isRTL: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={`text-sm font-medium text-gray-700 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
        {label}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required} dir={isRTL ? 'rtl' : 'ltr'}
        className={`w-full px-4 py-3 rounded-xl text-sm ${isRTL ? 'text-right' : 'text-left'}
          bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700
          text-gray-900 dark:text-gray-100 placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary
          transition-all duration-200`}
      />
    </div>
  )
}

function ErrorAlert({ message, isRTL }: { message: string; isRTL: boolean }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
      <span className="text-red-500 mt-0.5">⚠️</span>
      <p className={`text-sm text-red-700 dark:text-red-400 flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{message}</p>
    </div>
  )
}

// —— Google Icon SVG ————————————————————————————————————————————————————————————
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  )
}

// ——— AuthScreens ——————————————————————————————————————————————————————————————
export default function AuthScreens() {
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const { signIn, signUp, signInWithGoogle, user } = useAuth()
  const isRTL = i18n.dir() === 'rtl'

  const [mode,      setMode]      = useState<AuthMode>('login')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [fullName,  setFullName]  = useState('')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [success,   setSuccess]   = useState(false)
  const googleStartUserIdRef = useRef<string | null>(null)

  function translateError(msg: string): string {
    if (msg.includes('Invalid login credentials'))   return 'البريد أو كلمة المرور غلط'
    if (msg.includes('Email not confirmed'))          return 'لازم تأكد الإيميل الأول من رسالة التفعيل'
    if (msg.includes('User already registered'))      return 'الإيميل ده مسجل من قبل'
    if (msg.includes('Password should be at least')) return 'كلمة المرور لازم تكون 6 أحرف على الأقل'
    if (msg.includes('Unable to validate email'))     return 'صيغة الإيميل غلط'
    return msg
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        // لا تعمل navigate هنا — اتركها للـ useEffect اللي بيراقب user
        // navigate('/') هتتعمل تلقائياً لما user يحدث في AuthContext
      } else {
        if (!fullName.trim()) { setError('من فضلك اكتب اسمك'); setLoading(false); return }
        await signUp(email, password, fullName)
        setSuccess(true)
        setLoading(false)
      }
    } catch (err: any) {
      setError(translateError(err?.message ?? 'حدث خطأ، حاول تاني'))
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setError('')
    setGoogleLoading(true)
    googleStartUserIdRef.current = user?.id ?? null
    try {
      await signInWithGoogle()
      // Supabase will redirect to Google then back — no navigate() needed here
    } catch (err: any) {
      setError('فشل تسجيل الدخول بـ Google، حاول تاني')
      setGoogleLoading(false)
      googleStartUserIdRef.current = null
    }
  }

  useEffect(() => {
    if (!user || !googleLoading) return
    if (user.id === googleStartUserIdRef.current) return
    setGoogleLoading(false)
    googleStartUserIdRef.current = null
    navigate('/', { replace: true })
  }, [user, googleLoading, navigate])

  useEffect(() => {
    if (!googleLoading) return

    const timeout = setTimeout(() => {
      setGoogleLoading(false)
      setError('انتهت مهلة تسجيل Google. جرّب مرة أخرى.')
    }, 30000)

    return () => clearTimeout(timeout)
  }, [googleLoading])

  // لما user يحدث بعد تسجيل الدخول — روح للرئيسية
  useEffect(() => {
    if (user && !googleLoading) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  // ——— Success screen ————————————————————————————————————————————————————————
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark p-6">
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">تم التسجيل بنجاح!</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            بعتنالك رسالة تفعيل على <strong>{email}</strong> — افتحها واضغط على رابط التأكيد
          </p>
          <button
            onClick={() => { setSuccess(false); setMode('login') }}
            className="w-full py-3 rounded-xl bg-primary text-white font-medium text-sm tap-bounce"
          >
            روح لتسجيل الدخول
          </button>
        </div>
      </div>
    )
  }

  // ——— Main screen ——————————————————————————————————————————————————————————————
  return (
    <div className="min-h-screen islamic-pattern flex items-center justify-center bg-bg-light dark:bg-bg-dark p-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl p-3 flex items-center justify-center mx-auto mb-4 shadow-sm border border-primary/20">
            <img src="/logo.png" alt="Islame Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-serif">
            المحاضرات الإسلامية
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {mode === 'login' ? 'أهلاً بعودتك' : 'سجّل حساب جديد'}
          </p>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">

          {/* ✅ Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl
              border-2 border-gray-200 dark:border-gray-700
              bg-white dark:bg-dark-card
              text-gray-700 dark:text-gray-200
              font-semibold text-sm
              hover:bg-gray-50 dark:hover:bg-gray-800
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 tap-bounce mb-5"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {googleLoading ? 'جاري التحويل...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 font-medium">أو</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 mb-5 gap-1">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 tap-bounce
                  ${mode === m
                    ? 'bg-white dark:bg-dark-card text-primary shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                  }`}
              >
                {m === 'login' ? 'تسجيل الدخول' : 'حساب جديد'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <Input label="الاسم الكامل" value={fullName} onChange={setFullName} placeholder="محمد أحمد" required isRTL={isRTL} />
            )}
            <Input label="البريد الإلكتروني" type="email" value={email} onChange={setEmail} placeholder="example@email.com" required isRTL={isRTL} />
            <Input label="كلمة المرور" type="password" value={password} onChange={setPassword} placeholder="••••••••" required isRTL={isRTL} />

            {error && <ErrorAlert message={error} isRTL={isRTL} />}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white
                bg-primary hover:bg-primary/90
                disabled:opacity-50 disabled:cursor-not-allowed
                tap-bounce transition-all duration-200 mt-1
                flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'جاري...' : mode === 'login' ? 'دخول' : 'إنشاء حساب'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6 leading-relaxed">
          ﴿ وَقُل رَّبِّ زِدْنِي عِلْمًا ﴾
        </p>
      </div>
    </div>
  )
}
