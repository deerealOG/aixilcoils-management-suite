import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

/**
 * Role-based route protection
 * Blocks deep-link access to pages outside user's permissions
 */
export default function RoleProtectedRoute({ children, allowedRoles }) {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect unauthorized users to dashboard
    return <Navigate to="/" replace />
  }

  return children
}
