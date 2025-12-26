import { useEffect, useCallback } from 'react'

/**
 * Custom hook for global keyboard shortcuts
 * 
 * Shortcuts:
 * - Ctrl/Cmd + K: Open global search
 * - Ctrl/Cmd + N: Open quick actions
 * - Ctrl/Cmd + /: Show keyboard shortcuts help
 * - G then D: Go to Dashboard
 * - G then P: Go to Projects
 * - G then H: Go to HR
 * - G then S: Go to Settings
 */
export default function useKeyboardShortcuts({
  onOpenSearch,
  onOpenQuickActions,
  onShowHelp,
  navigate,
}) {
  const handleKeyDown = useCallback((e) => {
    // Ignore if user is typing in an input/textarea
    if (
      document.activeElement?.tagName === 'INPUT' ||
      document.activeElement?.tagName === 'TEXTAREA' ||
      document.activeElement?.isContentEditable
    ) {
      // Only allow Escape to close modals
      if (e.key !== 'Escape') {
        return
      }
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const ctrlKey = isMac ? e.metaKey : e.ctrlKey

    // Ctrl/Cmd + K: Open search
    if (ctrlKey && e.key === 'k') {
      e.preventDefault()
      onOpenSearch?.()
      return
    }

    // Ctrl/Cmd + N: Open quick actions (without Shift, to avoid new window)
    if (ctrlKey && e.key === 'n' && !e.shiftKey) {
      e.preventDefault()
      onOpenQuickActions?.()
      return
    }

    // Ctrl/Cmd + /: Show help
    if (ctrlKey && e.key === '/') {
      e.preventDefault()
      onShowHelp?.()
      return
    }

    // Navigation shortcuts (G prefix)
    if (e.key === 'g' && !ctrlKey && !e.shiftKey && !e.altKey) {
      // Set up listener for next key
      const handleNextKey = (nextEvent) => {
        document.removeEventListener('keydown', handleNextKey)
        
        switch (nextEvent.key) {
          case 'd':
            nextEvent.preventDefault()
            navigate?.('/')
            break
          case 'p':
            nextEvent.preventDefault()
            navigate?.('/projects')
            break
          case 'h':
            nextEvent.preventDefault()
            navigate?.('/hr')
            break
          case 's':
            nextEvent.preventDefault()
            navigate?.('/settings')
            break
          case 'r':
            nextEvent.preventDefault()
            navigate?.('/performance')
            break
          case 'o':
            nextEvent.preventDefault()
            navigate?.('/profile')
            break
        }
      }

      // Listen for next key with timeout
      document.addEventListener('keydown', handleNextKey)
      setTimeout(() => {
        document.removeEventListener('keydown', handleNextKey)
      }, 1000)
    }
  }, [onOpenSearch, onOpenQuickActions, onShowHelp, navigate])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/**
 * Keyboard shortcuts reference for help modal
 */
export const keyboardShortcuts = [
  { category: 'General', shortcuts: [
    { keys: ['Ctrl', 'K'], description: 'Open global search' },
    { keys: ['Ctrl', 'N'], description: 'Open quick actions' },
    { keys: ['Ctrl', '/'], description: 'Show keyboard shortcuts' },
    { keys: ['Esc'], description: 'Close modal / Cancel' },
  ]},
  { category: 'Navigation', shortcuts: [
    { keys: ['G', 'D'], description: 'Go to Dashboard' },
    { keys: ['G', 'P'], description: 'Go to Projects' },
    { keys: ['G', 'H'], description: 'Go to HR' },
    { keys: ['G', 'S'], description: 'Go to Settings' },
    { keys: ['G', 'R'], description: 'Go to Performance' },
    { keys: ['G', 'O'], description: 'Go to Profile' },
  ]},
  { category: 'In Lists', shortcuts: [
    { keys: ['↑', '↓'], description: 'Navigate items' },
    { keys: ['Enter'], description: 'Select item' },
    { keys: ['Space'], description: 'Toggle selection' },
  ]},
]
