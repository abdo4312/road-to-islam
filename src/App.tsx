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
import { runStartupSync } from './lib/syncService'

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
    const syncPromise = runStartupSync();

    void supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (error) {
          console.error('Error getting auth session:', error);
          scheduleSplashHide(2500);
          return;
        }

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

  const handleOnboardingComplete = () => {
    localStorage.setItem('has_onboarded_v1', 'true');
    setShowOnboarding(false);
  };

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
      </AuthProvider>
    </QueryClientProvider>
  )
}
