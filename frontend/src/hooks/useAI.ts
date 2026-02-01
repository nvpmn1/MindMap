// ============================================================================
// MindMap Hub - AI Service Hook
// ============================================================================
// Hook para interações com a API de IA (Claude)
// ============================================================================

import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ============================================================================
// Types
// ============================================================================

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    tokens_used?: number
    model?: string
    suggestions?: AISuggestion[]
  }
}

export interface AISuggestion {
  id: string
  type: 'idea' | 'task' | 'connection' | 'restructure'
  title: string
  description: string
  content?: string
  metadata?: Record<string, any>
}

export interface AIExpandRequest {
  node_id: string
  context?: string
  depth?: number
  style?: 'brainstorm' | 'structured' | 'creative'
}

export interface AIExpandResponse {
  suggestions: AISuggestion[]
  reasoning: string
}

export interface AIChatRequest {
  map_id: string
  message: string
  context?: {
    selected_node_id?: string
    recent_nodes?: string[]
  }
}

export interface AIChatResponse {
  response: string
  suggestions?: AISuggestion[]
  actions?: AIAction[]
}

export interface AIAction {
  type: 'create_node' | 'update_node' | 'delete_node' | 'connect_nodes' | 'restructure'
  payload: Record<string, any>
  description: string
}

export interface AIAnalyzeRequest {
  map_id: string
  analysis_type: 'structure' | 'completeness' | 'connections' | 'priorities'
}

export interface AIAnalyzeResponse {
  analysis: string
  insights: AIInsight[]
  suggestions: AISuggestion[]
}

export interface AIInsight {
  type: 'warning' | 'info' | 'success'
  title: string
  description: string
}

// ============================================================================
// API Functions
// ============================================================================

const aiApi = {
  expandNode: async (request: AIExpandRequest): Promise<AIExpandResponse> => {
    return api.post('/ai/expand', request)
  },

  chat: async (request: AIChatRequest): Promise<AIChatResponse> => {
    return api.post('/ai/chat', request)
  },

  analyze: async (request: AIAnalyzeRequest): Promise<AIAnalyzeResponse> => {
    return api.post('/ai/analyze', request)
  },

  generateTasks: async (nodeId: string): Promise<{ tasks: AISuggestion[] }> => {
    return api.post(`/ai/generate-tasks/${nodeId}`)
  },

  summarize: async (mapId: string): Promise<{ summary: string }> => {
    return api.post(`/ai/summarize/${mapId}`)
  },

  suggestConnections: async (mapId: string): Promise<{ connections: AISuggestion[] }> => {
    return api.post(`/ai/suggest-connections/${mapId}`)
  }
}

// ============================================================================
// AI Hook
// ============================================================================

export function useAI(mapId: string) {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)

  // Expand node mutation
  const expandMutation = useMutation({
    mutationFn: aiApi.expandNode,
    onMutate: () => setIsTyping(true),
    onSettled: () => setIsTyping(false)
  })

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: aiApi.chat,
    onMutate: (request) => {
      setIsTyping(true)
      // Add user message immediately
      const userMessage: AIMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: request.message,
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, userMessage])
    },
    onSuccess: (response) => {
      // Add assistant response
      const assistantMessage: AIMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        metadata: {
          suggestions: response.suggestions
        }
      }
      setMessages((prev) => [...prev, assistantMessage])
    },
    onSettled: () => setIsTyping(false)
  })

  // Analyze mutation
  const analyzeMutation = useMutation({
    mutationFn: aiApi.analyze,
    onMutate: () => setIsTyping(true),
    onSettled: () => setIsTyping(false)
  })

  // Generate tasks mutation
  const generateTasksMutation = useMutation({
    mutationFn: aiApi.generateTasks,
    onMutate: () => setIsTyping(true),
    onSettled: () => setIsTyping(false)
  })

  // Summarize mutation
  const summarizeMutation = useMutation({
    mutationFn: aiApi.summarize,
    onMutate: () => setIsTyping(true),
    onSettled: () => setIsTyping(false)
  })

  // Suggest connections mutation
  const suggestConnectionsMutation = useMutation({
    mutationFn: aiApi.suggestConnections,
    onMutate: () => setIsTyping(true),
    onSettled: () => setIsTyping(false)
  })

  // Send message
  const sendMessage = useCallback(
    async (message: string, selectedNodeId?: string) => {
      return chatMutation.mutateAsync({
        map_id: mapId,
        message,
        context: {
          selected_node_id: selectedNodeId
        }
      })
    },
    [mapId, chatMutation]
  )

  // Expand node with AI
  const expandNode = useCallback(
    async (nodeId: string, options?: { depth?: number; style?: 'brainstorm' | 'structured' | 'creative' }) => {
      return expandMutation.mutateAsync({
        node_id: nodeId,
        ...options
      })
    },
    [expandMutation]
  )

  // Analyze map
  const analyzeMap = useCallback(
    async (type: 'structure' | 'completeness' | 'connections' | 'priorities') => {
      return analyzeMutation.mutateAsync({
        map_id: mapId,
        analysis_type: type
      })
    },
    [mapId, analyzeMutation]
  )

  // Generate tasks from node
  const generateTasks = useCallback(
    async (nodeId: string) => {
      return generateTasksMutation.mutateAsync(nodeId)
    },
    [generateTasksMutation]
  )

  // Summarize map
  const summarizeMap = useCallback(async () => {
    return summarizeMutation.mutateAsync(mapId)
  }, [mapId, summarizeMutation])

  // Suggest connections
  const suggestConnections = useCallback(async () => {
    return suggestConnectionsMutation.mutateAsync(mapId)
  }, [mapId, suggestConnectionsMutation])

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    // State
    messages,
    isTyping,
    isLoading: expandMutation.isPending || chatMutation.isPending || analyzeMutation.isPending,
    error: expandMutation.error || chatMutation.error || analyzeMutation.error,

    // Actions
    sendMessage,
    expandNode,
    analyzeMap,
    generateTasks,
    summarizeMap,
    suggestConnections,
    clearMessages,

    // Raw mutations for advanced usage
    expandMutation,
    chatMutation,
    analyzeMutation
  }
}

// ============================================================================
// Quick AI Actions Hook
// ============================================================================

export function useAIQuickActions(mapId: string) {
  const ai = useAI(mapId)

  const quickActions = [
    {
      id: 'expand',
      label: 'Expandir ideia',
      description: 'Gere novas ideias relacionadas',
      icon: 'Sparkles',
      action: ai.expandNode
    },
    {
      id: 'tasks',
      label: 'Gerar tarefas',
      description: 'Transforme em tarefas acionáveis',
      icon: 'ListTodo',
      action: ai.generateTasks
    },
    {
      id: 'analyze',
      label: 'Analisar estrutura',
      description: 'Analise a organização do mapa',
      icon: 'Search',
      action: () => ai.analyzeMap('structure')
    },
    {
      id: 'connections',
      label: 'Sugerir conexões',
      description: 'Encontre relações entre ideias',
      icon: 'Share2',
      action: ai.suggestConnections
    },
    {
      id: 'summarize',
      label: 'Resumir mapa',
      description: 'Gere um resumo do conteúdo',
      icon: 'FileText',
      action: ai.summarizeMap
    }
  ]

  return {
    quickActions,
    ...ai
  }
}

export default useAI
