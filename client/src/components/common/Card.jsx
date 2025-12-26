/**
 * Card Component - Reusable card container
 */
export default function Card({
  children,
  className = '',
  hover = false,
  padding = true,
  ...props
}) {
  return (
    <div
      className={`
        bg-white dark:bg-dark-700 
        rounded-xl shadow-sm 
        border border-gray-100 dark:border-dark-600
        ${hover ? 'transition-all duration-200 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800' : ''}
        ${padding ? 'p-6' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

// Card Header component
export function CardHeader({ children, className = '' }) {
  return (
    <div className={`border-b border-gray-200 dark:border-dark-600 pb-4 mb-4 ${className}`}>
      {children}
    </div>
  )
}

// Card Title component
export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${className}`}>
      {children}
    </h3>
  )
}

// Card Description component
export function CardDescription({ children, className = '' }) {
  return (
    <p className={`text-sm text-gray-500 dark:text-gray-400 mt-1 ${className}`}>
      {children}
    </p>
  )
}
