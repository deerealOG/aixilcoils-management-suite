import { useEffect, useState } from 'react'
import api from '../../services/api'
import {
  UsersIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

export default function ManagerDashboard() {
  const [teamMembers, setTeamMembers] = useState([])
  const [myProjects, setMyProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchManagerData()
  }, [])

  const fetchManagerData = async () => {
    try {
      // Assuming existing endpoints can filter by manager/lead
      // For now fetching directory and filtering client-side for "my team" simulation or using subordinates endpoint
      // Adjust endpoint based on actual backend capabilities for "my subordinates"
      // Using user.id to fetch subordinates
      const userRes = await api.get('/auth/me') 
      const userId = userRes.data.id
      
      const [teamRes, projectsRes] = await Promise.all([
        api.get(`/users/${userId}/subordinates`), // Need to ensure this endpoint exists or similar
        api.get('/projects?status=ACTIVE'), // Ideally filter by managerId if backend supported
      ])
      
      setTeamMembers(teamRes.data)
      setMyProjects(projectsRes.data.data.filter(p => p.managerId === userId)) // Filter client side for now if needed

    } catch (error) {
      console.error('Failed to fetch manager data:', error)
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
          {getGreeting()}, Manager.
        </h1>
        <p className="text-gray-500 dark:text-gray-400">You have {stats?.recentActions?.length || 0} items pending review.</p>
      </div>

        {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                <UsersIcon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Team Members</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{teamMembers.length}</p>
            </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                <ClipboardDocumentListIcon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Managed Projects</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{myProjects.length}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team List */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">My Team</h2>
            <div className="space-y-3">
                {teamMembers.length === 0 ? (
                    <p className="text-gray-500">No direct reports found.</p>
                ) : (
                    teamMembers.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-dark-700">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
                                    {member.firstName[0]}{member.lastName[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{member.firstName} {member.lastName}</p>
                                    <p className="text-xs text-gray-500">{member.position}</p>
                                </div>
                             </div>
                             <span className={`badge text-xs ${member.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>{member.status}</span>
                        </div>
                    ))
                )}
            </div>
          </div>

          {/* Managed Projects */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">My Projects</h2>
             <div className="space-y-3">
                 {myProjects.length === 0 ? (
                    <p className="text-gray-500">No active projects managed.</p>
                 ) : (
                    myProjects.map(project => (
                        <div key={project.id} className="p-3 rounded-lg bg-white border border-gray-200 dark:bg-dark-700 dark:border-dark-600">
                            <h3 className="font-medium text-gray-900 dark:text-white">{project.name}</h3>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-xs text-gray-500">Due: {new Date(project.dueDate).toLocaleDateString()}</span>
                                <span className="badge badge-primary text-xs">{project.status}</span>
                            </div>
                        </div>
                    ))
                 )}
             </div>
          </div>
      </div>
    </div>
  )
}
