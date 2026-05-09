import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'

import AuthScreens from './screens/AuthScreens'
import MainScreens from './screens/MainScreens'
import Settings from './screens/Settings'
import AskScreens from './screens/AskScreens'
import ToolsScreens from './screens/ToolsScreens'
import AdminScreens from './screens/admin/AdminScreens'

import { SplashLoader } from './components/SplashLoader'
import { Onboarding } from './components/Onboarding'
import { supabase } from './lib/supabase'
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import {
  scheduleAdhanFromCache,
  updateCountdownNotification,
  stopCountdownNotification,
  syncPrayersToNative,
  getPrayerTimingsFromCache,
  stopAdhan,
} from './lib/adhanService';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PrayerAlarm } from './plugins/PrayerAlarm';
import { runStartupSync } from './lib/syncService'
import { adhanPlayer } from './lib/adhanPlayer';
import { AdhanOverlay } from './components/AdhanOverlay';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [adhanVisible, setAdhanVisible] = useState(false);
  const [adhanPrayerNameAr, setAdhanPrayerNameAr] = useState('');

  useEffect(() => {
    const startedAt = Date.now();
    let isCancelled = false;
    let isSplashHandled = false;
    let sessionBasedTimer: number | null = null;

    const showOnboardingIfNeeded = () => {
      const hasOnboarded = localStorage.getItem('has_onboarded_v1');
      if (!hasOnboarded) {
        setShowOnboarding(true);
      }
    };

    const finishSplash = () => {
      if (isCancelled || isSplashHandled) return;
      isSplashHandled = true;
      setShowSplash(false);
      showOnboardingIfNeeded();
    };

    const scheduleSplashHide = (targetMs: number) => {
      if (isCancelled || isSplashHandled) return;

      const cappedTarget = Math.min(targetMs, 2500);
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, cappedTarget - elapsed);

      if (sessionBasedTimer !== null) {
        clearTimeout(sessionBasedTimer);
      }

      sessionBasedTimer = window.setTimeout(() => {
        if (maxSplashTimer !== null) {
          clearTimeout(maxSplashTimer);
        }
        finishSplash();
      }, remaining);
    };

    const maxSplashTimer = window.setTimeout(() => {
      finishSplash();
    }, 2500);

    // ── Sync + session check بالتوازي ─────────────────────────
    void supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (error) {
          console.error('Error getting auth session:', error);
          scheduleSplashHide(2500);
          return;
        }

        // بدأ الـ sync مع تمرير الـ session المعروف — بدون call تانية
        const syncPromise = runStartupSync(data.session);

        if (data.session) {
          // مسجّل — انتظر الـ sync يخلص أو 1.5 ثانية
          await Promise.race([
            syncPromise,
            new Promise(resolve => setTimeout(resolve, 1500)),
          ]);
          scheduleSplashHide(500);
        } else {
          // مش مسجّل — 2.5 ثانية splash عادي
          scheduleSplashHide(2500);
        }
      })
      .catch((sessionError) => {
        console.error('Session check failed:', sessionError);
        scheduleSplashHide(2500);
      });

    return () => {
      isCancelled = true;
      clearTimeout(maxSplashTimer);
      if (sessionBasedTimer !== null) {
        clearTimeout(sessionBasedTimer);
      }
    };
  }, []);

  // ── جدولة الأذان والـ countdown عند بدء التطبيق وعند الرجوع من الخلفية ──
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // جدول عند أول فتح
    void scheduleAdhanFromCache();
    const cached = getPrayerTimingsFromCache();
    if (cached) {
      void syncPrayersToNative(cached); // هو بيشغّل الـ countdown في الآخر
    } else {
      void updateCountdownNotification(); // Fallback لو مفيش كاش
    }

    // جدول مجدداً عند الرجوع من الخلفية
    let removeListener: (() => void) | null = null;
    CapApp.addListener('resume', async () => {
      await scheduleAdhanFromCache();
      const cached = getPrayerTimingsFromCache();
      if (cached) {
        await syncPrayersToNative(cached);
      } else {
        await updateCountdownNotification();
      }
    }).then(listener => {
      removeListener = () => listener.remove();
    });

    return () => {
      if (removeListener) removeListener();
    };
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('has_onboarded_v1', 'true');
    setShowOnboarding(false);
  };

  // ── LocalNotifications listener — يشغّل الأذان Native عند وصول إشعار الأذان ──
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // لما التطبيق في الـ foreground ويجي notification أذان
    const receivedSub = LocalNotifications.addListener(
      'localNotificationReceived',
      async (notification) => {
        const extra = notification.extra as Record<string, string> | undefined;
        if (extra?.type === 'adhan' && extra?.shouldPlayAdhan === 'true') {
          try {
            await PrayerAlarm.playAdhan({
              muezzin: extra.muezzin || 'makkah',
              prayerName: extra.prayerName || '',
              prayerNameAr: extra.prayerNameAr || '',
            });
            // أظهر الـ overlay
            setAdhanPrayerNameAr(extra.prayerNameAr || '');
            setAdhanVisible(true);
          } catch (err) {
            console.warn('PrayerAlarm.playAdhan failed, falling back to web audio:', err);
            // Fallback للـ web audio player
            adhanPlayer.reloadForNewMuezzin();
          }
        }
      }
    );

    // لما المستخدم يضغط على الـ notification
    const actionSub = LocalNotifications.addListener(
      'localNotificationActionPerformed',
      async (action) => {
        const extra = action.notification.extra as Record<string, string> | undefined;
        if (extra?.type === 'adhan') {
          // وقّف الأذان Native
          try { await stopAdhan(); } catch { /* ignore */ }
          // وقّف الـ web audio
          adhanPlayer.stopAudio();
          setAdhanVisible(false);
        }
      }
    );

    return () => {
      receivedSub.then(l => l.remove());
      actionSub.then(l => l.remove());
    };
  }, []);

  // ── Start the global adhan player on app mount ──────────────────────
  useEffect(() => {
    adhanPlayer.start();

    const unsubAdhan = adhanPlayer.onAdhan(({ prayerNameAr }) => {
      // على Android: localNotificationReceived بيتولى تشغيل الأذان والـ overlay
      // عبر PrayerAlarm.playAdhan() — نتجنب التشغيل المزدوج هنا
      if (Capacitor.isNativePlatform()) return;
      setAdhanPrayerNameAr(prayerNameAr);
      setAdhanVisible(true);
    });

    // Reload audio on muezzin change (storage event from MuezzinSelector)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'selected_muezzin') {
        adhanPlayer.reloadForNewMuezzin();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubAdhan();
      window.removeEventListener('storage', handleStorage);
      adhanPlayer.destroy();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AnimatePresence mode="wait">
          {showSplash && <SplashLoader key="splash" />}
          {showOnboarding && <Onboarding key="onboarding" onComplete={handleOnboardingComplete} />}
        </AnimatePresence>

        {!showSplash && !showOnboarding && (
          <HashRouter>
            <Routes>
              <Route path="/auth" element={<AuthScreens />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout><MainScreens /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ask"
                element={
                  <ProtectedRoute>
                    <AppLayout><AskScreens /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tools"
                element={
                  <ProtectedRoute>
                    <AppLayout><ToolsScreens /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <AppLayout><Settings /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <AdminRoute>
                    <AdminScreens />
                  </AdminRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
        )}
        {/* Global Adhan Overlay — appears on top of everything */}
        <AdhanOverlay
          isVisible={adhanVisible}
          prayerNameAr={adhanPrayerNameAr}
          onDismiss={() => setAdhanVisible(false)}
        />
      </AuthProvider>
    </QueryClientProvider>
  )
}
