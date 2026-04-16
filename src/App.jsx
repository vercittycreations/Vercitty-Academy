import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Login              from './pages/Login'
import Dashboard          from './pages/Dashboard'
import CoursePage         from './pages/CoursePage'
import ProgressReport     from './pages/ProgressReport'
import AssignmentPage     from './pages/AssignmentPage'
import AdminDashboard     from './pages/admin/AdminDashboard'
import ManageUsers        from './pages/admin/ManageUsers'
import ManageCourses      from './pages/admin/ManageCourses'
import ManageLessons      from './pages/admin/ManageLessons'
import AssignCourses      from './pages/admin/AssignCourses'
import QuestionBank       from './pages/admin/QuestionBank'
import ProgressDashboard  from './pages/admin/ProgressDashboard'
import ActivityFeed       from './pages/admin/ActivityFeed'
import StudentLoginHistory from './pages/admin/StudentLoginHistory'
import ManageBatches      from './pages/admin/ManageBatches'
import ManageAnnouncements from './pages/admin/ManageAnnouncements'
import SubmissionsAdmin   from './pages/admin/SubmissionsAdmin'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader />
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <Loader />
  if (!user)    return <Navigate to="/login"     replace />
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
        <p className="text-dark-400 text-sm font-body">Loading EduCrek Academy...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

        <Route path="/dashboard"        element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/course/:courseId" element={<PrivateRoute><CoursePage /></PrivateRoute>} />
        <Route path="/report"           element={<PrivateRoute><ProgressReport /></PrivateRoute>} />
        <Route path="/assignments"      element={<PrivateRoute><AssignmentPage /></PrivateRoute>} />

        <Route path="/admin"                           element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users"                     element={<AdminRoute><ManageUsers /></AdminRoute>} />
        <Route path="/admin/courses"                   element={<AdminRoute><ManageCourses /></AdminRoute>} />
        <Route path="/admin/courses/:courseId/lessons" element={<AdminRoute><ManageLessons /></AdminRoute>} />
        <Route path="/admin/assign"                    element={<AdminRoute><AssignCourses /></AdminRoute>} />
        <Route path="/admin/questions"                 element={<AdminRoute><QuestionBank /></AdminRoute>} />
        <Route path="/admin/progress"                  element={<AdminRoute><ProgressDashboard /></AdminRoute>} />
        <Route path="/admin/activity"                  element={<AdminRoute><ActivityFeed /></AdminRoute>} />
        <Route path="/admin/logins"                    element={<AdminRoute><StudentLoginHistory /></AdminRoute>} />
        <Route path="/admin/batches"                   element={<AdminRoute><ManageBatches /></AdminRoute>} />
        <Route path="/admin/announcements"             element={<AdminRoute><ManageAnnouncements /></AdminRoute>} />
        <Route path="/admin/submissions"               element={<AdminRoute><SubmissionsAdmin /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}