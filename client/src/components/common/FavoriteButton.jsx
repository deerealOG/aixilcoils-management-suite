import { useState, useEffect } from 'react'
import { StarIcon as StarOutline } from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function FavoriteButton({ 
  entityType, 
  entityId, 
  size = 'md',
  className = '' 
}) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkFavoriteStatus()
  }, [entityType, entityId])

  const checkFavoriteStatus = async () => {
    try {
      const { data } = await api.get(`/favorites/check/${entityType}/${entityId}`)
      setIsFavorited(data.isFavorited)
    } catch (error) {
      console.error('Failed to check favorite status:', error)
    }
  }

  const toggleFavorite = async (e) => {
    e.stopPropagation()
    e.preventDefault()
    
    setLoading(true)
    try {
      if (isFavorited) {
        await api.delete(`/favorites/entity/${entityType}/${entityId}`)
        setIsFavorited(false)
        toast.success('Removed from favorites')
      } else {
        await api.post('/favorites', { entityType, entityId })
        setIsFavorited(true)
        toast.success('Added to favorites')
      }
    } catch (error) {
      toast.error('Failed to update favorite')
    } finally {
      setLoading(false)
    }
  }

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const iconSize = sizeClasses[size] || sizeClasses.md

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`p-1.5 rounded-lg transition-all duration-200 ${
        isFavorited 
          ? 'text-yellow-500 hover:text-yellow-600' 
          : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-700'
      } ${loading ? 'opacity-50' : ''} ${className}`}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isFavorited ? (
        <StarSolid className={iconSize} />
      ) : (
        <StarOutline className={iconSize} />
      )}
    </button>
  )
}
