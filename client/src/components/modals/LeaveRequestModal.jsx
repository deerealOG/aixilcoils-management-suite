import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function LeaveRequestModal({ isOpen, onClose, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'ANNUAL',
    startDate: '',
    endDate: '',
    reason: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select start and end dates')
      return
    }

    setIsLoading(true)
    try {
      await api.post('/leave', formData)
      toast.success('Leave request submitted')
      onSuccess?.()
      onClose()
      setFormData({
        type: 'ANNUAL',
        startDate: '',
        endDate: '',
        reason: '',
      })
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit request')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-dark-800 rounded-2xl shadow-xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-600 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Request Leave</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Leave Type */}
          <div>
            <label className="label">Leave Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input"
            >
              <option value="ANNUAL">Annual Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="PERSONAL">Personal Leave</option>
              <option value="MATERNITY">Maternity Leave</option>
              <option value="PATERNITY">Paternity Leave</option>
              <option value="UNPAID">Unpaid Leave</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="label">Reason (optional)</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="input min-h-[80px]"
              placeholder="Reason for leave..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary flex-1">
              {isLoading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
