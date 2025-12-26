import { useEffect, useState, useRef, useCallback } from 'react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useSocket } from '../hooks/useSocket'
import {
  PaperAirplaneIcon,
  PlusIcon,
  HashtagIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'

import CreateChannelModal from '../components/modals/CreateChannelModal'
import CreateDMModal from '../components/modals/CreateDMModal'

export default function Chat() {
  const { user } = useAuthStore()
  const socket = useSocket()
  const [channels, setChannels] = useState([])
  const [selectedChannel, setSelectedChannel] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [typingUsers, setTypingUsers] = useState([])
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false)
  const [showCreateDMModal, setShowCreateDMModal] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    fetchChannels()
  }, [])

  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel.id)
      socket?.emit('join_channel', selectedChannel.id)
    }

    return () => {
      if (selectedChannel) {
        socket?.emit('leave_channel', selectedChannel.id)
      }
    }
  }, [selectedChannel, socket])

  useEffect(() => {
    if (!socket) return

    socket.on('receive_message', (message) => {
      if (message.channelId === selectedChannel?.id) {
        setMessages((prev) => [...prev, message])
        scrollToBottom()
      }
    })

    socket.on('typing_status', ({ userId, isTyping, user: typingUser }) => {
        if (!selectedChannel) return
        setTypingUsers((prev) => {
            if (isTyping) {
                if (!prev.find(u => u.id === userId)) {
                    return [...prev, typingUser]
                }
                return prev
            } else {
                return prev.filter(u => u.id !== userId)
            }
        })
    })

    return () => {
      socket.off('receive_message')
      socket.off('typing_status')
    }
  }, [socket, selectedChannel])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchChannels = async () => {
    try {
      const { data } = await api.get('/channels')
      setChannels(data.data || data)
      if ((data.data?.length > 0 || data?.length > 0) && !selectedChannel) {
        setSelectedChannel((data.data || data)[0])
      }
    } catch (error) {
      console.error('Failed to fetch channels:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMessages = async (channelId) => {
    try {
      const { data } = await api.get(`/channels/${channelId}/messages`)
      setMessages(data.data || data)
      setTimeout(scrollToBottom, 100)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const handleTyping = () => {
    if (!socket || !selectedChannel) return
    
    socket.emit('typing', { channelId: selectedChannel.id, isTyping: true })
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    
    typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { channelId: selectedChannel.id, isTyping: false })
    }, 2000)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedChannel) return

    const tempId = Date.now()
    const messageContent = newMessage
    setNewMessage('')
    
    // Optimistic update
    const tempMessage = {
        id: tempId,
        content: messageContent,
        sender: user,
        createdAt: new Date().toISOString(),
        isTemp: true
    }
    setMessages(prev => [...prev, tempMessage])
    scrollToBottom()

    try {
      const { data } = await api.post(`/channels/${selectedChannel.id}/messages`, {
        content: messageContent,
      })
      
      // Replace temp message
      setMessages(prev => prev.map(m => m.id === tempId ? data.data || data : m))
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove temp message if failed? or show error
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading chat...</div>
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-200 dark:border-dark-700 overflow-hidden relative">
      {/* Sidebar - Toggled on mobile */}
      <div className={`
          absolute inset-0 z-30 lg:relative lg:block w-full lg:w-64 border-r border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 flex flex-col
          transition-transform duration-300
          ${selectedChannel && 'hidden lg:flex'}
      `}>
        <div className="p-4 border-b border-gray-200 dark:border-dark-700 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900 dark:text-white">Channels</h2>
          <button onClick={() => setShowCreateChannelModal(true)} className="lg:hidden p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700">
             <PlusIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {/* Group Channels */}
          <div className="mb-4">
             <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                <span>Groups</span>
             </div>
             {channels.filter(c => c.type !== 'DIRECT').map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors mb-1 ${
                  selectedChannel?.id === channel.id
                    ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
                }`}
              >
                {channel.type === 'PUBLIC' || channel.type === 'ANNOUNCEMENT' ? (
                  <HashtagIcon className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <LockClosedIcon className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="truncate text-sm">{channel.name}</span>
              </button>
            ))}
          </div>

          {/* Direct Messages */}
          <div>
            <div 
                className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between group cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => setShowCreateDMModal(true)}
            >
               <span>Direct Messages</span>
               <PlusIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
             {channels.filter(c => c.type === 'DIRECT').map((channel) => {
               // Logic to find the "other" participant
               const otherMember = channel.members?.find(m => m.userId !== user.id)
               const otherUser = otherMember?.user || { firstName: 'Unknown', lastName: 'User' }
               const displayName = otherUser.id ? `${otherUser.firstName} ${otherUser.lastName}` : (channel.name || 'Unknown')
               
               return (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors mb-1 ${
                      selectedChannel?.id === channel.id
                        ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
                    }`}
                  >
                     <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {otherUser.avatar ? (
                                <img src={otherUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <span>{otherUser.firstName?.[0]}{otherUser.lastName?.[0]}</span>
                            )}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-dark-800 rounded-full"></div>
                     </div>
                     <div className="min-w-0">
                        <p className="truncate text-sm font-medium leading-none">{displayName}</p>
                        <p className="text-[10px] text-gray-400 mt-1 truncate">{otherUser.position || 'Employee'}</p>
                     </div>
                  </button>
               )
             })}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-dark-700 space-y-2 hidden lg:block">
          <button 
            onClick={() => setShowCreateDMModal(true)}
            className="btn-secondary w-full text-sm justify-start"
          >
             <div className="w-4 h-4 flex items-center justify-center mr-2">
                <PlusIcon className="w-3 h-3" />
             </div>
             New Message
          </button>
          <button 
            onClick={() => setShowCreateChannelModal(true)}
            className="btn-secondary w-full text-sm justify-start"
          >
            <HashtagIcon className="w-4 h-4 mr-2" />
            Create Channel
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col h-full bg-white dark:bg-dark-800 ${!selectedChannel && 'hidden lg:flex'}`}>
        {selectedChannel ? (
          <>
            <div className="px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-dark-700 flex items-center gap-4">
              <button onClick={() => setSelectedChannel(null)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700">
                  <PlusIcon className="w-5 h-5 rotate-45 transform" />
              </button>
              
              {selectedChannel.type === 'DIRECT' ? (
                // DM Header
                (() => {
                    const otherMember = selectedChannel.members?.find(m => m.userId !== user.id)
                    const otherUser = otherMember?.user || { firstName: 'Unknown', lastName: 'User' }
                    const displayName = `${otherUser.firstName} ${otherUser.lastName}`
                    
                    return (
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                             <div className="relative shrink-0">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                                    {otherUser.avatar ? (
                                        <img src={otherUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <span>{otherUser.firstName?.[0]}{otherUser.lastName?.[0]}</span>
                                    )}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-dark-800 rounded-full"></div>
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{displayName}</h3>
                                    <span className="px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-[10px] font-bold uppercase tracking-wider">
                                        {otherUser.role || 'Employee'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {otherUser.position || 'Team Member'} • {otherUser.email}
                                </p>
                            </div>
                        </div>
                    )
                })()
              ) : (
                // Group Header
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <HashtagIcon className="w-5 h-5 text-gray-400" />
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{selectedChannel.name}</h3>
                        {selectedChannel.isPrivate && (
                             <LockClosedIcon className="w-3 h-3 text-gold-500" />
                        )}
                    </div>
                    {selectedChannel.description && (
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{selectedChannel.description}</p>
                    )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs lg:text-sm font-medium flex-shrink-0">
                      {message.sender?.firstName?.[0]}{message.sender?.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-sm lg:text-base text-gray-900 dark:text-white">
                          {message.sender?.firstName} {message.sender?.lastName}
                        </span>
                        <span className="text-[10px] lg:text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {message.isTemp && (
                          <span className="text-[10px] text-gray-400 italic">Sending...</span>
                        )}
                      </div>
                      <p className="text-sm lg:text-base text-gray-700 dark:text-gray-300 mt-1 break-words">{message.content}</p>
                    </div>
                  </div>
                ))
              )}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 animate-pulse italic">
                  <span>{typingUsers.map(u => u.firstName).join(', ')} is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-dark-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value)
                    handleTyping()
                  }}
                  placeholder={
                    selectedChannel.type === 'DIRECT' 
                      ? (() => {
                          const otherMember = selectedChannel.members?.find(m => m.userId !== user.id)
                          const otherUser = otherMember?.user || {}
                          return `Message ${otherUser.firstName || 'User'} (${otherUser.role || 'Member'})...`
                        })()
                      : `Message #${selectedChannel.name}`
                  }
                  className="input flex-1 py-2 text-sm lg:text-base"
                />
                <button type="submit" className="btn-primary px-3 lg:px-4">
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mb-4">
                <ChatBubbleLeftRightIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Your Messages</h3>
            <p className="text-sm max-w-xs">Select a channel or colleague to start collaborating in real-time.</p>
          </div>
        )}
      </div>

      <CreateChannelModal
        isOpen={showCreateChannelModal}
        onClose={() => setShowCreateChannelModal(false)}
        onSuccess={fetchChannels}
      />
      <CreateDMModal
        isOpen={showCreateDMModal}
        onClose={() => setShowCreateDMModal(false)}
        onSuccess={(newChannel) => {
            fetchChannels()
            if (newChannel) setSelectedChannel(newChannel)
        }}
      />
    </div>
  )
}
