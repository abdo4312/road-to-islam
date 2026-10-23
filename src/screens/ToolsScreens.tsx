import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Screen } from '../types';
import { Qibla } from './QiblaScreen';
import { PrayerTimes } from './PrayerTimesScreen';
import { Mosques } from './MosquesScreen';

// ─────────────────────────────────────────────────────────────
// Router — FIX: location.key بدل initial كـ dependency
// ─────────────────────────────────────────────────────────────
export default function ToolsScreens() {
  const location = useLocation();
  const initial = (location.state as any)?.initialScreen as Screen | undefined;

  const [screen, setScreen] = useState<Screen>(initial ?? 'PRAYER_TIMES');

  // ✅ FIX: location.key بيتغير في كل navigate حتى لو نفس الـ route
  // ده بيحل مشكلة إن لما تضغط Qibla وانت أصلاً في /tools ما بيتحدثش
  useEffect(() => {
    if (initial) setScreen(initial);
  }, [location.key]); // ← الـ fix الرئيسي هنا

  return (
    <>
      {screen === 'QIBLA' && <Qibla setScreen={setScreen} />}
      {screen === 'PRAYER_TIMES' && <PrayerTimes setScreen={setScreen} />}
      {screen === 'MOSQUES' && <Mosques setScreen={setScreen} />}
      {screen === 'HOME' && <Navigate to="/" replace />}
    </>
  );
}
