import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Screen, LocationState } from '../types'
import { Notifications } from './Notifications'
import { FindMentor } from './FindMentor'
import { MentorDashboard } from './MentorDashboard'
import { MentorChat } from './MentorChat'
import { Home } from './HomeScreen'
import { LearnProgram } from './LearnProgramScreen'
import { DayDetail } from './DayDetailScreen'

// ── Router ────────────────────────────────────────────────────
// ✅ FIX: استبدلنا Navigate declarative + useEffect([initial]) بـ useNavigate imperative
// المشكلة الأصلية: الـ useEffect كان بيعيد setScreen('LEARN_PROGRAM') بعد الضغط على Qibla
// لأن الـ location.state كانت بتتغير وبتعيد trigger الـ effect بشكل غلط
export default function MainScreens() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const initial = (state as LocationState)?.initialScreen
  const [screen, setScreen] = React.useState<Screen>(initial ?? 'HOME')
  const [chatParams, setChatParams] = React.useState<{ requestId: string; otherPersonName: string } | null>(null)

  // Extract chat params from location state or localStorage for notification navigation
  const chatStateParams = (state as LocationState)?.chatParams as { requestId: string; otherPersonName: string } | undefined

  React.useEffect(() => {
    // First check localStorage (from notification click)
    const pendingChat = localStorage.getItem('pending_chat');
    if (pendingChat) {
      try {
        const params = JSON.parse(pendingChat);
        setChatParams(params);
        localStorage.removeItem('pending_chat');
      } catch (e) {
        console.error('Failed to parse pending_chat', e);
      }
    } else if (chatStateParams) {
      // Fallback to state params
      setChatParams(chatStateParams);
    }
  }, [chatStateParams])

  const lastInitialRef = React.useRef<Screen | undefined>(initial)
  React.useEffect(() => {
    if (initial && initial !== lastInitialRef.current) {
      // الفوتر navigate لـ screen جديدة — حدّث الـ screen
      lastInitialRef.current = initial
      setScreen(initial)
    } else if (!initial && lastInitialRef.current) {
      // Back button رجّع الـ location state لـ {} — ارجع لـ HOME
      lastInitialRef.current = undefined
      setScreen('HOME')
    }
  }, [initial])

  const handleSetScreen = React.useCallback((s: Screen) => {
    switch (s) {
      case 'HOME':
        // ✅ FIX: بدل ما نرجع لـ Home بـ local state بس (مبيمسحش location.state)،
        // بنعمل navigate فعلي عشان location.state.initialScreen يترجع undefined
        // ولو سبناها زي الأول، BottomNav فاضل شايل آخر initialScreen (زي 'LEARN_PROGRAM')
        // كـ active حتى بعد الرجوع فعليًا للهوم.
        navigate('/', { replace: true })
        break
      case 'ASK_CATEGORIES':
      case 'MENTOR':
        navigate('/ask', { replace: true })
        break
      case 'QIBLA':
        navigate('/tools', { state: { initialScreen: 'QIBLA' }, replace: true })
        break
      case 'PRAYER_TIMES':
        navigate('/tools', { state: { initialScreen: 'PRAYER_TIMES' }, replace: true })
        break
      case 'MOSQUES':
        navigate('/tools', { state: { initialScreen: 'MOSQUES' }, replace: true })
        break
      case 'SETTINGS':
        navigate('/settings', { replace: true })
        break
      case 'MENTOR_CHAT':
        if (chatParams) {
          navigate('/', { state: { initialScreen: 'MENTOR_CHAT', chatParams }, replace: true })
        }
        break
      default:
        // ✅ توحيد التنقل الداخلي: مرّ عبر location.state عشان الـ effect بتاع T-05
        // يحدّث الشاشة والـ BottomNav يضيء التاب الصح (إصلاح B-05/B-06/B-07)
        navigate('/', { state: { initialScreen: s }, replace: true })
    }
  }, [navigate])

  return (
    <>
      {screen === 'HOME' && <Home setScreen={handleSetScreen} />}
      {screen === 'LEARN_PROGRAM' && <LearnProgram setScreen={handleSetScreen} />}
      {screen === 'LEARN_DAY_DETAIL' && <DayDetail setScreen={handleSetScreen} />}
      {screen === 'NOTIFICATIONS' && <Notifications setScreen={handleSetScreen} />}
      {screen === 'FIND_MENTOR' && <FindMentor goBack={() => handleSetScreen('HOME')} />}
      {screen === 'MENTOR_DASHBOARD' && <MentorDashboard goBack={() => handleSetScreen('HOME')} />}
      {screen === 'MENTOR_CHAT' && chatParams && (
        <MentorChat
          requestId={chatParams.requestId}
          otherPersonName={chatParams.otherPersonName}
          goBack={() => { setChatParams(null); handleSetScreen('HOME') }}
        />
      )}
    </>
  )
}
