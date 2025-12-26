import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import Layout from './components/layout/Layout'
import RoleProtectedRoute from './components/layout/RoleProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import HR from './pages/HR'
import Performance from './pages/Performance'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import Onboarding from './pages/Onboarding'
import OnboardingAdmin from './pages/OnboardingAdmin'
import Timesheet from './pages/Timesheet'
import Tasks from './pages/Tasks'
import Expenses from './pages/Expenses'
import EmployeeProfile from './pages/EmployeeProfile'
import Chat from './pages/Chat'

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-800">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  // Redirect to onboarding if user hasn't completed it
  // For HashRouter compatibility, we check both pathname and hash
  const isAtOnboarding = window.location.hash.includes('/onboarding') || window.location.pathname === '/onboarding'
  
  if (user && !user.onboardingCompleted && !isAtOnboarding) {
    return <Navigate to="/onboarding" replace />
  }
  
  return children
}

// Onboarding Route wrapper
const OnboardingRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-800">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

function App() {
  const { checkAuth, isDarkMode } = useAuthStore()
  
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/onboarding" element={
        <OnboardingRoute>
          <Onboarding />
        </OnboardingRoute>
      } />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="chat" element={<Chat />} />
        <Route path="timesheet" element={<Timesheet />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="performance" element={<Performance />} />
        <Route path="profile" element={<Profile />} />
        <Route path="employees/:id" element={<EmployeeProfile />} />
        
        {/* Role-protected routes */}
        <Route path="hr" element={
          <RoleProtectedRoute allowedRoles={['OWNER', 'ADMIN', 'LEAD']}>
            <HR />
          </RoleProtectedRoute>
        } />
        <Route path="hr/onboarding" element={
          <RoleProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
            <OnboardingAdmin />
          </RoleProtectedRoute>
        } />
        <Route path="settings" element={
          <RoleProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
            <Settings />
          </RoleProtectedRoute>
        } />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
