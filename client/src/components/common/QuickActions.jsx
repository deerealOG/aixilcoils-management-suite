import { useState, useEffect, useRef } from 'react'
import { 
  PlusIcon, 
  XMarkIcon,
  ClipboardDocumentListIcon,
  DocumentPlusIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import api from '../../services/api'
import toast from 'react-hot-toast'

const quickActions = [
  { id: 'task', name: 'New Task', icon: ClipboardDocumentListIcon, color: 'bg-green-500' },
  { id: 'note', name: 'Quick Note', icon: DocumentPlusIcon, color: 'bg-amber-500' },
  { id: 'leave', name: 'Request Leave', icon: CalendarDaysIcon, color: 'bg-purple-500' },
  { id: 'message', name: 'Send Message', icon: ChatBubbleLeftRightIcon, color: 'bg-blue-500' },
  { id: 'clockin', name: 'Clock In/Out', icon: ClockIcon, color: 'bg-rose-500' },
]

export default function QuickActions({ isOpen, onClose }) {
  const [activeAction, setActiveAction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  
  // Form states
  const [taskForm, setTaskForm] = useState({ title: '', projectId: '', priority: 'MEDIUM', dueDate: '' })
  const [noteForm, setNoteForm] = useState({ title: '', content: '' })
  const [leaveForm, setLeaveForm] = useState({ type: 'ANNUAL', startDate: '', endDate: '', reason: '' })
  const [messageForm, setMessageForm] = useState({ recipientId: '', content: '' })

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  const loadData = async () => {
    try {
      const [projectsRes, usersRes] = await Promise.all([
        api.get('/projects'),
        api.get('/users'),
      ])
      setProjects(projectsRes.data.projects || projectsRes.data || [])
      setUsers(usersRes.data.users || usersRes.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const handleQuickTask = async () => {
    if (!taskForm.title || !taskForm.projectId) {
      toast.error('Please fill in title and select a project')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/quick/task', taskForm)
      toast.success('Task created successfully!')
      setTaskForm({ title: '', projectId: '', priority: 'MEDIUM', dueDate: '' })
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickNote = async () => {
    if (!noteForm.title) {
      toast.error('Please enter a title')
      return
    }
    setLoading(true)
    try {
      await api.post('/quick/note', noteForm)
      toast.success('Note saved!')
      setNoteForm({ title: '', content: '' })
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save note')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLeave = async () => {
    if (!leaveForm.startDate || !leaveForm.endDate) {
      toast.error('Please select start and end dates')
      return
    }
    setLoading(true)
    try {
      await api.post('/quick/leave', leaveForm)
      toast.success('Leave request submitted!')
      setLeaveForm({ type: 'ANNUAL', startDate: '', endDate: '', reason: '' })
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit leave request')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickMessage = async () => {
    if (!messageForm.recipientId || !messageForm.content) {
      toast.error('Please select recipient and enter message')
      return
    }
    setLoading(true)
    try {
      await api.post('/quick/message', messageForm)
      toast.success('Message sent!')
      setMessageForm({ recipientId: '', content: '' })
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const handleClockIn = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/quick/clockin')
      toast.success(data.message)
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Clock in/out failed')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const renderForm = () => {
    switch (activeAction) {
      case 'task':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Task</h3>
            <input
              type="text"
              placeholder="Task title..."
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              autoFocus
            />
            <select
              value={taskForm.projectId}
              onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">Select Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent</option>
              </select>
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <button
              onClick={handleQuickTask}
              disabled={loading}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        )

      case 'note':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Note</h3>
            <input
              type="text"
              placeholder="Note title..."
              value={noteForm.title}
              onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              autoFocus
            />
            <textarea
              placeholder="Write your note..."
              value={noteForm.content}
              onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
            <button
              onClick={handleQuickNote}
              disabled={loading}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        )

      case 'leave':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Request Leave</h3>
            <select
              value={leaveForm.type}
              onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="ANNUAL">Annual Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="PERSONAL">Personal Leave</option>
              <option value="UNPAID">Unpaid Leave</option>
            </select>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <textarea
              placeholder="Reason (optional)..."
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
            <button
              onClick={handleQuickLeave}
              disabled={loading}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        )

      case 'message':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Message</h3>
            <select
              value={messageForm.recipientId}
              onChange={(e) => setMessageForm({ ...messageForm, recipientId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select Recipient</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
            <textarea
              placeholder="Your message..."
              value={messageForm.content}
              onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              autoFocus
            />
            <button
              onClick={handleQuickMessage}
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        )

      case 'clockin':
        return (
          <div className="space-y-4 text-center py-6">
            <ClockIcon className="w-16 h-16 mx-auto text-rose-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Clock In/Out</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Click the button below to clock in or out for today.
            </p>
            <button
              onClick={handleClockIn}
              disabled={loading}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Clock In/Out'}
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {activeAction ? 'Quick Action' : 'Quick Actions'}
          </h2>
          <button 
            onClick={() => activeAction ? setActiveAction(null) : onClose()}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {activeAction ? (
            <>
              <button
                onClick={() => setActiveAction(null)}
                className="text-sm text-primary-600 hover:text-primary-700 mb-4 flex items-center"
              >
                ← Back to actions
              </button>
              {renderForm()}
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => action.id === 'clockin' ? handleClockIn() : setActiveAction(action.id)}
                  className="flex flex-col items-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group"
                >
                  <div className={`p-3 rounded-xl ${action.color} text-white mb-3 group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {action.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        {!activeAction && (
          <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-xs text-center text-gray-500">
              Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">K</kbd> for search
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
