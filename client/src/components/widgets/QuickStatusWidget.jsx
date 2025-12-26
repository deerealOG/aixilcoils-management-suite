import { useEffect, useState } from 'react'
import api from '../../services/api'
import {
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  BellIcon,
  ClockIcon,
  FolderIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

export default function QuickStatusWidget({ onClockIn }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const { data } = await api.get('/quick/status')
      setStatus(data)
    } catch (error) {
      console.error('Failed to fetch status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClockAction = async () => {
    try {
      await api.post('/quick/clockin')
      fetchStatus() // Refresh status
    } catch (error) {
      console.error('Clock action failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 dark:bg-dark-600 rounded mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-dark-600 rounded" />
          ))}
        </div>
      </div>
    )
  }

  const statusItems = [
    {
      label: 'Pending Tasks',
      value: status?.tasks?.pending || 0,
      icon: ClipboardDocumentListIcon,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
      alert: status?.tasks?.pending > 5,
    },
    {
      label: 'Overdue',
      value: status?.tasks?.overdue || 0,
      icon: ExclamationTriangleIcon,
      color: 'text-red-600 bg-red-100 dark:bg-red-900/30',
      alert: status?.tasks?.overdue > 0,
    },
    {
      label: 'Notifications',
      value: status?.notifications?.unread || 0,
      icon: BellIcon,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
      alert: status?.notifications?.unread > 10,
    },
    {
      label: 'Active Projects',
      value: status?.projects?.active || 0,
      icon: FolderIcon,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    },
  ]

  return (
    <div className="card">
      <div className="p-4 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Quick Status</h3>
        
        {/* Clock In/Out Button */}
        <button
          onClick={handleClockAction}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            status?.attendance?.clockedIn && !status?.attendance?.clockedOut
              ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
          }`}
        >
          <ClockIcon className="w-4 h-4" />
          {status?.attendance?.clockedIn && !status?.attendance?.clockedOut
            ? 'Clock Out'
            : status?.attendance?.clockedOut
            ? 'Done for Today'
            : 'Clock In'}
        </button>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {statusItems.map((item) => (
            <div 
              key={item.label}
              className={`p-4 rounded-xl border ${
                item.alert 
                  ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10' 
                  : 'border-gray-200 dark:border-dark-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${item.alert ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                    {item.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Hours worked today */}
        {status?.attendance?.clockedIn && (
          <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-dark-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Hours today</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {status?.attendance?.hoursWorked || 0}h
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
