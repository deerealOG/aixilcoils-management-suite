import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function CreateTaskModal({ isOpen, onClose, onSuccess, projectId }) {
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [projects, setProjects] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeId: '',
    projectId: projectId || '',
    priority: 'MEDIUM',
    status: 'TODO',
    dueDate: '',
  })

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
      if (!projectId) fetchProjects()
    }
  }, [isOpen, projectId])

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users/directory')
      setUsers(data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects')
      setProjects(data.data || data)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title) {
      toast.error('Task title is required')
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
      }
      await api.post('/tasks', payload)
      toast.success('Task created successfully')
      onSuccess?.()
      onClose()
      setFormData({
        title: '',
        description: '',
        assigneeId: '',
        projectId: projectId || '',
        priority: 'MEDIUM',
        status: 'TODO',
        dueDate: '',
      })
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create task')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-dark-800 rounded-2xl shadow-xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white dark:bg-dark-800 px-6 py-4 border-b border-gray-200 dark:border-dark-600 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Task</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="label">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              placeholder="Task title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[80px]"
              placeholder="Task description..."
              rows={3}
            />
          </div>

          {/* Project (if not passed) */}
          {!projectId && (
            <div>
              <label className="label">Project</label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="input"
              >
                <option value="">No project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Assignee & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Assignee</label>
              <select
                value={formData.assigneeId}
                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                className="input"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="input"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="label">Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="input"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary flex-1">
              {isLoading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
