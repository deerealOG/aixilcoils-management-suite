import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  HomeIcon,
  FolderIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  XMarkIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'

// Define navigation with role requirements
const getNavigation = (role) => {
  const allNav = [
    { name: 'Dashboard', href: '/', icon: HomeIcon, roles: ['OWNER', 'ADMIN', 'LEAD', 'MEMBER', 'GUEST'] },
    { name: 'Projects', href: '/projects', icon: FolderIcon, roles: ['OWNER', 'ADMIN', 'LEAD', 'MEMBER', 'GUEST'] },
    { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon, roles: ['OWNER', 'ADMIN', 'LEAD', 'MEMBER'] },
    { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon, roles: ['OWNER', 'ADMIN', 'LEAD', 'MEMBER'] },
    { name: 'Time', href: '/timesheet', icon: ClockIcon, roles: ['OWNER', 'ADMIN', 'LEAD', 'MEMBER'] },
    { name: 'Expenses', href: '/expenses', icon: CurrencyDollarIcon, roles: ['OWNER', 'ADMIN', 'LEAD', 'MEMBER'] },
    { name: 'People', href: '/hr', icon: UsersIcon, roles: ['OWNER', 'ADMIN', 'LEAD'] },
    { name: 'Reviews', href: '/performance', icon: ChartBarIcon, roles: ['OWNER', 'ADMIN', 'LEAD', 'MEMBER'] },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, roles: ['OWNER', 'ADMIN'] },
  ]
  
  return allNav.filter(item => item.roles.includes(role))
}

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuthStore()
  const navigation = getNavigation(user?.role || 'GUEST')

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-64
      bg-white dark:bg-dark-800
      border-r border-gray-200 dark:border-dark-700
      transform transition-transform duration-300
      lg:translate-x-0
      ${isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}
    `}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-dark-700">
        <div className="flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="AIXILCOILS" 
            className="h-8 w-auto"
          />
        </div>
        <button 
          onClick={onClose} 
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
              ${isActive 
                ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User card */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-dark-700">
        <NavLink 
          to="/profile"
          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-dark-700 hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
        </NavLink>
      </div>
    </aside>
  )
}

