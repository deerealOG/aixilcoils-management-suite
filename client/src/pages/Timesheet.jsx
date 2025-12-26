import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import TimeTracker from '../components/timetracking/TimeTracker'
import { 
  ClockIcon, 
  CalendarIcon,
  ChartBarIcon,
  DocumentArrowUpIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import toast from 'react-hot-toast'

export default function Timesheet() {
  const [entries, setEntries] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [view, setView] = useState('week') // 'week' or 'list'

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 })
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })

  useEffect(() => {
    fetchData()
  }, [selectedWeek])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [entriesRes, summaryRes] = await Promise.all([
        api.get('/timetracking', {
          params: {
            startDate: weekStart.toISOString(),
            endDate: weekEnd.toISOString(),
            limit: 100,
          },
        }),
        api.get('/timetracking/summary'),
      ])
      setEntries(entriesRes.data.entries || [])
      setSummary(summaryRes.data)
    } catch (error) {
      console.error('Failed to fetch timesheet data:', error)
      toast.error('Failed to load timesheet')
    } finally {
      setLoading(false)
    }
  }

  const submitTimesheet = async () => {
    try {
      const draftEntries = entries.filter(e => e.status === 'DRAFT')
      if (draftEntries.length === 0) {
        toast.error('No entries to submit')
        return
      }

      await api.post('/timetracking/submit', {
        entryIds: draftEntries.map(e => e.id),
      })
      toast.success('Timesheet submitted for approval')
      fetchData()
    } catch (error) {
      toast.error('Failed to submit timesheet')
    }
  }

  const deleteEntry = async (id) => {
    if (!confirm('Are you sure you want to delete this entry?')) return
    
    try {
      await api.delete(`/timetracking/${id}`)
      toast.success('Entry deleted')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete entry')
    }
  }

  const getEntriesForDay = (day) => {
    return entries.filter(entry => 
      isSameDay(new Date(entry.startTime), day)
    )
  }

  const getDayTotal = (day) => {
    const dayEntries = getEntriesForDay(day)
    const totalMinutes = dayEntries.reduce((sum, e) => sum + (e.duration || 0), 0)
    return (totalMinutes / 60).toFixed(1)
  }

  const formatDuration = (minutes) => {
    if (!minutes) return '—'
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
  }

  const navigateWeek = (direction) => {
    const newDate = new Date(selectedWeek)
    newDate.setDate(newDate.getDate() + (direction * 7))
    setSelectedWeek(newDate)
  }

  const getStatusBadge = (status) => {
    const styles = {
      DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      SUBMITTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    }
    return `px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] || styles.DRAFT}`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Timesheet</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track and submit your work hours</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={submitTimesheet}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            <DocumentArrowUpIcon className="w-5 h-5" />
            Submit Timesheet
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <ClockIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.today.hours}h</p>
                <p className="text-sm text-gray-500">Today</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <CalendarIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.thisWeek.hours}h</p>
                <p className="text-sm text-gray-500">This Week</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <ChartBarIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.thisMonth.hours}h</p>
                <p className="text-sm text-gray-500">This Month</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timesheet Grid */}
        <div className="lg:col-span-2 card">
          {/* Week Navigation */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <button
              onClick={() => navigateWeek(-1)}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              ← Previous
            </button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </h3>
            <button
              onClick={() => navigateWeek(1)}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Next →
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
            {daysOfWeek.map((day) => (
              <div key={day.toISOString()} className="p-3 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                <p className="text-xs font-medium text-gray-500 uppercase">{format(day, 'EEE')}</p>
                <p className={`text-lg font-semibold mt-1 ${
                  isSameDay(day, new Date()) 
                    ? 'text-primary-600' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {format(day, 'd')}
                </p>
              </div>
            ))}
          </div>

          {/* Day Entries */}
          <div className="grid grid-cols-7 min-h-[200px]">
            {daysOfWeek.map((day) => {
              const dayEntries = getEntriesForDay(day)
              const dayTotal = getDayTotal(day)
              
              return (
                <div 
                  key={day.toISOString()} 
                  className="border-r border-gray-200 dark:border-gray-700 last:border-r-0 p-2"
                >
                  {/* Day Total */}
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {dayTotal}h
                  </div>
                  
                  {/* Entries */}
                  <div className="space-y-1">
                    {dayEntries.slice(0, 3).map((entry) => (
                      <div 
                        key={entry.id}
                        className="p-1.5 text-xs bg-blue-50 dark:bg-blue-900/20 rounded border-l-2 border-blue-500"
                        title={entry.description || entry.task?.title}
                      >
                        <p className="font-medium truncate">
                          {formatDuration(entry.duration)}
                        </p>
                        <p className="text-gray-500 truncate">
                          {entry.task?.title || entry.description || 'No description'}
                        </p>
                      </div>
                    ))}
                    {dayEntries.length > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{dayEntries.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Entries List */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white">All Entries This Week</h4>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto">
              {entries.length === 0 ? (
                <div className="p-8 text-center">
                  <ClockIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No time entries this week</p>
                </div>
              ) : (
                entries.map((entry) => (
                  <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {entry.task?.title || entry.description || 'No description'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(entry.startTime), 'MMM d, h:mm a')} • {formatDuration(entry.duration)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={getStatusBadge(entry.status)}>{entry.status}</span>
                      {entry.status === 'DRAFT' && (
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Timer Widget */}
        <div>
          <TimeTracker />
        </div>
      </div>
    </div>
  )
}
