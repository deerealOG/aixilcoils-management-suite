import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function ProjectActionModal({ isOpen, onClose, type, projectId, onSuccess }) {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const config = {
    CANCEL: {
      title: 'Cancel Project',
      description: 'Are you sure you want to cancel this project? This action cannot be undone.',
      icon: ExclamationTriangleIcon,
      color: 'bg-red-100 text-red-600',
      btnColor: 'btn-danger',
      btnText: 'Cancel Project',
      requireMessage: false
    },
    COMPLETE: {
      title: 'Mark as Complete',
      description: 'Are you sure you want to mark this project as complete? Ensure all tasks are finished.',
      icon: CheckCircleIcon,
      color: 'bg-green-100 text-green-600',
      btnColor: 'btn-success', // We might need to define this class or use explicit styles
      btnText: 'Complete Project',
      requireMessage: false
    },
    QUERY: {
      title: 'Send Query',
      description: 'Send a query to the project manager. They will be notified immediately.',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-blue-100 text-blue-600',
      btnColor: 'btn-primary',
      btnText: 'Send Query',
      requireMessage: true
    }
  }

  const currentConfig = config[type] || config.QUERY

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (currentConfig.requireMessage && !message.trim()) {
      return toast.error('Message is required')
    }

    setIsLoading(true)
    try {
      if (type === 'QUERY') {
        await api.post(`/projects/${projectId}/query`, { message })
        toast.success('Query sent successfully')
      } else {
        await api.patch(`/projects/${projectId}`, { 
          status: type === 'CANCEL' ? 'CANCELLED' : 'COMPLETED' 
        })
        toast.success(`Project ${type === 'CANCEL' ? 'cancelled' : 'completed'}`)
      }
      onSuccess?.()
      onClose()
      setMessage('')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Action failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-dark-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-dark-800 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="sm:flex sm:items-start">
                    <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${currentConfig.color}`}>
                      <currentConfig.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                        {currentConfig.title}
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {currentConfig.description}
                        </p>
                      </div>

                      {(type === 'QUERY' || type === 'CANCEL') && (
                          <div className="mt-4">
                              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {type === 'QUERY' ? 'Message' : 'Reason (Optional)'}
                              </label>
                              <textarea
                                id="message"
                                rows={3}
                                className="input mt-1 w-full"
                                placeholder={type === 'QUERY' ? 'Enter your query...' : 'Why is this project being cancelled?'}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required={currentConfig.requireMessage}
                              />
                          </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleSubmit}
                      className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto ${currentConfig.btnColor} ${currentConfig.btnColor === 'btn-success' ? 'bg-green-600 hover:bg-green-500' : ''}`}
                    >
                      {isLoading ? 'Processing...' : currentConfig.btnText}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-dark-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-dark-600 hover:bg-gray-50 dark:hover:bg-dark-600 sm:mt-0 sm:w-auto"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
