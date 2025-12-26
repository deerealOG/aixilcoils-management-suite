import { useState, useEffect } from 'react'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'

export default function CreateDMModal({ isOpen, onClose, onSuccess }) {
  const { user: currentUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
    }
  }, [isOpen])

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users/directory')
      // Filter out current user
      setUsers(data.filter(u => u.id !== currentUser.id))
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleSelectUser = async (userId) => {
    setIsLoading(true)
    try {
      // Check if DM already exists (optional optimization, but backend should handle or we just create/redirect)
      // For now, we attempt to create a new DIRECT channel. 
      // The backend should ideally check if a DIRECT channel with these exact members exists and return it.
      // If not, we create one.
      
      const { data } = await api.post('/channels', {
        name: 'Direct Message', // Backend usually renames DMs dynamically based on members
        type: 'DIRECT',
        isPrivate: true,
        memberIds: [userId]
      })
      
      toast.success('Chat started')
      onSuccess?.(data)
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to start chat')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = users.filter(u => 
    u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-dark-800 rounded-2xl shadow-xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-dark-600 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Message</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-dark-600">
           <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
              placeholder="Search people..."
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredUsers.length === 0 ? (
             <div className="text-center py-8 text-gray-500">
               No users found
             </div>
          ) : (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user.id)}
                disabled={isLoading}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-dark-700 rounded-xl transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold shrink-0">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
