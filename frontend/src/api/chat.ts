import api from './client'

export interface WebUIToken {
  api_key: string
  api_base_url: string
  expires_at?: string | null
}

export const getWebUIToken = async (): Promise<WebUIToken> => {
  const response = await api.get('/auth/webui-token')
  return response.data
}

export interface Conversation {
  id: number
  user_id: number
  model_id?: number
  api_service_id?: number
  title?: string
  is_active: boolean
  created_at: string
  updated_at?: string
  last_message_at?: string
  message_count?: number
}

export interface Message {
  id: number
  conversation_id: number
  role: string
  content: string
  model_name?: string
  api_service_id?: number
  tokens_used?: number
  cost?: string
  metadata?: any
  created_at: string
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[]
}

export interface ChatCompletionRequest {
  conversation_id?: number
  message: string
  model_id?: number
  api_service_id?: number
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export interface ChatCompletionResponse {
  conversation_id: number
  message: Message
  assistant_message: Message
  tokens_used?: number
  cost?: string
}

export const chatApi = {
  // Create conversation
  createConversation: async (data: { title?: string; model_id?: number; api_service_id?: number }) => {
    const response = await api.post<Conversation>('/chat/conversations', data)
    return response.data
  },

  // Get all conversations
  getConversations: async (activeOnly: boolean = true) => {
    const response = await api.get<Conversation[]>('/chat/conversations', {
      params: { active_only: activeOnly }
    })
    return response.data
  },

  // Get conversation with messages
  getConversation: async (conversationId: number) => {
    const response = await api.get<ConversationWithMessages>(`/chat/conversations/${conversationId}`)
    return response.data
  },

  // Update conversation title
  updateTitle: async (conversationId: number, title: string) => {
    const response = await api.put(`/chat/conversations/${conversationId}/title`, null, {
      params: { title }
    })
    return response.data
  },

  // Delete conversation
  deleteConversation: async (conversationId: number) => {
    const response = await api.delete(`/chat/conversations/${conversationId}`)
    return response.data
  },

  // Send message and get AI response
  sendMessage: async (data: ChatCompletionRequest) => {
    const response = await api.post<ChatCompletionResponse>('/chat/completions', data)
    return response.data
  },

  // Upload file attachment
  uploadAttachment: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/chat/upload-attachment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // Send message with files
  sendMessageWithFiles: async (message: string, files: File[], conversationId?: number, modelId?: number) => {
    const formData = new FormData()
    formData.append('message', message)
    if (conversationId) formData.append('conversation_id', conversationId.toString())
    if (modelId) formData.append('model_id', modelId.toString())
    files.forEach(file => {
      formData.append('files', file)
    })
    const response = await api.post<ChatCompletionResponse>('/chat/completions-with-files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }
}

