/**
 * Loading Component - Loading spinner and skeleton
 */

// Spinner component
export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4',
  }

  return (
    <div
      className={`animate-spin rounded-full border-primary-600 border-t-transparent ${sizes[size]} ${className}`}
    />
  )
}

// Full page loading
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-800">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  )
}

// Skeleton loader
export function Skeleton({ className = '', variant = 'text' }) {
  const variants = {
    text: 'h-4 rounded',
    title: 'h-6 rounded',
    avatar: 'rounded-full',
    card: 'rounded-xl',
    button: 'h-10 rounded-lg',
  }

  return (
    <div
      className={`bg-gray-200 dark:bg-dark-600 animate-pulse ${variants[variant]} ${className}`}
    />
  )
}

// Card skeleton
export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-dark-700 rounded-xl p-6 border border-gray-100 dark:border-dark-600">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="avatar" className="w-12 h-12" />
        <div className="flex-1">
          <Skeleton variant="title" className="w-32 mb-2" />
          <Skeleton variant="text" className="w-24" />
        </div>
      </div>
      <Skeleton variant="text" className="w-full mb-2" />
      <Skeleton variant="text" className="w-3/4" />
    </div>
  )
}

export default Spinner
