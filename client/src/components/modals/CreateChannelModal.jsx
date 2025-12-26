import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function CreateChannelModal({ isOpen, onClose, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'GROUP', // GROUP, DEPARTMENT, ANNOUNCEMENT
    isPrivate: false,
    memberIds: [],
  })

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
    }
  }, [isOpen])

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users/directory')
      setUsers(data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Channel name is required')
      return
    }

    setIsLoading(true)
    try {
      await api.post('/channels', formData)
      toast.success('Channel created successfully')
      onSuccess?.()
      onClose()
      setFormData({
        name: '',
        description: '',
        type: 'GROUP',
        isPrivate: false,
        memberIds: [],
      })
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create channel')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMember = (userId) => {
    setFormData(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(userId)
        ? prev.memberIds.filter(id => id !== userId)
        : [...prev.memberIds, userId]
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-dark-800 rounded-2xl shadow-xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white dark:bg-dark-800 px-6 py-4 border-b border-gray-200 dark:border-dark-600 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Channel</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="label">Channel Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="# channel-name"
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
              placeholder="What's this channel about?"
              rows={2}
            />
          </div>

          {/* Privacy */}
          <div>
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-dark-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
              <input
                type="checkbox"
                checked={formData.isPrivate}
                onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-primary-600"
              />
              <div>
                <span className="block font-medium text-gray-900 dark:text-white">Private Channel</span>
                <span className="block text-sm text-gray-500">Only invited members can view and join</span>
              </div>
            </label>
          </div>

          {/* Members */}
          <div>
            <label className="label">Add Members</label>
            <div className="border border-gray-200 dark:border-dark-600 rounded-xl max-h-48 overflow-auto">
              {users.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-dark-700 cursor-pointer border-b border-gray-100 dark:border-dark-600 last:border-0"
                >
                  <input
                    type="checkbox"
                    checked={formData.memberIds.includes(user.id)}
                    onChange={() => toggleMember(user.id)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600"
                  />
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-medium text-primary-600">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {formData.memberIds.length} members selected
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary flex-1">
              {isLoading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
