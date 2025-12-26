import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { CameraIcon, PencilIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../services/api'

export default function Profile() {
  const { user, updateUser } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    position: user?.position || '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.put(`/users/${user.id}`, formData)
      updateUser(data)
      setIsEditing(false)
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card overflow-hidden">
        <div className="h-32 gradient-bg" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-white dark:bg-dark-700 border-4 border-white dark:border-dark-700 shadow-lg flex items-center justify-center text-3xl font-bold gradient-text">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-lg hover:bg-primary-700">
                <CameraIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">{user?.position || 'No position set'}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="badge-primary">{user?.role?.replace('_', ' ')}</span>
                {user?.department && <span className="text-sm text-gray-500">{user.department.name}</span>}
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-outline"
            >
              <PencilIcon className="w-4 h-4 mr-2" />
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Profile Information</h2>
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Position</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <button type="button" onClick={() => setIsEditing(false)} className="btn-ghost">Cancel</button>
              <button type="submit" className="btn-primary">Save Changes</button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{user?.phone || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Department</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{user?.department?.name || 'Not assigned'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manager</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {user?.manager ? `${user.manager.firstName} ${user.manager.lastName}` : 'None'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Last Login</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
