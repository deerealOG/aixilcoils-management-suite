import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import {
  Bars3Icon,
  BellIcon,
  MoonIcon,
  SunIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import api from '../../services/api'

export default function Header({ onMenuClick, onSearchClick, onQuickActionClick }) {
  const { user, logout, isDarkMode, toggleDarkMode } = useAuthStore()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications?limit=5')
      setNotifications(data.data || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error('Failed to fetch notifications')
    }
  }

  return (
    <header className="h-16 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 px-4 lg:px-6 flex items-center justify-between">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick} 
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
        >
          <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
        
        {/* Search Button */}
        <button 
          onClick={onSearchClick}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors group"
        >
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
          <span className="hidden md:block text-sm text-gray-500 dark:text-gray-400">Search...</span>
          <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-gray-400 bg-gray-200 dark:bg-dark-600 rounded ml-2">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Quick Actions */}
        <button
          onClick={onQuickActionClick}
          className="p-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors"
          title="Quick Actions (Ctrl+N)"
        >
          <PlusIcon className="w-5 h-5" />
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
        >
          {isDarkMode ? (
            <SunIcon className="w-5 h-5 text-yellow-500" />
          ) : (
            <MoonIcon className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {/* Notifications */}
        <Menu as="div" className="relative">
          <Menu.Button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 relative transition-colors">
            <BellIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Menu.Button>
          
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-gray-200 dark:border-dark-700 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-dark-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
              </div>
              
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No notifications
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <Menu.Item key={notification.id}>
                      {({ active }) => (
                        <div className={`px-4 py-3 cursor-pointer ${active ? 'bg-gray-50 dark:bg-dark-700' : ''} ${!notification.isRead ? 'bg-primary-50/50 dark:bg-primary-500/5' : ''}`}>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.message}</p>
                        </div>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              )}
              
              <Link to="/notifications" className="block px-4 py-3 text-center text-sm text-primary-600 hover:bg-gray-50 dark:hover:bg-dark-700 border-t border-gray-200 dark:border-dark-700">
                View all notifications
              </Link>
            </Menu.Items>
          </Transition>
        </Menu>

        {/* User menu */}
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <span className="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-300">
              {user?.firstName}
            </span>
          </Menu.Button>
          
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-gray-200 dark:border-dark-700 py-2 z-50">
              <Menu.Item>
                {({ active }) => (
                  <Link to="/profile" className={`flex items-center gap-2 px-4 py-2 text-sm ${active ? 'bg-gray-50 dark:bg-dark-700' : ''} text-gray-700 dark:text-gray-300`}>
                    <UserCircleIcon className="w-5 h-5" />
                    Profile
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <Link to="/settings" className={`flex items-center gap-2 px-4 py-2 text-sm ${active ? 'bg-gray-50 dark:bg-dark-700' : ''} text-gray-700 dark:text-gray-300`}>
                    <Cog6ToothIcon className="w-5 h-5" />
                    Settings
                  </Link>
                )}
              </Menu.Item>
              <hr className="my-2 border-gray-200 dark:border-dark-700" />
              <Menu.Item>
                {({ active }) => (
                  <button onClick={logout} className={`flex items-center gap-2 px-4 py-2 text-sm w-full ${active ? 'bg-gray-50 dark:bg-dark-700' : ''} text-danger-600`}>
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    Logout
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </header>
  )
}
