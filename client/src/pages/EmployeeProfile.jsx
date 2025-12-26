import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  UserIcon,
  TrophyIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline'

export default function EmployeeProfile() {
  const { id } = useParams()
  const { user: currentUser } = useAuthStore()
  const [employee, setEmployee] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    fetchEmployee()
  }, [id])

  const fetchEmployee = async () => {
    try {
      const { data } = await api.get(`/users/${id}`)
      setEmployee(data)
    } catch (error) {
      console.error('Failed to fetch employee:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Generate QR code URL using public QR API
  const getQRCodeUrl = () => {
    const profileUrl = `${window.location.origin}/employees/${id}`
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Employee not found</h2>
        <Link to="/hr" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to People
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/hr" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600">
          <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Employee Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-2xl gradient-bg flex items-center justify-center text-white text-3xl font-bold">
              {employee.firstName[0]}{employee.lastName[0]}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {employee.firstName} {employee.lastName}
              </h2>
              <p className="text-lg text-primary-600 dark:text-primary-400">{employee.position || 'No position'}</p>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{employee.department?.name}</p>
              
              <div className="flex gap-2 mt-4">
                <span className={`badge ${employee.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                  {employee.status}
                </span>
                <span className="badge bg-gray-100 dark:bg-dark-600 text-gray-700 dark:text-gray-300">
                  {employee.role}
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {employee.bio && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-600">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">About</h3>
              <p className="text-gray-600 dark:text-gray-400">{employee.bio}</p>
            </div>
          )}

          {/* Contact Info */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-600 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                  <EnvelopeIcon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-gray-900 dark:text-gray-100">{employee.email}</p>
                </div>
              </div>

              {employee.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                    <PhoneIcon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="text-gray-900 dark:text-gray-100">{employee.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                  <BuildingOfficeIcon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Department</p>
                  <p className="text-gray-900 dark:text-gray-100">{employee.department?.name || 'Unassigned'}</p>
                </div>
              </div>

              {employee.hireDate && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Hire Date</p>
                    <p className="text-gray-900 dark:text-gray-100">{new Date(employee.hireDate).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Manager */}
          {employee.manager && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-600">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Reports To</h3>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-dark-700">
                <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                  {employee.manager.firstName[0]}{employee.manager.lastName[0]}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {employee.manager.firstName} {employee.manager.lastName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{employee.manager.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Subordinates */}
          {employee.subordinates?.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-600">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Direct Reports ({employee.subordinates.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {employee.subordinates.map((sub) => (
                  <Link
                    key={sub.id}
                    to={`/employees/${sub.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-dark-700 hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-medium text-primary-600 dark:text-primary-400">
                      {sub.firstName[0]}{sub.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {sub.firstName} {sub.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{sub.position}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* QR Code Card */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <QrCodeIcon className="w-5 h-5" />
              Profile QR Code
            </h3>
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white rounded-xl shadow-inner">
                <img 
                  src={getQRCodeUrl()} 
                  alt="Profile QR Code" 
                  className="w-40 h-40"
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
                Scan to view profile
              </p>
            </div>
          </div>

          {/* Awards Section */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <TrophyIcon className="w-5 h-5" />
              Awards & Recognition
            </h3>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <TrophyIcon className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm">No awards yet</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Member since</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {new Date(employee.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Last active</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {employee.lastLogin ? new Date(employee.lastLogin).toLocaleDateString() : 'Never'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
