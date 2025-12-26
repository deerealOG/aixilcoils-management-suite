import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { ArrowLeftIcon, PlusIcon, EllipsisVerticalIcon, CheckCircleIcon, XCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import ProjectActionModal from '../components/modals/ProjectActionModal'

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [actionModalState, setActionModalState] = useState({ isOpen: false, type: 'QUERY' })

  useEffect(() => {
    fetchProject()
    fetchTasks()
  }, [id])

  const fetchProject = async () => {
    try {
      const { data } = await api.get(`/projects/${id}`)
      setProject(data)
    } catch (error) {
      console.error('Failed to fetch project:', error)
    }
  }

  const fetchTasks = async () => {
    try {
      const { data } = await api.get(`/tasks/kanban/${id}`)
      setTasks(data)
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const openActionModal = (type) => {
      setActionModalState({ isOpen: true, type })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLANNING': return 'badge bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
      case 'ACTIVE': return 'badge-primary'
      case 'ON_HOLD': return 'badge-warning'
      case 'COMPLETED': return 'badge-success'
      case 'CANCELLED': return 'badge-danger'
      default: return 'badge bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return 'bg-danger-500'
      case 'HIGH': return 'bg-warning-500'
      case 'MEDIUM': return 'bg-primary-500'
      case 'LOW': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const isCEO = ['OWNER', 'ADMIN'].includes(user?.role)
  const isManager = ['LEAD'].includes(user?.role)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Project not found</h2>
        <Link to="/projects" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to projects
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
            <Link to="/projects" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600">
            <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{project.name}</h1>
                    <span className={getStatusColor(project.status)}>{project.status}</span>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3 max-w-md">
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500 font-medium">Project Progress</span>
                        <span className="text-primary-600 font-bold">
                            {Math.round(((project.taskStats?.completed || 0) / (project.taskStats?.total || 1)) * 100)}%
                        </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-primary-600 transition-all duration-500 ease-out shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                            style={{ width: `${((project.taskStats?.completed || 0) / (project.taskStats?.total || 1)) * 100}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* CEO Actions: Cancel or Query */}
          {isCEO && (
            <>
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm rounded-lg border border-blue-100 dark:border-blue-800">
                    <ExclamationCircleIcon className="w-4 h-4" />
                    <span>Query: {project.manager?.firstName || 'Project Lead'}</span>
                </div>
                {project.status !== 'CANCELLED' && project.status !== 'COMPLETED' && (
                     <button onClick={() => openActionModal('CANCEL')} className="btn-danger text-sm">
                        <XCircleIcon className="w-5 h-5 mr-2" />
                        Cancel
                     </button>
                )}
            </>
          )}

          {/* Manager Actions: Mark Complete */}
          {(isManager || isCEO) && project.status !== 'COMPLETED' && project.status !== 'CANCELLED' && (
            <button onClick={() => openActionModal('COMPLETE')} className="btn-secondary text-sm text-green-700 bg-green-50 hover:bg-green-100 border-green-200">
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              Complete
            </button>
          )}

          {/* Add Task - Available to Managers/Leads, not typically users directly unless assigned */}
          {(isManager || isCEO) && (
             <button onClick={() => setShowTaskModal(true)} className="btn-primary text-sm whitespace-nowrap">
                <PlusIcon className="w-4 h-4 mr-2" />
                Task
            </button>
          )}
        </div>
      </div>

      {/* Query Note for CEO */}
      {isCEO && (
          <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg flex items-center justify-between">
              <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Project Oversight</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                      Managed by <span className="text-gray-900 dark:text-white font-medium">{project.manager?.firstName} {project.manager?.lastName}</span>
                  </p>
              </div>
              <button 
                onClick={() => openActionModal('QUERY')}
                className="btn-secondary text-sm"
              >
                  Send Query
              </button>
          </div>
      )}

      {/* Project stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {project.taskStats && Object.entries(project.taskStats).map(([key, value]) => (
          <div key={key} className="card p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{key.replace('_', ' ')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-80">
            <div className="card">
              {/* Column header */}
              <div className="p-4 border-b border-gray-200 dark:border-dark-600">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${column.color}`} />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{column.title}</h3>
                  <span className="ml-auto text-sm text-gray-500 bg-gray-100 dark:bg-dark-600 px-2 py-0.5 rounded-full">
                    {tasks[column.id]?.length || 0}
                  </span>
                </div>
              </div>

              {/* Tasks */}
              <div className="p-2 space-y-2 min-h-[200px]">
                {tasks[column.id]?.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 bg-gray-50 dark:bg-dark-600 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                      <button className="p-1 hover:bg-gray-200 dark:hover:bg-dark-500 rounded">
                        <EllipsisVerticalIcon className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      {task.assignee && (
                        <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-medium text-primary-600 dark:text-primary-400">
                          {task.assignee.firstName[0]}{task.assignee.lastName[0]}
                        </div>
                      )}
                      {task._count && (
                        <div className="flex gap-2 text-xs text-gray-500">
                          {task._count.subTasks > 0 && <span>📋 {task._count.subTasks}</span>}
                          {task._count.comments > 0 && <span>💬 {task._count.comments}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {(!tasks[column.id] || tasks[column.id].length === 0) && (
                  <div className="p-4 text-center text-gray-400 dark:text-gray-500 text-sm">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSuccess={fetchTasks}
        projectId={id}
      />

      <ProjectActionModal 
        isOpen={actionModalState.isOpen}
        onClose={() => setActionModalState({ ...actionModalState, isOpen: false })}
        type={actionModalState.type}
        projectId={id}
        onSuccess={fetchProject}
      />
    </div>
  )
}

