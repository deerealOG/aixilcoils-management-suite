import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { PlusIcon, FunnelIcon, MagnifyingGlassIcon, FolderIcon } from '@heroicons/react/24/outline'
import CreateProjectModal from '../components/modals/CreateProjectModal'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [statusFilter])

  const fetchProjects = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (searchQuery) params.append('search', searchQuery)
      
      const { data } = await api.get(`/projects?${params}`)
      setProjects(data.data)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLANNING': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
      case 'IN_PROGRESS': return 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
      case 'ON_HOLD': return 'bg-warning-50 text-warning-600 dark:bg-warning-500/20 dark:text-warning-500'
      case 'COMPLETED': return 'bg-success-50 text-success-600 dark:bg-success-500/20 dark:text-success-500'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return 'border-danger-500'
      case 'HIGH': return 'border-warning-500'
      case 'MEDIUM': return 'border-primary-500'
      case 'LOW': return 'border-gray-300'
      default: return 'border-gray-200'
    }
  }

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Projects</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage and track all your projects</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchProjects()}
            placeholder="Search projects..."
            className="input pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="">All Status</option>
          <option value="PLANNING">Planning</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No projects found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Get started by creating your first project</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className={`card-hover p-6 border-l-4 ${getPriorityColor(project.priority)}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-white font-bold">
                  {project.name[0]}
                </div>
                <span className={`badge ${getStatusColor(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{project.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                {project.description || 'No description'}
              </p>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500 dark:text-gray-400">Progress</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{project.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-dark-600 rounded-full overflow-hidden">
                  <div 
                    className="h-full gradient-bg rounded-full transition-all duration-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {project.members?.slice(0, 4).map((member) => (
                    <div 
                      key={member.id}
                      className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 border-2 border-white dark:border-dark-700 flex items-center justify-center text-xs font-medium text-primary-600 dark:text-primary-400"
                      title={`${member.user.firstName} ${member.user.lastName}`}
                    >
                      {member.user.firstName[0]}{member.user.lastName[0]}
                    </div>
                  ))}
                  {project._count?.members > 4 && (
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-dark-600 border-2 border-white dark:border-dark-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                      +{project._count.members - 4}
                    </div>
                  )}
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {project._count?.tasks || 0} tasks
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchProjects}
      />
    </div>
  )
}
