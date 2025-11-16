import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { chatApi, Conversation, ConversationWithMessages } from '../api/chat'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import ModelDiscovery from '../components/ModelDiscovery'

interface PublishedModel {
  id: number
  name: string
  description?: string
  version?: string
  group_id: number
  group_name?: string
  owner_id: number
}

// Simple markdown renderer for code blocks
const renderMarkdown = (text: string) => {
  const parts: JSX.Element[] = []
  let key = 0
  
  // Split by code blocks
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  let lastIndex = 0
  let match
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textBefore = text.substring(lastIndex, match.index)
      parts.push(
        <span key={key++} className="whitespace-pre-wrap break-words">
          {formatInlineMarkdown(textBefore)}
        </span>
      )
    }
    
    // Add code block
    const language = match[1] || 'text'
    const code = match[2].trim()
    parts.push(
      <div key={key++} className="my-4">
        <div className="bg-gray-900 rounded-t-lg px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-gray-400 font-mono">{language}</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(code)
              // You could add a toast notification here
            }}
            className="text-gray-400 hover:text-white text-xs"
          >
            Copy
          </button>
        </div>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto">
          <code className="font-mono text-sm">{code}</code>
        </pre>
      </div>
    )
    
    lastIndex = match.index + match[0].length
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex)
    parts.push(
      <span key={key++} className="whitespace-pre-wrap break-words">
        {formatInlineMarkdown(remainingText)}
      </span>
    )
  }
  
  return parts.length > 0 ? parts : <span className="whitespace-pre-wrap break-words">{text}</span>
}

// Format inline markdown (bold, italic, code, links)
const formatInlineMarkdown = (text: string): (string | JSX.Element)[] => {
  const parts: (string | JSX.Element)[] = []
  let key = 0
  
  // Handle inline code
  const inlineCodeRegex = /`([^`]+)`/g
  let lastIndex = 0
  let match
  
  while ((match = inlineCodeRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }
    parts.push(
      <code key={key++} className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
        {match[1]}
      </code>
    )
    lastIndex = match.index + match[0].length
  }
  
  if (lastIndex < text.length) {
    const remaining = text.substring(lastIndex)
    // Handle bold
    const boldRegex = /\*\*(.+?)\*\*/g
    let boldLastIndex = 0
    let boldMatch
    
    while ((boldMatch = boldRegex.exec(remaining)) !== null) {
      if (boldMatch.index > boldLastIndex) {
        parts.push(remaining.substring(boldLastIndex, boldMatch.index))
      }
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>)
      boldLastIndex = boldMatch.index + boldMatch[0].length
    }
    
    if (boldLastIndex < remaining.length) {
      parts.push(remaining.substring(boldLastIndex))
    }
  }
  
  return parts.length > 0 ? parts : [text]
}

export default function Chat() {
  const user = useAuthStore((state) => state.user)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<ConversationWithMessages | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [editingTitle, setEditingTitle] = useState<number | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null)
  const [publishedModels, setPublishedModels] = useState<PublishedModel[]>([])
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null)
  const [showModelDiscovery, setShowModelDiscovery] = useState(false)
  const [attachments, setAttachments] = useState<Array<{file: File, preview?: string, data?: any}>>([])
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadConversations()
    loadPublishedModels()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [currentConversation?.messages, loading])

  useEffect(() => {
    if (currentConversation && inputRef.current) {
      inputRef.current.focus()
    }
  }, [currentConversation?.id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async () => {
    try {
      const data = await chatApi.getConversations()
      setConversations(data)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  const loadPublishedModels = async () => {
    try {
      const response = await api.get('/models/published')
      setPublishedModels(response.data || [])
    } catch (error) {
      console.error('Failed to load published models:', error)
    }
  }

  const loadConversation = async (conversationId: number) => {
    try {
      const data = await chatApi.getConversation(conversationId)
      setCurrentConversation(data)
      setSidebarOpen(false)
    } catch (error) {
      console.error('Failed to load conversation:', error)
    }
  }

  const createNewConversation = async (modelId?: number) => {
    try {
      const newConv = await chatApi.createConversation({
        title: 'New Conversation',
        model_id: modelId || selectedModelId || undefined
      })
      await loadConversations()
      await loadConversation(newConv.id)
      setSelectedModelId(modelId || selectedModelId || null)
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newAttachments = await Promise.all(
      files.map(async (file) => {
        let preview: string | undefined
        if (file.type.startsWith('image/')) {
          preview = URL.createObjectURL(file)
        }
        return { file, preview }
      })
    )

    setAttachments([...attachments, ...newAttachments])
    e.target.value = '' // Reset input
  }

  const removeAttachment = (index: number) => {
    const attachment = attachments[index]
    if (attachment.preview) {
      URL.revokeObjectURL(attachment.preview)
    }
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
        setAttachments([...attachments, { file }])
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Failed to access microphone. Please check permissions.')
    }
  }

  const stopVoiceRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
    }
  }

  const sendMessage = async () => {
    if ((!message.trim() && attachments.length === 0) || loading) return

    const messageText = message || ''
    const filesToSend = attachments.map(a => a.file)
    setMessage('')
    setLoading(true)

    if (currentConversation) {
      const tempUserMessage = {
        id: Date.now(),
        conversation_id: currentConversation.id,
        role: 'user' as const,
        content: messageText || '[Files attached]',
        tokens_used: undefined,
        created_at: new Date().toISOString(),
        metadata: attachments.length > 0 ? { attachments: attachments.map(a => ({ filename: a.file.name, type: a.file.type })) } : undefined
      }
      setCurrentConversation({
        ...currentConversation,
        messages: [...currentConversation.messages, tempUserMessage]
      })
    }

    try {
      let response
      if (filesToSend.length > 0) {
        // Send with files
        response = await chatApi.sendMessageWithFiles(
          messageText,
          filesToSend,
          currentConversation?.id,
          currentConversation?.model_id || selectedModelId || undefined
        )
      } else {
        // Send without files
        response = await chatApi.sendMessage({
          conversation_id: currentConversation?.id,
          message: messageText,
          model_id: currentConversation?.model_id || selectedModelId || undefined
        })
      }

      // Clean up attachments
      attachments.forEach(a => {
        if (a.preview) URL.revokeObjectURL(a.preview)
      })
      setAttachments([])

      if (response.conversation_id) {
        await loadConversation(response.conversation_id)
        await loadConversations()
      }
    } catch (error: any) {
      console.error('Failed to send message:', error)
      alert(error.response?.data?.detail || 'Failed to send message')
      if (currentConversation) {
        setCurrentConversation({
          ...currentConversation,
          messages: currentConversation.messages.slice(0, -1)
        })
      }
    } finally {
      setLoading(false)
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }

  const deleteConversation = async (conversationId: number) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return
    
    try {
      await chatApi.deleteConversation(conversationId)
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null)
      }
      await loadConversations()
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  const updateConversationTitle = async (conversationId: number, title: string) => {
    try {
      await chatApi.updateTitle(conversationId, title)
      await loadConversations()
      if (currentConversation?.id === conversationId) {
        setCurrentConversation({ ...currentConversation, title })
      }
      setEditingTitle(null)
    } catch (error) {
      console.error('Failed to update title:', error)
    }
  }

  const copyMessage = async (content: string, messageId: number) => {
    await navigator.clipboard.writeText(content)
    setCopiedMessageId(messageId)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-80 bg-[#171717] border-r border-gray-800 flex flex-col transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Chats</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-800 text-gray-400"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => createNewConversation()}
              className="w-full bg-white text-gray-900 px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
            <button
              onClick={() => setShowModelDiscovery(true)}
              className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-700 text-sm hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Models
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Create a new chat to get started</p>
            </div>
          ) : (
            <div className="p-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group relative p-3 rounded-lg mb-1 cursor-pointer transition-all ${
                    currentConversation?.id === conv.id
                      ? 'bg-gray-800'
                      : 'hover:bg-gray-800/50'
                  }`}
                  onClick={() => loadConversation(conv.id)}
                >
                  {editingTitle === conv.id ? (
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onBlur={() => {
                        if (newTitle.trim()) {
                          updateConversationTitle(conv.id, newTitle.trim())
                        } else {
                          setEditingTitle(null)
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          if (newTitle.trim()) {
                            updateConversationTitle(conv.id, newTitle.trim())
                          }
                        } else if (e.key === 'Escape') {
                          setEditingTitle(null)
                        }
                      }}
                      autoFocus
                      className="w-full px-2 py-1 text-sm bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {conv.title || 'Untitled Conversation'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(conv.updated_at || conv.created_at)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteConversation(conv.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400 transition-all"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setNewTitle(conv.title || '')
                          setEditingTitle(conv.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 absolute top-2 right-8 p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-300 transition-all"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Model Discovery Modal */}
      <ModelDiscovery
        isOpen={showModelDiscovery}
        onClose={() => setShowModelDiscovery(false)}
        onSelectModel={(modelId) => {
          setSelectedModelId(modelId)
          if (modelId) {
            // Create new conversation with selected model
            createNewConversation(modelId)
          } else {
            // Create new conversation without specific model
            createNewConversation()
          }
        }}
        selectedModelId={selectedModelId || currentConversation?.model_id || null}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {currentConversation.title || 'Untitled Conversation'}
                  </h3>
                  {currentConversation.model_id && (
                    <p className="text-xs text-gray-500 mt-1">
                      Model: {publishedModels.find(m => m.id === currentConversation.model_id)?.name || `ID: ${currentConversation.model_id}`}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowModelDiscovery(true)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  {selectedModelId || currentConversation.model_id ? 'Change Model' : 'Browse Models'}
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-white">
              <div className="max-w-4xl mx-auto px-6 py-8">
                {currentConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`group mb-8 ${
                      msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'
                    }`}
                  >
                    <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                          : 'bg-gradient-to-br from-gray-700 to-gray-800 text-white'
                      }`}>
                        {msg.role === 'user' ? (user?.username?.charAt(0).toUpperCase() || 'U') : 'AI'}
                      </div>
                      
                      {/* Message Content */}
                      <div className={`flex-1 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                        {/* Attachments */}
                        {msg.metadata?.attachments && Array.isArray(msg.metadata.attachments) && (
                          <div className="mb-2 space-y-2">
                            {msg.metadata.attachments.map((attachment: any, idx: number) => {
                              const attachmentUrl = attachment.url || attachment.ipfs_gateway_url || `/api/chat/attachments/${attachment.minio_path?.split('/').slice(1).join('/')}`
                              
                              if (attachment.content_type?.startsWith('image/')) {
                                return (
                                  <div key={idx} className="rounded-lg overflow-hidden border border-gray-200 max-w-md">
                                    <img
                                      src={attachmentUrl}
                                      alt={attachment.filename || 'Image'}
                                      className="max-w-full h-auto"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/placeholder-image.png'
                                      }}
                                    />
                                  </div>
                                )
                              } else if (attachment.content_type?.startsWith('audio/')) {
                                return (
                                  <div key={idx} className="bg-gray-100 rounded-lg p-3 max-w-md">
                                    <audio controls className="w-full">
                                      <source src={attachmentUrl} type={attachment.content_type} />
                                      Your browser does not support audio playback.
                                    </audio>
                                    <p className="text-xs text-gray-500 mt-1">{attachment.filename || 'Audio'}</p>
                                  </div>
                                )
                              } else {
                                return (
                                  <div key={idx} className="bg-gray-100 rounded-lg p-3 max-w-md">
                                    <div className="flex items-center gap-2">
                                      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                          {attachment.filename || 'File'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {attachment.file_size ? `${(attachment.file_size / 1024).toFixed(1)} KB` : ''}
                                        </p>
                                      </div>
                                      <a
                                        href={attachmentUrl}
                                        download={attachment.filename}
                                        className="text-blue-600 hover:text-blue-700"
                                      >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                      </a>
                                    </div>
                                  </div>
                                )
                              }
                            })}
                          </div>
                        )}
                        
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-50 text-gray-900 border border-gray-200'
                          }`}
                        >
                          <div className="prose prose-sm max-w-none">
                            {msg.role === 'assistant' ? renderMarkdown(msg.content) : (
                              <p className="whitespace-pre-wrap break-words m-0">{msg.content}</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Message Actions */}
                        <div className={`flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                          msg.role === 'user' ? 'flex-row-reverse' : ''
                        }`}>
                          <button
                            onClick={() => copyMessage(msg.content, msg.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                            title="Copy message"
                          >
                            {copiedMessageId === msg.id ? (
                              <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                          {msg.tokens_used && (
                            <span className="text-xs text-gray-400">
                              {msg.tokens_used} tokens
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex gap-4 justify-start mb-8">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white text-sm font-semibold">
                      AI
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 bg-white">
              <div className="max-w-4xl mx-auto px-6 py-4">
                {/* Attachments Preview */}
                {attachments.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {attachments.map((attachment, index) => (
                      <div key={index} className="relative group">
                        {attachment.preview ? (
                          <div className="relative">
                            <img
                              src={attachment.preview}
                              alt={attachment.file.name}
                              className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                              onClick={() => removeAttachment(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : attachment.file.type.startsWith('audio/') ? (
                          <div className="bg-gray-100 rounded-lg p-2 border border-gray-200 relative group">
                            <div className="flex items-center gap-2">
                              <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                              </svg>
                              <span className="text-xs text-gray-700">{attachment.file.name}</span>
                            </div>
                            <button
                              onClick={() => removeAttachment(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="bg-gray-100 rounded-lg p-2 border border-gray-200 relative group">
                            <div className="flex items-center gap-2">
                              <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-xs text-gray-700 truncate max-w-[100px]">{attachment.file.name}</span>
                            </div>
                            <button
                              onClick={() => removeAttachment(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <div className="flex items-end gap-2 bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                    {/* File Upload Buttons */}
                    <div className="flex items-center gap-1 p-2">
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Upload image"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Upload file"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </button>
                      {!isRecording ? (
                        <button
                          onClick={startVoiceRecording}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Record voice"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={stopVoiceRecording}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors animate-pulse"
                          title="Stop recording"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-4h2v4zm4 0h-2v-4h2v4z" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <textarea
                      ref={inputRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Message AI..."
                      className="flex-1 px-4 py-3 bg-transparent border-0 focus:outline-none resize-none max-h-32 text-gray-900 placeholder-gray-500"
                      rows={1}
                      disabled={loading}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement
                        target.style.height = 'auto'
                        target.style.height = `${Math.min(target.scrollHeight, 128)}px`
                      }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={loading || (!message.trim() && attachments.length === 0)}
                      className="m-2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                    >
                      {loading ? (
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    AI can make mistakes. Check important info.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-6">💬</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Start a conversation
              </h2>
              <p className="text-gray-600 mb-8">
                Create a new chat or select an existing conversation from the sidebar to begin.
              </p>
              <button
                onClick={() => createNewConversation()}
                className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium inline-flex items-center gap-2"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
