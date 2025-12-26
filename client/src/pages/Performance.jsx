import { useEffect, useState } from 'react'
import api from '../services/api'
import { ChartBarIcon, FlagIcon, TrophyIcon, PlusIcon, StarIcon } from '@heroicons/react/24/outline'

export default function Performance() {
  const [activeTab, setActiveTab] = useState('kpis')
  const [kpis, setKpis] = useState([])
  const [okrs, setOkrs] = useState([])
  const [reviews, setReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      if (activeTab === 'kpis') {
        const { data } = await api.get('/kpis/dashboard')
        setKpis([...data.userKpis, ...data.departmentKpis])
      } else if (activeTab === 'okrs') {
        const { data } = await api.get('/okrs/my-okrs')
        setOkrs(data)
      } else if (activeTab === 'reviews') {
        const { data } = await api.get('/performance/reviews')
        setReviews(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ON_TRACK': return 'text-success-600 bg-success-50 dark:bg-success-500/20'
      case 'AT_RISK': return 'text-warning-600 bg-warning-50 dark:bg-warning-500/20'
      case 'BEHIND': return 'text-danger-500 bg-danger-50 dark:bg-danger-500/20'
      case 'ACHIEVED': return 'text-primary-600 bg-primary-50 dark:bg-primary-900/20'
      case 'EXCEEDED': return 'text-secondary-600 bg-secondary-50 dark:bg-secondary-900/20'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getReviewStatusColor = (status) => {
    switch (status) {
      case 'DRAFT': return 'badge bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
      case 'PENDING': return 'badge-warning'
      case 'SUBMITTED': return 'badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
      case 'COMPLETED': return 'badge-success'
      default: return 'badge bg-gray-100 text-gray-700'
    }
  }

  const tabs = [
    { id: 'kpis', name: 'KPIs', icon: ChartBarIcon },
    { id: 'okrs', name: 'OKRs', icon: FlagIcon },
    { id: 'reviews', name: 'Reviews', icon: TrophyIcon },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reviews</h1>
          <p className="text-gray-500 dark:text-gray-400">Track your KPIs, OKRs, and performance reviews</p>
        </div>
        <button className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          Add {activeTab === 'kpis' ? 'KPI' : activeTab === 'okrs' ? 'OKR' : 'Review'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-dark-600">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* KPIs Tab */}
          {activeTab === 'kpis' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {kpis.length === 0 ? (
                <div className="col-span-2 card p-12 text-center">
                  <ChartBarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No KPIs found</h3>
                  <p className="text-gray-500 dark:text-gray-400">Start tracking your key performance indicators</p>
                </div>
              ) : (
                kpis.map((kpi) => (
                  <div key={kpi.id} className="card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{kpi.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.period}</p>
                      </div>
                      <span className={`badge ${getStatusColor(kpi.status)}`}>{kpi.status.replace('_', ' ')}</span>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500 dark:text-gray-400">Progress</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {Number(kpi.currentValue)}{kpi.unit} / {Number(kpi.targetValue)}{kpi.unit}
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 dark:bg-dark-600 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            kpi.progress >= 100 ? 'bg-success-500' : kpi.progress >= 75 ? 'bg-primary-500' : kpi.progress >= 50 ? 'bg-warning-500' : 'bg-danger-500'
                          }`}
                          style={{ width: `${Math.min(100, kpi.progress)}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <span className="text-3xl font-bold gradient-text">{kpi.progress}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* OKRs Tab */}
          {activeTab === 'okrs' && (
            <div className="space-y-6">
              {okrs.length === 0 ? (
                <div className="card p-12 text-center">
                  <FlagIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No OKRs found</h3>
                  <p className="text-gray-500 dark:text-gray-400">Define your objectives and key results</p>
                </div>
              ) : (
                okrs.map((okr) => (
                  <div key={okr.id} className="card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{okr.objective}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{okr.period}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold gradient-text">{okr.progress}%</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {okr.keyResults?.map((kr, index) => (
                        <div key={kr.id} className="flex items-center gap-4">
                          <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-medium text-primary-600">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 dark:text-gray-100">{kr.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 bg-gray-100 dark:bg-dark-600 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary-500 rounded-full"
                                  style={{ width: `${kr.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{kr.progress}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {reviews.length === 0 ? (
                <div className="card p-12 text-center">
                  <TrophyIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Reviews Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400">Performance reviews will appear here</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-white font-bold">
                          {review.employee?.firstName?.[0]}{review.employee?.lastName?.[0]}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {review.employee?.firstName} {review.employee?.lastName}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {review.type} Review • {review.period}
                          </p>
                        </div>
                      </div>
                      <span className={getReviewStatusColor(review.status)}>{review.status}</span>
                    </div>

                    {/* Score display */}
                    {review.overallScore && (
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon 
                              key={star} 
                              className={`w-5 h-5 ${star <= review.overallScore ? 'text-warning-500 fill-warning-500' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{review.overallScore}/5</span>
                      </div>
                    )}

                    {/* Reviewer */}
                    <div className="text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-dark-700 pt-4 mt-4 flex items-center justify-between">
                       <span>Reviewed by: {review.reviewer?.firstName} {review.reviewer?.lastName}</span>
                       <button className="btn-outline text-xs px-3 py-1">View Details</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

