import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useState, useCallback, useEffect } from 'react'
import GlobalSearch from '../common/GlobalSearch'
import QuickActions from '../common/QuickActions'
import KeyboardShortcutsHelp from '../common/KeyboardShortcutsHelp'
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts'
import { useSocket } from '../../hooks/useSocket'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false)
  const navigate = useNavigate()

  // Keyboard shortcuts handlers
  const handleOpenSearch = useCallback(() => {
    setSearchOpen(true)
    setQuickActionsOpen(false)
    setShortcutsHelpOpen(false)
  }, [])

  const handleOpenQuickActions = useCallback(() => {
    setQuickActionsOpen(true)
    setSearchOpen(false)
    setShortcutsHelpOpen(false)
  }, [])

  const handleShowHelp = useCallback(() => {
    setShortcutsHelpOpen(true)
    setSearchOpen(false)
    setQuickActionsOpen(false)
  }, [])

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    onOpenSearch: handleOpenSearch,
    onOpenQuickActions: handleOpenQuickActions,
    onShowHelp: handleShowHelp,
    navigate,
  })

  // Global Socket Notifications
  const { user } = useAuthStore() // Ensure we have user context
  const socket = useSocket()
  
  // Listen for global notifications
  useEffect(() => {
    if (!socket) return

    const handleMessage = (message) => {
      // Don't show toast if on chat page
      const isOnChatPage = window.location.hash.includes('/chat') || window.location.pathname === '/chat'
      if (isOnChatPage) return
      
      // Don't show if we sent it (echo)
      if (message.sender?.id === user?.id) return

      toast((t) => (
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => {
            navigate('/chat')
            toast.dismiss(t.id)
        }}>
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs">
                {message.sender?.firstName?.[0]}{message.sender?.lastName?.[0]}
            </div>
            <div>
                <p className="text-sm font-semibold">{message.sender?.firstName} {message.sender?.lastName}</p>
                <p className="text-xs text-gray-500 truncate max-w-[150px]">{message.content}</p>
            </div>
        </div>
      ), { duration: 4000, position: 'top-right' })
    }

    const handleNotification = (notif) => {
        toast((t) => (
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    🔔
                </div>
                <div>
                    <p className="text-sm font-semibold">{notif.title}</p>
                    <p className="text-xs text-gray-500">{notif.message}</p>
                </div>
            </div>
        ), { duration: 5000, position: 'top-right' })
    }

    socket.on('receive_message', handleMessage)
    socket.on('notification', handleNotification)

    return () => {
        socket.off('receive_message', handleMessage)
        socket.off('notification', handleNotification)
    }
  }, [socket, user, navigate])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Mobile sidebar overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />
      
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          onSearchClick={handleOpenSearch}
          onQuickActionClick={handleOpenQuickActions}
        />
        
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)} 
      />

      {/* Quick Actions Modal */}
      <QuickActions 
        isOpen={quickActionsOpen} 
        onClose={() => setQuickActionsOpen(false)} 
      />

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp 
        isOpen={shortcutsHelpOpen} 
        onClose={() => setShortcutsHelpOpen(false)} 
      />
    </div>
  )
}
