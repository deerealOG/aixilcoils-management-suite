import { useEffect, useState } from 'react'
import api from '../services/api'
import { PlusIcon, CurrencyDollarIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

export default function Expenses() {
  const { user } = useAuthStore()
  const [expenses, setExpenses] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Form State
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Travel',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const { data } = await api.get('/expenses')
      setExpenses(data)
    } catch (error) {
    //   console.error(error)
      // silent fail or empty list
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/expenses', formData)
      toast.success('Expense created successfully')
      setShowModal(false)
      fetchExpenses()
      setFormData({ description: '', amount: '', category: 'Travel', date: new Date().toISOString().split('T')[0], notes: '' })
    } catch (error) {
      toast.error('Failed to create expense')
    } finally {
        setLoading(false)
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
        await api.patch(`/expenses/${id}`, { status })
        toast.success(`Expense ${status.toLowerCase()}`)
        fetchExpenses()
    } catch(err) {
        toast.error('Failed to update status')
    }
  }

  const handleDelete = async (id) => {
      if(!confirm('Delete this expense?')) return
      try {
          await api.delete(`/expenses/${id}`)
          toast.success('Expense deleted')
          fetchExpenses()
      } catch(err) {
          toast.error('Failed to delete')
      }
  }

  return (
    <div className="animate-fade-in relative min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Expenses</h1>
           <p className="text-gray-500 dark:text-gray-400">Track and manage your expenses.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          New Expense
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
          {loading ? (
              <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent"></div></div>
          ) : expenses.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-dark-700/50 rounded-xl border border-dashed border-gray-300 dark:border-dark-600">
                  <CurrencyDollarIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">No expenses recorded</h3>
                  <p className="text-gray-500 mb-6">Submit an expense to get started.</p>
                  <button onClick={() => setShowModal(true)} className="btn-primary">Create First Expense</button>
              </div>
          ) : (
            <>
                {/* Desktop Table View */}
                <div className="hidden md:block bg-white dark:bg-dark-800 rounded-xl shadow border border-gray-100 dark:border-dark-700 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                            {expenses.map((expense) => {
                                const canApprove = ['ADMIN', 'OWNER', 'LEAD'].includes(user.role) && expense.status === 'PENDING';
                                const canDelete = ['ADMIN', 'OWNER'].includes(user.role) || (expense.userId === user.id && expense.status === 'PENDING');
                                
                                return (
                                <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300 whitespace-nowrap">
                                        {new Date(expense.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                         <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-600 flex items-center justify-center text-xs font-bold text-gray-500">
                                                {expense.user?.firstName?.[0]}{expense.user?.lastName?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{expense.user?.firstName} {expense.user?.lastName}</p>
                                                <p className="text-xs text-gray-500">{expense.user?.role}</p>
                                            </div>
                                         </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                        {expense.description}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="px-2 py-1 rounded bg-gray-100 dark:bg-dark-600 text-xs font-medium">
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                                        ${Number(expense.amount).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                         <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                             expense.status === 'APPROVED' ? 'bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800' :
                                             expense.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' :
                                             'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                                         }`}>
                                             {expense.status === 'APPROVED' && <CheckCircleIcon className="w-3 h-3" />}
                                             {expense.status === 'REJECTED' && <XCircleIcon className="w-3 h-3" />}
                                             {expense.status === 'PENDING' && <ClockIcon className="w-3 h-3" />}
                                             {expense.status}
                                         </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {canApprove && (
                                                <>
                                                    <button onClick={() => handleUpdateStatus(expense.id, 'APPROVED')} className="btn-icon text-success-600 hover:bg-success-50" title="Approve">
                                                        <CheckCircleIcon className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => handleUpdateStatus(expense.id, 'REJECTED')} className="btn-icon text-red-600 hover:bg-red-50" title="Reject">
                                                        <XCircleIcon className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                            {canDelete && (
                                                <button onClick={() => handleDelete(expense.id)} className="text-xs text-red-500 hover:text-red-700 font-medium px-2">
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {expenses.map((expense) => {
                        const canApprove = ['ADMIN', 'OWNER', 'LEAD'].includes(user.role) && expense.status === 'PENDING';
                        const canDelete = ['ADMIN', 'OWNER'].includes(user.role) || (expense.userId === user.id && expense.status === 'PENDING');
                        
                        return (
                        <div key={expense.id} className="card p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs text-gray-500">{new Date(expense.date).toLocaleDateString()}</p>
                                    <h3 className="font-bold text-gray-900 dark:text-white capitalize">{expense.description}</h3>
                                    <p className="text-xs text-gray-500">{expense.user?.firstName} {expense.user?.lastName}</p>
                                </div>
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                     expense.status === 'APPROVED' ? 'bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800' :
                                     expense.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' :
                                     'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                                 }`}>
                                     {expense.status}
                                 </span>
                            </div>
                            
                            <div className="flex justify-between items-center bg-gray-50 dark:bg-dark-700 p-2 rounded-lg">
                                <span className="text-xs text-gray-500">{expense.category}</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">${Number(expense.amount).toFixed(2)}</span>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                {canApprove && (
                                    <>
                                        <button onClick={() => handleUpdateStatus(expense.id, 'APPROVED')} className="btn-success text-xs py-1.5 px-3">
                                            Approve
                                        </button>
                                        <button onClick={() => handleUpdateStatus(expense.id, 'REJECTED')} className="btn-danger text-xs py-1.5 px-3">
                                            Reject
                                        </button>
                                    </>
                                )}
                                {canDelete && (
                                    <button onClick={() => handleDelete(expense.id)} className="text-danger-600 text-xs font-medium px-2 py-1.5">
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    )})}
                </div>
            </>
          )}
      </div>

      {/* Basic Create Modal */}
      {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-dark-800 rounded-xl shadow-xl w-full max-w-md p-6 m-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">New Expense Claim</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                          <input required type="text" className="input" placeholder="e.g. Flight to Conference" 
                            value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                           <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount ($)</label>
                                <input required type="number" min="0" step="0.01" className="input" 
                                    value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                           </div>
                           <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                <select className="input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                    <option>Travel</option>
                                    <option>Meals</option>
                                    <option>Equipment</option>
                                    <option>Training</option>
                                    <option>Software</option>
                                    <option>Other</option>
                                </select>
                           </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                          <input required type="date" className="input" 
                            value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                          <textarea className="input h-24 resize-none" placeholder="Additional details..."
                            value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
                      </div>
                      <div className="flex gap-3 pt-4">
                          <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                          <button type="submit" disabled={loading} className="btn-primary flex-1">
                              {loading ? 'Submitting...' : 'Create Expense'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  )
}
