/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NeuralMap AI Engine — Constants & Configuration
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Central configuration for the entire AI subsystem.
 * All magic numbers, default values, and feature flags live here.
 */

import type { ModelConfig, ModelId, AgentConfig, AgentType, BetaFeature } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// ANTHROPIC API CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const ANTHROPIC_API_VERSION = '2023-06-01';
export const ANTHROPIC_API_BASE_URL = 'https://api.anthropic.com';

/** Beta features to enable on every request */
export const ENABLED_BETA_FEATURES: BetaFeature[] = [
  'prompt-caching-2024-07-31',
  'token-efficient-tools-2025-02-19',
  'output-128k-2025-02-19',
  'extended-cache-ttl-2025-04-11',
];

// ═══════════════════════════════════════════════════════════════════════════
// MODEL REGISTRY — All available Claude models
// ═══════════════════════════════════════════════════════════════════════════

export const MODEL_REGISTRY: Record<string, ModelConfig> = {
  haiku: {
    id: 'claude-haiku-4-5' as ModelId,
    name: 'Claude Haiku 4.5',
    tier: 'lightweight',
    costPerInputToken: 0.000001,      // $1/MTok
    costPerOutputToken: 0.000005,     // $5/MTok
    costPerCachedToken: 0.0000001,    // $0.10/MTok
    maxContextTokens: 200000,
    maxOutputTokens: 64000,
    supportsVision: true,
    supportsToolUse: true,
    supportsStreaming: true,
    supportsExtendedThinking: true,
    supportsCaching: true,
    supportsCitations: true,
    supportsWebSearch: true,
    bestFor: ['chat', 'quick_answers', 'classification', 'simple_analysis', 'real_time'],
    description: 'Fastest model — ideal for real-time interactions and simple tasks',
  },
  sonnet: {
    id: 'claude-sonnet-4-5' as ModelId,
    name: 'Claude Sonnet 4.5',
    tier: 'balanced',
    costPerInputToken: 0.000003,      // $3/MTok
    costPerOutputToken: 0.000015,     // $15/MTok
    costPerCachedToken: 0.0000003,    // $0.30/MTok
    maxContextTokens: 200000,
    maxOutputTokens: 64000,
    supportsVision: true,
    supportsToolUse: true,
    supportsStreaming: true,
    supportsExtendedThinking: true,
    supportsCaching: true,
    supportsCitations: true,
    supportsWebSearch: true,
    bestFor: ['analysis', 'coding', 'creative_writing', 'reasoning', 'general_purpose'],
    description: 'Balanced performance — ideal for most tasks requiring intelligence',
  },
  opus: {
    id: 'claude-opus-4-6' as ModelId,
    name: 'Claude Opus 4.6',
    tier: 'advanced',
    costPerInputToken: 0.000005,      // $5/MTok
    costPerOutputToken: 0.000025,     // $25/MTok
    costPerCachedToken: 0.0000005,    // $0.50/MTok
    maxContextTokens: 200000,
    maxOutputTokens: 128000,
    supportsVision: true,
    supportsToolUse: true,
    supportsStreaming: true,
    supportsExtendedThinking: true,
    supportsCaching: true,
    supportsCitations: true,
    supportsWebSearch: true,
    bestFor: ['complex_reasoning', 'research', 'enterprise', 'advanced_coding', 'deep_analysis'],
    description: 'Most intelligent — for complex reasoning and critical enterprise tasks',
  },
};

/** Default model for each tier */
export const DEFAULT_MODEL_BY_TIER: Record<string, ModelId> = {
  lightweight: 'claude-haiku-4-5' as ModelId,
  balanced: 'claude-sonnet-4-5' as ModelId,
  advanced: 'claude-opus-4-6' as ModelId,
};

// ═══════════════════════════════════════════════════════════════════════════
// AGENT REGISTRY — All available AI agents
// ═══════════════════════════════════════════════════════════════════════════

export const AGENT_REGISTRY: Record<AgentType, AgentConfig> = {
  generate: {
    type: 'generate',
    name: 'Gerador Neural',
    description: 'Gera ideias criativas e conceitos originais com brainstorming avançado',
    icon: '💡',
    color: '#FFB800',
    defaultModel: 'balanced',
    maxTokens: 4096,
    temperature: 0.8,
    requiredTools: ['create_nodes', 'create_edges'],
    optionalTools: ['search_web', 'analyze_map'],
    systemPromptKey: 'generate',
    supportsCaching: true,
    supportsStreaming: true,
    estimatedDuration: '3-8s',
    capabilities: ['brainstorming', 'creative_ideation', 'concept_generation', 'lateral_thinking'],
  },
  expand: {
    type: 'expand',
    name: 'Expansor Neural',
    description: 'Aprofunda conceitos com ramificações inteligentes e sub-ideias contextuais',
    icon: '🧠',
    color: '#00D9FF',
    defaultModel: 'balanced',
    maxTokens: 4096,
    temperature: 0.7,
    requiredTools: ['create_nodes', 'create_edges'],
    optionalTools: ['analyze_map', 'search_web'],
    systemPromptKey: 'expand',
    supportsCaching: true,
    supportsStreaming: true,
    estimatedDuration: '2-6s',
    capabilities: ['depth_expansion', 'concept_detailing', 'hierarchical_thinking'],
  },
  summarize: {
    type: 'summarize',
    name: 'Sintetizador',
    description: 'Sintetiza informações complexas em resumos claros e acionáveis',
    icon: '📝',
    color: '#00FFC8',
    defaultModel: 'balanced',
    maxTokens: 4096,
    temperature: 0.3,
    requiredTools: ['update_node'],
    optionalTools: [],
    systemPromptKey: 'summarize',
    supportsCaching: true,
    supportsStreaming: true,
    estimatedDuration: '3-10s',
    capabilities: ['summarization', 'insight_extraction', 'key_point_identification'],
  },
  analyze: {
    type: 'analyze',
    name: 'Analisador Profundo',
    description: 'Analisa padrões, lacunas, SWOT e conexões ocultas no mapa mental',
    icon: '🔬',
    color: '#F472B6',
    defaultModel: 'advanced',
    maxTokens: 8192,
    temperature: 0.4,
    requiredTools: ['analyze_map', 'find_patterns'],
    optionalTools: ['create_edges', 'search_web'],
    systemPromptKey: 'analyze',
    supportsCaching: true,
    supportsStreaming: true,
    estimatedDuration: '5-15s',
    capabilities: ['pattern_detection', 'gap_analysis', 'swot', 'critical_thinking', 'deep_reasoning'],
  },
  organize: {
    type: 'organize',
    name: 'Organizador Inteligente',
    description: 'Reestrutura e organiza o mapa com clustering automático e layout otimizado',
    icon: '📊',
    color: '#60A5FA',
    defaultModel: 'balanced',
    maxTokens: 4096,
    temperature: 0.2,
    requiredTools: ['reorganize_map', 'create_clusters', 'update_layout'],
    optionalTools: ['analyze_map'],
    systemPromptKey: 'organize',
    supportsCaching: true,
    supportsStreaming: true,
    estimatedDuration: '3-8s',
    capabilities: ['auto_clustering', 'hierarchy_optimization', 'layout_suggestion'],
  },
  research: {
    type: 'research',
    name: 'Pesquisador',
    description: 'Pesquisa na web e agrega conhecimento externo ao mapa com citações',
    icon: '🔍',
    color: '#818CF8',
    defaultModel: 'advanced',
    maxTokens: 8192,
    temperature: 0.5,
    requiredTools: ['search_web', 'create_nodes'],
    optionalTools: ['create_edges', 'add_citations'],
    systemPromptKey: 'research',
    supportsCaching: true,
    supportsStreaming: true,
    estimatedDuration: '8-20s',
    capabilities: ['web_search', 'information_synthesis', 'fact_verification', 'citation_tracking'],
  },
  hypothesize: {
    type: 'hypothesize',
    name: 'Gerador de Hipóteses',
    description: 'Gera hipóteses testáveis, cenários alternativos e análise what-if',
    icon: '🔮',
    color: '#C084FC',
    defaultModel: 'advanced',
    maxTokens: 6144,
    temperature: 0.8,
    topP: 0.95,
    requiredTools: ['create_nodes', 'create_edges'],
    optionalTools: ['analyze_map', 'search_web'],
    systemPromptKey: 'hypothesize',
    supportsCaching: true,
    supportsStreaming: true,
    estimatedDuration: '5-12s',
    capabilities: ['hypothesis_generation', 'scenario_analysis', 'counterfactual_reasoning'],
  },
  task_convert: {
    type: 'task_convert',
    name: 'Conversor de Tarefas',
    description: 'Transforma conceitos em tarefas acionáveis com priorização e estimativas',
    icon: '✅',
    color: '#34D399',
    defaultModel: 'balanced',
    maxTokens: 4096,
    temperature: 0.3,
    requiredTools: ['create_tasks'],
    optionalTools: ['analyze_map'],
    systemPromptKey: 'task_convert',
    supportsCaching: true,
    supportsStreaming: true,
    estimatedDuration: '3-8s',
    capabilities: ['task_creation', 'priority_estimation', 'effort_estimation', 'dependency_mapping'],
  },
  chat: {
    type: 'chat',
    name: 'NeuralAgent',
    description: 'Assistente conversacional inteligente com visão completa do mapa mental',
    icon: '💬',
    color: '#A78BFA',
    defaultModel: 'balanced',
    maxTokens: 4096,
    temperature: 0.7,
    requiredTools: [],
    optionalTools: ['analyze_map', 'create_nodes', 'search_web', 'create_tasks'],
    systemPromptKey: 'chat',
    supportsCaching: true,
    supportsStreaming: true,
    estimatedDuration: '2-5s',
    capabilities: ['conversation', 'question_answering', 'guidance', 'multi_turn'],
  },
  critique: {
    type: 'critique',
    name: 'Crítico Analítico',
    description: 'Análise crítica construtiva com sugestões de melhoria fundamentadas',
    icon: '⚡',
    color: '#FB923C',
    defaultModel: 'advanced',
    maxTokens: 6144,
    temperature: 0.4,
    requiredTools: ['analyze_map'],
    optionalTools: ['search_web', 'create_nodes'],
    systemPromptKey: 'critique',
    supportsCaching: true,
    supportsStreaming: true,
    estimatedDuration: '5-12s',
    capabilities: ['critical_analysis', 'constructive_feedback', 'improvement_suggestions'],
  },
  connect: {
    type: 'connect',
    name: 'Conector Neural',
    description: 'Descobre conexões ocultas e relações não-óbvias entre conceitos',
    icon: '🔗',
    color: '#2DD4BF',
    defaultModel: 'advanced',
    maxTokens: 4096,
    temperature: 0.6,
    requiredTools: ['create_edges', 'analyze_map'],
    optionalTools: ['search_web'],
    systemPromptKey: 'connect',
    supportsCaching: true,
    supportsStreaming: true,
    estimatedDuration: '4-10s',
    capabilities: ['hidden_connections', 'cross_domain_linking', 'analogy_detection'],
  },
  visualize: {
    type: 'visualize',
    name: 'Visualizador',
    description: 'Sugere melhorias visuais, cores, ícones e layouts otimizados',
    icon: '🎨',
    color: '#F43F5E',
    defaultModel: 'balanced',
    maxTokens: 4096,
    temperature: 0.5,
    requiredTools: ['update_layout', 'update_node'],
    optionalTools: ['analyze_map'],
    systemPromptKey: 'visualize',
    supportsCaching: true,
    supportsStreaming: true,
    estimatedDuration: '3-6s',
    capabilities: ['visual_optimization', 'color_schemes', 'icon_suggestions', 'layout_improvement'],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPLEXITY ANALYSIS WEIGHTS
// ═══════════════════════════════════════════════════════════════════════════

/** Keywords that indicate higher complexity */
export const COMPLEXITY_KEYWORDS = {
  expert: {
    words: ['architecture', 'algorithm', 'optimize', 'security', 'performance', 
            'distributed', 'concurrent', 'enterprise', 'compliance', 'critical'],
    weight: 8,
  },
  complex: {
    words: ['research', 'analysis', 'deep', 'complex', 'strategic', 
            'comprehensive', 'integration', 'framework', 'methodology'],
    weight: 5,
  },
  moderate: {
    words: ['create', 'develop', 'design', 'plan', 'organize',
            'structure', 'evaluate', 'compare'],
    weight: 3,
  },
  simple: {
    words: ['list', 'quick', 'simple', 'basic', 'fast', 
            'easy', 'brief', 'hello', 'hi', 'help'],
    weight: -3,
  },
};

/** Agent types and their base complexity */
export const AGENT_COMPLEXITY_BASE: Record<AgentType, number> = {
  chat: 15,
  generate: 30,
  expand: 35,
  summarize: 25,
  analyze: 60,
  organize: 40,
  research: 65,
  hypothesize: 55,
  task_convert: 30,
  critique: 55,
  connect: 50,
  visualize: 25,
};

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITING & COST CONTROLS
// ═══════════════════════════════════════════════════════════════════════════

export const RATE_LIMITS = {
  requestsPerMinute: 50,
  tokensPerMinute: 100000,
  requestsPerHour: 500,
  maxConcurrentRequests: 5,
  cooldownAfterRateLimit: 30000,  // 30s cooldown
};

export const COST_LIMITS = {
  maxCostPerRequest: 0.50,        // $0.50 max per request
  maxDailyCostPerUser: 10.00,     // $10/day per user
  maxMonthlyCostPerUser: 100.00,  // $100/month per user
  warningThreshold: 0.80,         // Warn at 80% of limits
};

// ═══════════════════════════════════════════════════════════════════════════
// RETRY CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,          // 1s
  maxDelay: 30000,             // 30s
  backoffMultiplier: 2,
  retryableErrors: [
    'overloaded_error',
    'rate_limit_error',
    'api_error',
    'timeout',
    'ECONNRESET',
    'ETIMEDOUT',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT WINDOW MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

export const CONTEXT_CONFIG = {
  maxConversationHistory: 20,      // Max messages to keep
  maxMapNodesInContext: 50,        // Max nodes to send as context
  maxTokensForContext: 100000,     // Reserve tokens for context
  contextPriority: {
    system: 100,                    // Always keep system prompt
    recent_messages: 90,            // Keep recent conversation
    selected_nodes: 80,             // Currently selected content
    map_structure: 60,              // Map organization info
    historical_messages: 40,        // Older conversation
    metadata: 20,                   // Additional metadata
  },
  cacheableSections: ['system', 'map_structure'], // Sections eligible for caching
};

// ═══════════════════════════════════════════════════════════════════════════
// GUARDRAIL CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const GUARDRAIL_CONFIG = {
  maxInputLength: 50000,           // Max chars per input
  maxMessageLength: 5000,          // Max chars per chat message
  enablePIIDetection: true,
  enableInjectionDetection: true,
  enableContentModeration: true,
  blocklistPatterns: [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /you\s+are\s+now/i,
    /forget\s+(everything|all)/i,
    /system\s*:\s*override/i,
    /jailbreak/i,
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// TOKEN ESTIMATION (approximate, for pre-flight checks)
// ═══════════════════════════════════════════════════════════════════════════

export const TOKEN_ESTIMATION = {
  avgCharsPerToken: 4,             // Average characters per token for English
  avgCharsPerTokenPT: 3.5,        // Average for Portuguese (slightly more tokens)
  jsonOverheadMultiplier: 1.3,     // JSON formatting adds ~30% tokens
  toolSchemaTokens: 150,           // Average tokens per tool definition
  systemPromptBaseTokens: 500,     // Base system prompt tokens
};
