import { useState, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import toast from 'react-hot-toast'
import { 
    SunIcon, MoonIcon, BellIcon, ShieldCheckIcon, KeyIcon, 
    UserCircleIcon, BuildingOfficeIcon, CameraIcon 
} from '@heroicons/react/24/outline'

export default function Settings() {
  const { isDarkMode, toggleDarkMode, user, checkAuth } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)

  // Profile Form State
  const [profileData, setProfileData] = useState({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      position: user?.position || ''
  })
  
  // Password Form State
  const [passwordData, setPasswordData] = useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
  })
  
  const fileInputRef = useRef(null)

  const tabs = [
      { id: 'profile', name: 'Profile', icon: UserCircleIcon },
      { id: 'security', name: 'Security', icon: ShieldCheckIcon },
      { id: 'notifications', name: 'Notifications', icon: BellIcon },
      { id: 'appearance', name: 'Appearance', icon: isDarkMode ? MoonIcon : SunIcon },
      ...(user?.role === 'OWNER' ? [{ id: 'company', name: 'Company', icon: BuildingOfficeIcon }] : [])
  ]

  const handleProfileUpdate = async (e) => {
      e.preventDefault()
      setIsLoading(true)
      try {
          await api.put('/users/me', profileData)
          await checkAuth() // Refresh user data
          toast.success('Profile updated successfully')
      } catch (error) {
          toast.error('Failed to update profile')
      } finally {
          setIsLoading(false)
      }
  }

  const handlePasswordChange = async (e) => {
      e.preventDefault()
      if (passwordData.newPassword !== passwordData.confirmPassword) {
          return toast.error('New passwords do not match')
      }
      setIsLoading(true)
      try {
          await api.put('/auth/change-password', {
              currentPassword: passwordData.currentPassword,
              newPassword: passwordData.newPassword
          })
          toast.success('Password changed successfully')
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } catch (error) {
          toast.error(error.response?.data?.error || 'Failed to change password')
      } finally {
          setIsLoading(false)
      }
  }

  const handleAvatarUpload = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      const formData = new FormData()
      formData.append('avatar', file)

      const loadingToast = toast.loading('Uploading avatar...')
      try {
          await api.post(`/users/${user.id}/avatar`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          })
          await checkAuth()
          toast.success('Avatar updated', { id: loadingToast })
      } catch (error) {
          toast.error('Failed to upload avatar', { id: loadingToast })
      }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Tabs */}
          <div className="md:w-64 flex-shrink-0">
              <nav className="space-y-1">
                  {tabs.map((tab) => (
                      <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                              activeTab === tab.id 
                                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' 
                                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-dark-700'
                          }`}
                      >
                          <tab.icon className="w-5 h-5" />
                          {tab.name}
                      </button>
                  ))}
              </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1">
              {/* Profile Settings */}
              {activeTab === 'profile' && (
                  <div className="card p-6 space-y-6">
                      <div className="flex items-center gap-6 pb-6 border-b border-gray-100 dark:border-dark-600">
                          <div className="relative group">
                              <div className="w-24 h-24 rounded-full gradient-bg flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                                  {user?.avatar ? (
                                      <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                  ) : (
                                      <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                                  )}
                              </div>
                              <button 
                                  onClick={() => fileInputRef.current?.click()}
                                  className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                  <CameraIcon className="w-8 h-8 text-white" />
                              </button>
                              <input 
                                  type="file" 
                                  ref={fileInputRef} 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={handleAvatarUpload}
                              />
                          </div>
                          <div>
                              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                  {user?.firstName} {user?.lastName}
                              </h2>
                              <p className="text-gray-500 text-sm">{user?.email}</p>
                              <span className="badge bg-primary-100 text-primary-700 text-xs mt-2">
                                  {user?.role}
                              </span>
                          </div>
                      </div>

                      <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                              <input type="text" className="input" value={profileData.firstName} onChange={e => setProfileData({...profileData, firstName: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                              <input type="text" className="input" value={profileData.lastName} onChange={e => setProfileData({...profileData, lastName: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                              <input type="tel" className="input" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position</label>
                              <input type="text" className="input" value={profileData.position} disabled={user.role !== 'OWNER'} title={user.role !== 'OWNER' ? "Contact admin to change position" : ""} onChange={e => setProfileData({...profileData, position: e.target.value})} />
                          </div>
                          <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                              <textarea className="input h-24 resize-none" value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} placeholder="Tell us about yourself..."></textarea>
                          </div>
                          <div className="md:col-span-2 flex justify-end">
                              <button type="submit" disabled={isLoading} className="btn-primary">
                                  {isLoading ? 'Saving...' : 'Save Changes'}
                              </button>
                          </div>
                      </form>
                  </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                  <div className="card p-6 space-y-6">
                      <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h3>
                          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                                  <input 
                                      type="password" 
                                      required
                                      className="input" 
                                      value={passwordData.currentPassword} 
                                      onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} 
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                                  <input 
                                      type="password" 
                                      required
                                      minLength={8}
                                      className="input" 
                                      value={passwordData.newPassword} 
                                      onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} 
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                                  <input 
                                      type="password" 
                                      required
                                      minLength={8}
                                      className="input" 
                                      value={passwordData.confirmPassword} 
                                      onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} 
                                  />
                              </div>
                              <div className="flex justify-end pt-2">
                                  <button type="submit" disabled={isLoading} className="btn-primary">
                                      {isLoading ? 'Updating...' : 'Update Password'}
                                  </button>
                              </div>
                          </form>
                      </div>
                      
                      <div className="pt-6 border-t border-gray-100 dark:border-dark-600">
                           <div className="flex items-center justify-between">
                               <div>
                                   <h3 className="font-semibold text-gray-900 dark:text-white">Two-Factor Authentication</h3>
                                   <p className="text-sm text-gray-500">Secure your account with 2FA.</p>
                               </div>
                               <button className="btn-outline text-sm" disabled title="Coming soon">Enable</button>
                           </div>
                      </div>
                  </div>
              )}

              {/* Notification Settings (Mock) */}
              {activeTab === 'notifications' && (
                  <div className="card p-6 space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
                      <div className="space-y-4">
                          {['Email Notifications', 'Push Notifications', 'Project Updates', 'Task Assignments'].map((item) => (
                              <div key={item} className="flex items-center justify-between py-2">
                                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                  <button className={`w-11 h-6 rounded-full relative transition-colors ${item.includes('Email') ? 'bg-primary-600' : 'bg-gray-300 dark:bg-dark-600'}`}>
                                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${item.includes('Email') ? 'left-6' : 'left-1'}`} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                  <div className="card p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h3>
                      <div className="flex items-center justify-between">
                           <div>
                               <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                               <p className="text-sm text-gray-500">Use dark theme across the application</p>
                           </div>
                           <button
                              onClick={toggleDarkMode}
                              className={`relative w-14 h-7 rounded-full transition-colors ${isDarkMode ? 'bg-primary-600' : 'bg-gray-300 dark:bg-dark-500'}`}
                            >
                              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDarkMode ? 'left-8' : 'left-1'}`} />
                            </button>
                      </div>
                  </div>
              )}

              {/* Company Settings (Owner Only) */}
              {activeTab === 'company' && user?.role === 'OWNER' && (
                  <div className="card p-6 space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Company Details</h3>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                          <input type="text" className="input" defaultValue="AIXILCOILS" readOnly />
                      </div>
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-lg flex gap-3 text-sm text-yellow-800 dark:text-yellow-200">
                         <ShieldCheckIcon className="w-5 h-5 flex-shrink-0" />
                         <p>Billing and advanced company settings are managed by the administrator platform. Please contact support.</p>
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  )
}
