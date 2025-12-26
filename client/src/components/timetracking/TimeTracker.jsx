import { useState, useEffect, useCallback } from 'react'
import { 
  PlayIcon, 
  StopIcon, 
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function TimeTracker({ minimal = false }) {
  const [activeEntry, setActiveEntry] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  
  // Form for starting new timer
  const [description, setDescription] = useState('')
  const [taskId, setTaskId] = useState('')
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    checkActiveTimer()
    loadTasks()
  }, [])

  useEffect(() => {
    let interval
    if (activeEntry) {
      interval = setInterval(() => {
        const start = new Date(activeEntry.startTime)
        const now = new Date()
        setElapsedTime(Math.floor((now - start) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [activeEntry])

  const checkActiveTimer = async () => {
    try {
      const { data } = await api.get('/timetracking/active')
      if (data.activeEntry) {
        setActiveEntry(data.activeEntry)
        setDescription(data.activeEntry.description || '')
      }
    } catch (error) {
      console.error('Failed to check active timer:', error)
    }
  }

  const loadTasks = async () => {
    try {
      const { data } = await api.get('/tasks/my-tasks?limit=20')
      setTasks(data || [])
    } catch (error) {
      console.error('Failed to load tasks:', error)
    }
  }

  const startTimer = async () => {
    setIsStarting(true)
    try {
      const { data } = await api.post('/timetracking/start', {
        taskId: taskId || undefined,
        description: description || undefined,
      })
      setActiveEntry(data.entry)
      setElapsedTime(0)
      toast.success('Timer started')
      setShowDetails(false)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to start timer')
    } finally {
      setIsStarting(false)
    }
  }

  const stopTimer = async () => {
    setIsStopping(true)
    try {
      const { data } = await api.post('/timetracking/stop', {
        description,
      })
      setActiveEntry(null)
      setElapsedTime(0)
      setDescription('')
      setTaskId('')
      toast.success(data.message)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to stop timer')
    } finally {
      setIsStopping(false)
    }
  }

  const formatTime = useCallback((seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  if (minimal) {
    return (
      <div className="flex items-center gap-2">
        {activeEntry ? (
          <>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-mono text-green-700 dark:text-green-400">
                {formatTime(elapsedTime)}
              </span>
            </div>
            <button
              onClick={stopTimer}
              disabled={isStopping}
              className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              title="Stop timer"
            >
              <StopIcon className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowDetails(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <ClockIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Track Time</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="card p-4">
      {activeEntry ? (
        <div className="space-y-4">
          {/* Timer Display */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">Timer Running</span>
            </div>
            <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white">
              {formatTime(elapsedTime)}
            </div>
            {activeEntry.task && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {activeEntry.task.title}
              </p>
            )}
          </div>

          {/* Description Input */}
          <input
            type="text"
            placeholder="What are you working on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
          />

          {/* Stop Button */}
          <button
            onClick={stopTimer}
            disabled={isStopping}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <StopIcon className="w-5 h-5" />
            {isStopping ? 'Stopping...' : 'Stop Timer'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-primary-600" />
            Start Timer
          </h3>

          {/* Description */}
          <input
            type="text"
            placeholder="What are you working on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
          />

          {/* Task Selection */}
          <select
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">Link to task (optional)</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>

          {/* Start Button */}
          <button
            onClick={startTimer}
            disabled={isStarting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <PlayIcon className="w-5 h-5" />
            {isStarting ? 'Starting...' : 'Start Timer'}
          </button>
        </div>
      )}

      {/* Quick Start Modal (for minimal mode) */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDetails(false)} />
          <div className="relative w-full max-w-sm mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
            <button
              onClick={() => setShowDetails(false)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Start Timer</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="What are you working on?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                autoFocus
              />
              <select
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Link to task (optional)</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
              <button
                onClick={startTimer}
                disabled={isStarting}
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
              >
                {isStarting ? 'Starting...' : 'Start Timer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
