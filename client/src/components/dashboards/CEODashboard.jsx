import { useEffect, useState } from 'react'
import api from '../../services/api'
import {
  UsersIcon,
  FolderIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

export default function CEODashboard() {
  const [stats, setStats] = useState(null)
  const [activeProjects, setActiveProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, projectsRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/projects?status=ACTIVE&limit=5'),
      ])
      setStats(analyticsRes.data)
      setActiveProjects(projectsRes.data.data || projectsRes.data)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  const statCards = [
    { name: 'Total Employees', value: stats?.overview?.userCount || 0, icon: UsersIcon, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { name: 'Active Projects', value: stats?.overview?.projectCount || 0, icon: FolderIcon, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { name: 'Total Tasks', value: stats?.overview?.taskCount || 0, icon: ClipboardDocumentListIcon, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { name: 'Departments', value: stats?.overview?.departmentCount || 0, icon: ChartBarIcon, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  ]

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {getGreeting()}, Chief.
        </h1>
        <p className="text-gray-500 dark:text-gray-400">Here's your executive overview for today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="card p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active Projects Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Active Projects</h2>
          </div>
          <div className="space-y-4">
            {activeProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-dark-700">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${
                    project.status === 'ACTIVE' ? 'bg-primary-500' : 'bg-gray-400'
                  }`}>
                    {project.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{project.name}</h3>
                    <p className="text-xs text-gray-500">{project.department?.name || 'No Dept'}</p>
                  </div>
                </div>
                <div className="text-right">
                   <span className="badge badge-primary text-xs">{project.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

         {/* System Health / Alerts */}
         <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">System Alerts</h2>
          <div className="space-y-3">
             <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-lg flex gap-3 text-sm text-yellow-800 dark:text-yellow-200">
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                <p>3 projects are approaching deadline this week.</p>
             </div>
             {/* Add more alerts here based on logic */}
             <div className="p-3 bg-gray-50 dark:bg-dark-700 rounded-lg text-sm text-gray-500 text-center">
                System running smoothly. All services operational.
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
