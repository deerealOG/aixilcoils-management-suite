import { useState, useEffect, useRef, useCallback } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import {
  UserIcon,
  FolderIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  HashtagIcon,
  BuildingOfficeIcon,
  LockClosedIcon,
  ClockIcon,
} from '@heroicons/react/24/solid'
import api from '../../services/api'
import { useNavigate } from 'react-router-dom'

const iconMap = {
  user: UserIcon,
  folder: FolderIcon,
  'check-square': CheckCircleIcon,
  'file-text': DocumentTextIcon,
  hash: HashtagIcon,
  lock: LockClosedIcon,
  building: BuildingOfficeIcon,
}

const typeColors = {
  user: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  project: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  task: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  document: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  channel: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  department: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
}

export default function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [recentItems, setRecentItems] = useState({ recentTasks: [], recentProjects: [] })
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  // Load recent items on mount
  useEffect(() => {
    if (isOpen) {
      loadRecentItems()
      inputRef.current?.focus()
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const loadRecentItems = async () => {
    try {
      const { data } = await api.get('/search/recent')
      setRecentItems(data)
    } catch (error) {
      console.error('Failed to load recent items:', error)
    }
  }

  const performSearch = async (searchQuery) => {
    setLoading(true)
    try {
      const { data } = await api.get('/search', { params: { q: searchQuery } })
      setResults(data.results)
      setSelectedIndex(0)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = useCallback((e) => {
    const items = query ? results : [...recentItems.recentTasks, ...recentItems.recentProjects]
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (items[selectedIndex]) {
          navigateToResult(items[selectedIndex])
        }
        break
      case 'Escape':
        onClose()
        break
    }
  }, [query, results, recentItems, selectedIndex])

  const navigateToResult = (result) => {
    if (result.url) {
      navigate(result.url)
      onClose()
      setQuery('')
    }
  }

  if (!isOpen) return null

  const displayItems = query ? results : [...recentItems.recentTasks, ...recentItems.recentProjects]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search users, projects, tasks, documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-base"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <XMarkIcon className="w-5 h-5 text-gray-400" />
            </button>
          )}
          <kbd className="ml-2 px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : displayItems.length > 0 ? (
            <div className="py-2">
              {!query && (
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Recent Items
                </div>
              )}
              {displayItems.map((item, index) => {
                const Icon = iconMap[item.icon] || DocumentTextIcon
                const colorClass = typeColors[item.type] || 'bg-gray-100 text-gray-600'
                
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => navigateToResult(item)}
                    className={`w-full flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      index === selectedIndex ? 'bg-gray-50 dark:bg-gray-700/50' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-lg mr-3 ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize">
                      {item.type}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : query ? (
            <div className="py-12 text-center">
              <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No results found for "{query}"</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Try searching for users, projects, tasks, or documents
              </p>
            </div>
          ) : (
            <div className="py-12 text-center">
              <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No recent items</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Start typing to search
              </p>
            </div>
          )}
        </div>

        {/* Footer with shortcuts */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded mr-1">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded mr-1">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded mr-1">↵</kbd>
                Select
              </span>
              <span className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded mr-1">ESC</kbd>
                Close
              </span>
            </div>
            <span className="text-gray-400">
              {query && `${results.length} results`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
