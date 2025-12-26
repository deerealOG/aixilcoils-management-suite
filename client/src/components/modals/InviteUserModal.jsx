import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function InviteUserModal({ isOpen, onClose, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false)
  const [departments, setDepartments] = useState([])
  const [managers, setManagers] = useState([])
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'MEMBER',
    departmentId: '',
    position: '',
    managerId: '',
  })

  useEffect(() => {
    if (isOpen) {
      fetchDepartments()
      fetchManagers()
    }
  }, [isOpen])

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get('/departments')
      setDepartments(data.data || data)
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    }
  }

  const fetchManagers = async () => {
    try {
      const { data } = await api.get('/users/directory')
      // Filter to OWNER, ADMIN, LEAD as potential managers
      setManagers(data.filter(u => ['OWNER', 'ADMIN', 'LEAD'].includes(u.role)))
    } catch (error) {
      console.error('Failed to fetch managers:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.email || !formData.firstName || !formData.lastName) {
      toast.error('Email, first name, and last name are required')
      return
    }

    setIsLoading(true)
    try {
      await api.post('/users/invite', formData)
      toast.success('Invite sent successfully!')
      onSuccess?.()
      onClose()
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        role: 'MEMBER',
        departmentId: '',
        position: '',
        managerId: '',
      })
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send invite')
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Invite Employee</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="input"
                placeholder="First name"
                required
              />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="input"
                placeholder="Last name"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              placeholder="employee@company.com"
              required
            />
          </div>

          {/* Position */}
          <div>
            <label className="label">Position</label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="input"
              placeholder="e.g., Senior Developer"
            />
          </div>

          {/* Role & Department */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="input"
              >
                <option value="MEMBER">Member</option>
                <option value="LEAD">Lead</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="input"
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Manager */}
          <div>
            <label className="label">Reports To</label>
            <select
              value={formData.managerId}
              onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
              className="input"
            >
              <option value="">Select manager</option>
              {managers.map((mgr) => (
                <option key={mgr.id} value={mgr.id}>
                  {mgr.firstName} {mgr.lastName} ({mgr.position || mgr.role})
                </option>
              ))}
            </select>
          </div>

          {/* Auto-bio preview */}
          {(formData.firstName || formData.lastName) && (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Auto-generated bio:</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                "{formData.firstName} {formData.lastName}
                {formData.position && ` is a ${formData.position}`}
                {formData.departmentId && departments.find(d => d.id === formData.departmentId) && 
                  ` in the ${departments.find(d => d.id === formData.departmentId).name} department`}
                {formData.managerId && managers.find(m => m.id === formData.managerId) &&
                  `, reporting to ${managers.find(m => m.id === formData.managerId).firstName} ${managers.find(m => m.id === formData.managerId).lastName}`}."
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary flex-1">
              {isLoading ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
