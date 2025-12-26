import { useAuthStore } from '../store/authStore'
import CEODashboard from '../components/dashboards/CEODashboard'
import ManagerDashboard from '../components/dashboards/ManagerDashboard'
import MemberDashboard from '../components/dashboards/MemberDashboard'

export default function Dashboard() {
  const { user } = useAuthStore()

  if (!user) return null

  // Route to appropriate dashboard based on role
  if (['OWNER', 'ADMIN'].includes(user.role)) {
    return <CEODashboard />
  }

  if (['LEAD'].includes(user.role)) {
    return <ManagerDashboard />
  }

  // Default for MEMBER, GUEST, etc.
  return <MemberDashboard />
}
