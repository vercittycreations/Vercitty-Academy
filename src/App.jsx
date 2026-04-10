import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Login          from './pages/Login'
import Dashboard      from './pages/Dashboard'
import CoursePage     from './pages/CoursePage'
import ProgressReport from './pages/ProgressReport'
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageUsers    from './pages/admin/ManageUsers'
import ManageCourses  from './pages/admin/ManageCourses'
import ManageLessons  from './pages/admin/ManageLessons'
import AssignCourses  from './pages/admin/AssignCourses'
import QuestionBank   from './pages/admin/QuestionBank'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader />
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <Loader />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <Loader />
  if (user) return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />
  return children
}

function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-dark-400 text-sm font-body">Loading Vercitty Academy...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/course/:courseId" element={<PrivateRoute><CoursePage /></PrivateRoute>} />
        <Route path="/report" element={<PrivateRoute><ProgressReport /></PrivateRoute>} />

        <Route path="/admin"                           element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users"                     element={<AdminRoute><ManageUsers /></AdminRoute>} />
        <Route path="/admin/courses"                   element={<AdminRoute><ManageCourses /></AdminRoute>} />
        <Route path="/admin/courses/:courseId/lessons" element={<AdminRoute><ManageLessons /></AdminRoute>} />
        <Route path="/admin/assign"                    element={<AdminRoute><AssignCourses /></AdminRoute>} />
        <Route path="/admin/questions"                 element={<AdminRoute><QuestionBank /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}