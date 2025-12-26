/**
 * Badge Component - Status and label badges
 */
export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
    secondary: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400',
    success: 'bg-success-50 text-success-600 dark:bg-success-500/20 dark:text-success-500',
    warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/20 dark:text-warning-500',
    danger: 'bg-danger-50 text-danger-600 dark:bg-danger-500/20 dark:text-danger-500',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  )
}
