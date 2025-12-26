import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  UserIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  BellIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline'

const steps = [
  { id: 1, name: 'Profile', icon: UserIcon, description: 'Complete your profile' },
  { id: 2, name: 'Department', icon: BuildingOfficeIcon, description: 'Confirm your department' },
  { id: 3, name: 'Role', icon: BriefcaseIcon, description: 'Review your role' },
  { id: 4, name: 'Preferences', icon: BellIcon, description: 'Set your preferences' },
  { id: 5, name: 'Complete', icon: CheckCircleIcon, description: 'Get started' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, updateProfile, completeOnboarding } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profilePicture, setProfilePicture] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  
  // Form data across all steps
  const [formData, setFormData] = useState({
    // Step 1: Profile
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    
    // Step 2: Department (read-only, assigned by admin)
    department: user?.department?.name || 'Not Assigned',
    
    // Step 3: Role Info (read-only, assigned by admin)
    role: user?.role || 'EMPLOYEE',
    position: user?.position || '',
    
    // Step 4: Preferences
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: true,
    darkMode: false,
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProfilePicture(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    try {
      // Update profile with onboarding data
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        bio: formData.bio,
        position: formData.position,
        preferences: {
          emailNotifications: formData.emailNotifications,
          pushNotifications: formData.pushNotifications,
          weeklyDigest: formData.weeklyDigest,
          darkMode: formData.darkMode,
        }
      })
      
      // Mark onboarding as completed
      await completeOnboarding()
      
      // Redirect to dashboard
      navigate('/')
    } catch (error) {
      console.error('Onboarding error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Complete Your Profile</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Let's get to know you better. Fill in your personal information.
              </p>
            </div>
            
            {/* Profile Picture */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-dark-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-dark-600 shadow-lg">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-primary-600">
                      {formData.firstName?.[0]}{formData.lastName?.[0]}
                    </span>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-primary-600 rounded-full cursor-pointer hover:bg-primary-700 transition-colors shadow-lg">
                  <PhotoIcon className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Doe"
                />
              </div>
            </div>
            
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            
            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                placeholder="Tell us a bit about yourself..."
              />
            </div>
          </div>
        )
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Department</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Review your assigned department. Contact HR if you have questions.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <BuildingOfficeIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {formData.department}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You have been assigned to this department by your administrator.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong className="text-gray-900 dark:text-white">Note:</strong> If your department assignment is incorrect, 
                please contact HR or your administrator after completing this onboarding.
              </p>
            </div>
          </div>
        )
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Role & Position</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Review your role and add your job position title.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-green-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <BriefcaseIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {formData.role.replace('_', ' ')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your system access level
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Job Position / Title
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="e.g., Software Engineer, Marketing Manager"
              />
            </div>
            
            <div className="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Access Level Includes:</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  View personal KPIs and performance
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  Access assigned projects and tasks
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  Submit leave requests
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  View company announcements
                </li>
              </ul>
            </div>
          </div>
        )
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Preferences</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Choose how you'd like to receive updates and notifications.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Email Notifications</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive important updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={formData.emailNotifications}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-dark-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-dark-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Push Notifications</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Get instant browser/app notifications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="pushNotifications"
                    checked={formData.pushNotifications}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-dark-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-dark-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Weekly Digest</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive a weekly summary of activities</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="weeklyDigest"
                    checked={formData.weeklyDigest}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-dark-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-dark-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Dark Mode</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Use dark theme by default</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="darkMode"
                    checked={formData.darkMode}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-dark-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-dark-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>
        )
        
      case 5:
        return (
          <div className="space-y-6 text-center">
            <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircleIcon className="w-14 h-14 text-green-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">You're All Set!</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Welcome to AIXILCOILS Management Suite. You're ready to get started.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-2xl p-6 text-left">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Your Profile Summary:</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formData.firstName} {formData.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Department:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formData.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Role:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formData.role.replace('_', ' ')}</span>
                </div>
                {formData.position && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Position:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.position}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You can update your profile and preferences anytime from the Settings page.
              </p>
            </div>
          </div>
        )
        
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">AIXILCOILS Management Suite</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Employee Onboarding</p>
            </div>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Step {currentStep} of {steps.length}
          </span>
        </div>
      </header>
      
      {/* Progress Steps */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full transition-all
                  ${currentStep > step.id
                    ? 'bg-green-600 text-white'
                    : currentStep === step.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-dark-600 text-gray-500 dark:text-gray-400'
                  }
                `}>
                  {currentStep > step.id ? (
                    <CheckCircleIcon className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    hidden md:block w-16 lg:w-24 h-1 mx-2 rounded-full transition-all
                    ${currentStep > step.id ? 'bg-green-600' : 'bg-gray-200 dark:bg-dark-600'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="hidden md:flex items-center justify-between mt-2">
            {steps.map((step) => (
              <span 
                key={step.id} 
                className={`text-xs text-center ${
                  currentStep >= step.id 
                    ? 'text-gray-900 dark:text-white font-medium' 
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {step.name}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-2xl mx-auto bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-200 dark:border-dark-700 p-8">
          {renderStepContent()}
        </div>
      </main>
      
      {/* Footer Navigation */}
      <footer className="bg-white dark:bg-dark-800 border-t border-gray-200 dark:border-dark-700 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
              ${currentStep === 1
                ? 'opacity-50 cursor-not-allowed text-gray-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
              }
            `}
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back
          </button>
          
          {currentStep < steps.length ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/30"
            >
              Continue
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all shadow-lg shadow-green-600/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Get Started
                </>
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
