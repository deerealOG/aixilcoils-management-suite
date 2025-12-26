import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import {
  ClockIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  CheckBadgeIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns'

export default function UpcomingWidget() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const { data } = await api.get('/quick/upcoming')
      setData(data)
    } catch (error) {
      console.error('Failed to fetch upcoming data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatDueDate = (dateStr) => {
    const date = new Date(dateStr)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'MMM d')
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400'
      case 'HIGH': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400'
      case 'MEDIUM': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 dark:bg-dark-600 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-dark-600 rounded" />
          ))}
        </div>
      </div>
    )
  }

  const hasUpcoming = data?.tasks?.length > 0 || data?.leaves?.length > 0 || data?.reviews?.length > 0

  return (
    <div className="card">
      <div className="p-4 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary-600" />
          Upcoming This Week
        </h3>
        <button 
          onClick={() => fetchData(true)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
          disabled={refreshing}
        >
          <ArrowPathIcon className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-dark-700">
        {!hasUpcoming ? (
          <div className="p-8 text-center">
            <CheckBadgeIcon className="w-12 h-12 mx-auto text-green-500 mb-2" />
            <p className="text-gray-500 dark:text-gray-400">You're all caught up!</p>
            <p className="text-sm text-gray-400 mt-1">No upcoming deadlines this week</p>
          </div>
        ) : (
          <>
            {/* Upcoming Tasks */}
            {data?.tasks?.map((task) => (
              <Link 
                key={task.id} 
                to={task.url}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors"
              >
                <div className={`p-2 rounded-lg ${isPast(new Date(task.dueDate)) ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                  {isPast(new Date(task.dueDate)) ? (
                    <ExclamationCircleIcon className="w-5 h-5 text-red-600" />
                  ) : (
                    <ClockIcon className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{task.project}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`text-xs ${isPast(new Date(task.dueDate)) ? 'text-red-600' : 'text-gray-500'}`}>
                    {formatDueDate(task.dueDate)}
                  </span>
                </div>
              </Link>
            ))}

            {/* Upcoming Leaves */}
            {data?.leaves?.map((leave) => (
              <div 
                key={leave.id} 
                className="flex items-center gap-3 p-4"
              >
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <CalendarIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {leave.type} Leave
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(leave.startDate), 'MMM d')} - {format(new Date(leave.endDate), 'MMM d')}
                  </p>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  Approved
                </span>
              </div>
            ))}

            {/* Pending Reviews */}
            {data?.reviews?.map((review) => (
              <div 
                key={review.id} 
                className="flex items-center gap-3 p-4"
              >
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <CheckBadgeIcon className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {review.type} Review - {review.period}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{review.employee}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  review.status === 'DRAFT' 
                    ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' 
                    : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {review.status}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
