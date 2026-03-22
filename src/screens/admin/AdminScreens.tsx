// src/screens/admin/AdminScreens.tsx
// الـ Router الداخلي للـ Admin — كل صفحات الـ dashboard هنا

import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout    from './AdminLayout'
import AdminDashboard from './AdminDashboard'
import AdminSubjects  from './AdminSubjects'
import AdminLectures  from './AdminLectures'
import AdminUsers, { AdminQuestions } from './AdminUsers'

export default function AdminScreens() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index                   element={<AdminDashboard />} />
        <Route path="subjects"         element={<AdminSubjects />}  />
        <Route path="lectures"         element={<AdminLectures />}  />
        <Route path="users"            element={<AdminUsers />}     />
        <Route path="questions"        element={<AdminQuestions />} />
        <Route path="*"                element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  )
}


// ══════════════════════════════════════════════════════════════
// src/App.tsx  (النسخة المحدثة مع Admin)
// ══════════════════════════════════════════════════════════════

/*
// استبدل src/App.tsx بالكود ده:

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import AuthScreens  from './screens/AuthScreens'
import MainScreens  from './screens/MainScreens'
import Settings     from './screens/Settings'
import AskScreens   from './screens/AskScreens'
import ToolsScreens from './screens/ToolsScreens'
import AdminScreens from './screens/admin/AdminScreens'   // ← جديد

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
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthScreens />} />

            <Route path="/" element={<ProtectedRoute><MainScreens /></ProtectedRoute>} />
            <Route path="/ask" element={<ProtectedRoute><AskScreens /></ProtectedRoute>} />
            <Route path="/tools" element={<ProtectedRoute><ToolsScreens /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            // ↓ Admin — يحتاج role = 'admin'
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
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
*/
