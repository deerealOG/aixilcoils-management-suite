import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import CreateTaskModal from '../components/modals/CreateTaskModal'

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [filter])

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('status', filter)
      const { data } = await api.get(`/tasks/my-tasks?${params}`)
      setTasks(data)
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="w-5 h-5 text-success-500" />
      case 'IN_PROGRESS':
        return <ClockIcon className="w-5 h-5 text-primary-500" />
      case 'BLOCKED':
        return <ExclamationCircleIcon className="w-5 h-5 text-danger-500" />
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return 'bg-danger-100 text-danger-700 dark:bg-danger-500/20 dark:text-danger-400'
      case 'HIGH': return 'bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400'
      case 'MEDIUM': return 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
      case 'LOW': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
          <p className="text-gray-500 dark:text-gray-400">Track and manage your assigned tasks</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'TODO', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="card p-12 text-center">
          <ClockIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No tasks found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first task to get started</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <PlusIcon className="w-5 h-5 mr-2" />
            New Task
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <Link
              key={task.id}
              to={task.projectId ? `/projects/${task.projectId}` : '#'}
              className="card-hover p-4 flex items-center gap-4"
            >
              {getStatusIcon(task.status)}
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{task.title}</h3>
                {task.project && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{task.project.name}</p>
                )}
              </div>

              <span className={`badge ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>

              {task.dueDate && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Due {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchTasks}
      />
    </div>
  )
}

