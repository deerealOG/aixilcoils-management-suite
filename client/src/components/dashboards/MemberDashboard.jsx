import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import {
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  PlayCircleIcon
} from '@heroicons/react/24/outline'

export default function MemberDashboard() {
  const [tasks, setTasks] = useState([])
  const [attendance, setAttendance] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetchMemberData()
  }, [])

  const fetchMemberData = async () => {
    try {
      // Parallel fetch for speed
      const [tasksRes, authRes] = await Promise.all([
        api.get('/tasks/my-tasks?status=TODO,IN_PROGRESS&limit=5'),
        api.get('/auth/me')
      ])
      
      setTasks(tasksRes.data)
      setUser(authRes.data)
      
      // Fetch today's attendance specifically if endpoint allows, or imply from login
      // For now, simpler implementation
    } catch (error) {
      console.error('Failed to fetch member data:', error)
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

  const todoCount = tasks.filter(t => t.status === 'TODO').length
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length

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
          {getGreeting()}, {user?.firstName}.
        </h1>
        <p className="text-gray-500 dark:text-gray-400">Here are your active tasks and recent activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="card p-6 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                    <ClipboardDocumentCheckIcon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">To Do</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{todoCount}</p>
                </div>
            </div>
        </div>

        <div className="card p-6 bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600">
                    <PlayCircleIcon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{inProgressCount}</p>
                </div>
            </div>
        </div>

        <div className="card p-6 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30">
             <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                    <ClockIcon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Status</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">Active Now</p>
                </div>
            </div>
        </div>
      </div>

      {/* My Tasks List */}
      <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">My Tasks</h2>
            <Link to="/tasks" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View All</Link>
          </div>
          
          <div className="space-y-3">
              {tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                      <CheckCircleIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>You're all caught up! No active tasks.</p>
                  </div>
              ) : (
                  tasks.map(task => (
                      <div key={task.id} className="group p-4 rounded-xl bg-gray-50 dark:bg-dark-700 hover:bg-white dark:hover:bg-dark-600 hover:shadow-md transition-all border border-transparent hover:border-gray-200 dark:hover:border-dark-500">
                          <div className="flex items-start gap-4">
                              <button className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  task.status === 'COMPLETED' ? 'bg-success-500 border-success-500 text-white' : 'border-gray-400 hover:border-primary-500'
                              }`}>
                                  {task.status === 'COMPLETED' && <CheckCircleIcon className="w-4 h-4" />}
                              </button>
                              <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">{task.title}</h3>
                                  <p className="text-sm text-gray-500 truncate">{task.project?.name || 'No Project'}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                  <span className={`badge text-xs px-2 py-1 ${
                                      task.priority === 'URGENT' ? 'badge-danger' : 
                                      task.priority === 'HIGH' ? 'badge-warning' : 'badge-primary'
                                  }`}>
                                      {task.priority}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Due Date'}
                                  </span>
                              </div>
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>
    </div>
  )
}
