import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import {
  UsersIcon,
  CalendarIcon,
  DocumentTextIcon,
  ClockIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline'
import LeaveRequestModal from '../components/modals/LeaveRequestModal'
import InviteUserModal from '../components/modals/InviteUserModal'

export default function HR() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('directory')
  const [viewMode, setViewMode] = useState('grid')
  const [employees, setEmployees] = useState([])
  const [leaveRequests, setLeaveRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      if (activeTab === 'directory') {
        const { data } = await api.get('/users/directory')
        setEmployees(data)
      } else if (activeTab === 'leave') {
        const { data } = await api.get('/leave')
        setLeaveRequests(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      await api.patch(`/leave/${id}/approve`)
      toast.success('Leave request approved')
      fetchData()
    } catch (error) {
      toast.error('Failed to approve request')
    }
  }

  const handleReject = async (id) => {
    try {
      await api.patch(`/leave/${id}/reject`)
      toast.success('Leave request rejected')
      fetchData()
    } catch (error) {
      toast.error('Failed to reject request')
    }
  }

  const canApproveLeave = ['OWNER', 'ADMIN', 'LEAD'].includes(user?.role)

  const tabs = [
    { id: 'directory', name: 'Directory', icon: UsersIcon },
    { id: 'leave', name: 'Leave', icon: CalendarIcon },
    { id: 'documents', name: 'Documents', icon: DocumentTextIcon },
    { id: 'attendance', name: 'Attendance', icon: ClockIcon },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'badge-warning'
      case 'APPROVED': return 'badge-success'
      case 'REJECTED': return 'badge-danger'
      default: return 'badge bg-gray-100 text-gray-700'
    }
  }

  const filteredEmployees = employees.filter(emp => 
    `${emp.firstName} ${emp.lastName} ${emp.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">People</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage employees, leave, and documents</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'directory' && ['OWNER', 'ADMIN'].includes(user?.role) && (
            <button onClick={() => setShowInviteModal(true)} className="btn-primary">
              <UserPlusIcon className="w-5 h-5 mr-2" />
              Invite Employee
            </button>
          )}
          {activeTab === 'leave' && (
            <button onClick={() => setShowLeaveModal(true)} className="btn-primary">
              <PlusIcon className="w-5 h-5 mr-2" />
              Request Leave
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-dark-600">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Directory Tab */}
          {activeTab === 'directory' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <div className="relative w-full max-w-md">
                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search employees..."
                      className="input pl-10 w-full"
                    />
                  </div>
                  <div className="flex bg-gray-100 dark:bg-dark-700 p-1 rounded-lg">
                      <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-dark-600 shadow text-primary-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                      >
                          <Squares2X2Icon className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-dark-600 shadow text-primary-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                      >
                          <ListBulletIcon className="w-5 h-5" />
                      </button>
                  </div>
              </div>
              
              {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEmployees.map((employee) => (
                      <Link key={employee.id} to={`/employees/${employee.id}`} className="card-hover p-6 flex flex-col h-full">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-lg shrink-0">
                            {employee.firstName[0]}{employee.lastName[0]}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-lg">
                              {employee.firstName} {employee.lastName}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate font-medium">{employee.position || 'No position'}</p>
                            <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">{employee.department?.name}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4 flex-1">
                             <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <span className="w-20 text-xs uppercase tracking-wider text-gray-400">Email</span>
                                <span className="truncate">{employee.email}</span>
                             </div>
                             {employee.phone && (
                                 <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                    <span className="w-20 text-xs uppercase tracking-wider text-gray-400">Phone</span>
                                    <span>{employee.phone}</span>
                                 </div>
                             )}
                             {employee.manager && (
                                 <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                    <span className="w-20 text-xs uppercase tracking-wider text-gray-400">Manager</span>
                                    <span>{employee.manager.firstName} {employee.manager.lastName}</span>
                                 </div>
                             )}
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-dark-600 flex items-center justify-between mt-auto">
                          <span className={`badge text-xs ${
                              employee.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'
                          }`}>
                            {employee.status}
                          </span>
                          <span className="badge bg-gray-100 dark:bg-dark-600 text-gray-600 dark:text-gray-400 text-xs">
                            {employee.role}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
              ) : (
                  <div className="card overflow-hidden">
                      <table className="w-full text-left">
                          <thead className="bg-gray-50 dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600">
                              <tr>
                                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Employee</th>
                                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Department</th>
                                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Manager</th>
                                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-dark-600">
                              {filteredEmployees.map((employee) => (
                                  <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors">
                                      <td className="px-6 py-4">
                                          <Link to={`/employees/${employee.id}`} className="flex items-center gap-3 group">
                                              <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-xs">
                                                  {employee.firstName[0]}{employee.lastName[0]}
                                              </div>
                                              <div>
                                                  <p className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                                                      {employee.firstName} {employee.lastName}
                                                  </p>
                                                  <p className="text-xs text-gray-500">{employee.email}</p>
                                              </div>
                                          </Link>
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className="badge bg-gray-100 dark:bg-dark-600 text-gray-600 dark:text-gray-400 text-xs">
                                              {employee.role}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                          <div className="flex flex-col">
                                              <span>{employee.department?.name || '-'}</span>
                                              <span className="text-xs text-gray-400">{employee.position}</span>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                          {employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : '-'}
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className={`badge text-xs ${
                                              employee.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'
                                          }`}>
                                              {employee.status}
                                          </span>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              )}
            </div>
          )}

          {/* Leave Tab */}
          {activeTab === 'leave' && (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-dark-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-600">
                  {leaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">No leave requests</td>
                    </tr>
                  ) : (
                    leaveRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-dark-600/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-medium text-primary-600 dark:text-primary-400">
                              {request.employee?.firstName[0]}{request.employee?.lastName[0]}
                            </div>
                            <span className="text-gray-900 dark:text-gray-100">
                              {request.employee?.firstName} {request.employee?.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{request.type}</td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{request.days}</td>
                        <td className="px-6 py-4">
                          <span className={getStatusColor(request.status)}>{request.status}</span>
                        </td>
                        <td className="px-6 py-4">
                          {request.status === 'PENDING' && canApproveLeave && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(request.id)}
                                className="text-sm text-success-600 hover:underline"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(request.id)}
                                className="text-sm text-danger-500 hover:underline"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="card p-12 text-center">
              <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Document Management</h3>
              <p className="text-gray-500 dark:text-gray-400">Upload and manage HR documents</p>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="card p-12 text-center">
              <ClockIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Attendance Tracking</h3>
              <p className="text-gray-500 dark:text-gray-400">View and manage attendance records</p>
            </div>
          )}
        </>
      )}

      {/* Leave Request Modal */}
      <LeaveRequestModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onSuccess={fetchData}
      />

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={fetchData}
      />
    </div>
  )
}

