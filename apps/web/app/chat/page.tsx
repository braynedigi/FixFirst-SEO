'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { 
  MessageSquare, 
  Plus, 
  Send, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  Sparkles,
  Bot,
  User as UserIcon,
  ChevronLeft
} from 'lucide-react'

export default function ChatPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [isSending, setIsSending] = useState(false)

  // Fetch conversations
  const { data: conversations, isLoading: loadingConversations } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: async () => {
      const response = await chatApi.getConversations()
      return response.data
    },
  })

  // Fetch selected conversation
  const { data: currentConversation, isLoading: loadingMessages } = useQuery({
    queryKey: ['chat-conversation', selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return null
      const response = await chatApi.getConversation(selectedConversationId)
      return response.data
    },
    enabled: !!selectedConversationId,
  })

  // Create new conversation
  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await chatApi.createConversation()
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] })
      setSelectedConversationId(data.id)
      toast.success('New conversation started!')
    },
    onError: () => {
      toast.error('Failed to create conversation')
    },
  })

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConversationId) throw new Error('No conversation selected')
      const response = await chatApi.sendMessage(selectedConversationId, content)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversation', selectedConversationId] })
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] })
      setMessageInput('')
      setIsSending(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to send message')
      setIsSending(false)
    },
  })

  // Delete conversation
  const deleteConversationMutation = useMutation({
    mutationFn: async (id: string) => {
      await chatApi.deleteConversation(id)
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] })
      if (selectedConversationId === deletedId) {
        setSelectedConversationId(null)
      }
      toast.success('Conversation deleted')
    },
    onError: () => {
      toast.error('Failed to delete conversation')
    },
  })

  // Update conversation title
  const updateTitleMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      await chatApi.updateConversation(id, { title })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] })
      queryClient.invalidateQueries({ queryKey: ['chat-conversation', selectedConversationId] })
      setEditingTitle(null)
      toast.success('Title updated')
    },
    onError: () => {
      toast.error('Failed to update title')
    },
  })

  const handleSendMessage = () => {
    if (!messageInput.trim()) return
    if (!selectedConversationId) {
      toast.error('Please select or create a conversation first')
      return
    }
    
    setIsSending(true)
    sendMessageMutation.mutate(messageInput.trim())
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleDeleteConversation = (id: string) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      deleteConversationMutation.mutate(id)
    }
  }

  const handleStartEditing = (conversation: any) => {
    setEditingTitle(conversation.id)
    setNewTitle(conversation.title)
  }

  const handleSaveTitle = (id: string) => {
    if (newTitle.trim()) {
      updateTitleMutation.mutate({ id, title: newTitle.trim() })
    }
  }

  return (
    <div className="min-h-screen bg-background-page">
      {/* Header */}
      <header className="border-b border-border-light bg-background-card sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-background-hover rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">AI SEO Assistant</h1>
                <p className="text-sm text-text-secondary">Get expert SEO guidance powered by AI</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar - Conversations List */}
        <div className="w-80 border-r border-border-light bg-background-card flex flex-col">
          <div className="p-4 border-b border-border-light">
            <button
              onClick={() => createConversationMutation.mutate()}
              disabled={createConversationMutation.isPending}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Conversation
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="p-4 text-center text-text-secondary">Loading...</div>
            ) : conversations?.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-secondary text-sm">No conversations yet</p>
                <p className="text-text-muted text-xs mt-1">Start a new one to begin chatting</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {conversations?.map((conversation: any) => (
                  <div
                    key={conversation.id}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversationId === conversation.id
                        ? 'bg-primary/10 border-l-2 border-primary'
                        : 'hover:bg-background-hover'
                    }`}
                    onClick={() => setSelectedConversationId(conversation.id)}
                  >
                    {editingTitle === conversation.id ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="input input-sm flex-1"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveTitle(conversation.id)}
                          className="p-1 hover:bg-success/20 rounded text-success"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingTitle(null)}
                          className="p-1 hover:bg-danger/20 rounded text-danger"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{conversation.title}</h3>
                            <p className="text-xs text-text-muted truncate mt-1">
                              {conversation._count.messages} messages
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStartEditing(conversation)
                              }}
                              className="p-1 hover:bg-background-hover rounded"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteConversation(conversation.id)
                              }}
                              className="p-1 hover:bg-danger/20 rounded text-danger"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {conversation.project && (
                          <div className="text-xs text-primary mt-1">
                            📊 {conversation.project.name}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {!selectedConversationId ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Welcome to AI SEO Assistant</h2>
                <p className="text-text-secondary mb-6">
                  Start a conversation to get expert SEO advice, understand audit findings, and optimize your website's performance.
                </p>
                <button
                  onClick={() => createConversationMutation.mutate()}
                  className="btn-primary"
                >
                  Start New Conversation
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingMessages ? (
                  <div className="text-center text-text-secondary">Loading messages...</div>
                ) : currentConversation?.messages.length === 0 ? (
                  <div className="text-center text-text-muted py-12">
                    No messages yet. Start the conversation below!
                  </div>
                ) : (
                  currentConversation?.messages.map((message: any) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'USER' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'ASSISTANT' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[70%] rounded-lg p-4 ${
                          message.role === 'USER'
                            ? 'bg-primary text-white'
                            : 'bg-background-card border border-border-light'
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </div>
                        <div className={`text-xs mt-2 ${
                          message.role === 'USER' ? 'text-white/70' : 'text-text-muted'
                        }`}>
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </div>
                      </div>

                      {message.role === 'USER' && (
                        <div className="w-8 h-8 rounded-full bg-background-hover flex items-center justify-center flex-shrink-0">
                          <UserIcon className="w-4 h-4 text-text-primary" />
                        </div>
                      )}
                    </div>
                  ))
                )}

                {isSending && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white animate-pulse" />
                    </div>
                    <div className="bg-background-card border border-border-light rounded-lg p-4">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-border-light bg-background-card p-4">
                <div className="flex gap-3">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about SEO..."
                    className="input flex-1 resize-none"
                    rows={3}
                    disabled={isSending}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || isSending}
                    className="btn-primary px-6"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-text-muted mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

