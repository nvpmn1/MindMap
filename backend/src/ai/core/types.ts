/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NeuralMap AI Engine — Core Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Complete type system for the AI engine. Every interface, type, and enum
 * used across the entire AI subsystem is defined here for maximum
 * type safety and discoverability.
 * 
 * Architecture based on Claude API best practices:
 * - Structured Outputs (strict tool schemas)
 * - Extended Thinking (chain-of-thought)
 * - Tool Use with multi-turn conversations
 * - Prompt Caching (cache_control)
 * - Streaming (SSE event types)
 * - Citations and source tracking
 * - Guardrails and content filtering
 */

// ═══════════════════════════════════════════════════════════════════════════
// MODEL TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ModelTier = 'lightweight' | 'balanced' | 'advanced';

export type ModelId = 
  | 'claude-haiku-4-5'
  | 'claude-sonnet-4-5'
  | 'claude-opus-4-6';

export interface ModelConfig {
  id: ModelId;
  name: string;
  tier: ModelTier;
  costPerInputToken: number;    // USD per token
  costPerOutputToken: number;   // USD per token
  costPerCachedToken: number;   // USD per cached token
  maxContextTokens: number;
  maxOutputTokens: number;
  supportsVision: boolean;
  supportsToolUse: boolean;
  supportsStreaming: boolean;
  supportsExtendedThinking: boolean;
  supportsCaching: boolean;
  supportsCitations: boolean;
  supportsWebSearch: boolean;
  bestFor: string[];
  description: string;
}

export interface ModelSelection {
  modelId: ModelId;
  modelName: string;
  tier: ModelTier;
  reason: string;
  complexityScore: number;
  complexityLevel: ComplexityLevel;
  estimatedCost: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPLEXITY ANALYSIS  
// ═══════════════════════════════════════════════════════════════════════════

export type ComplexityLevel = 'trivial' | 'simple' | 'moderate' | 'complex' | 'expert';

export interface ComplexityAnalysis {
  level: ComplexityLevel;
  score: number;              // 0-100
  factors: ComplexityFactor[];
  reasoning: string;
}

export interface ComplexityFactor {
  name: string;
  weight: number;
  value: number;
  description: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type AgentType = 
  | 'generate'      // Idea generation / brainstorming
  | 'expand'        // Node expansion with sub-concepts
  | 'summarize'     // Content summarization
  | 'analyze'       // Deep pattern analysis
  | 'organize'      // Auto-organization and structuring
  | 'research'      // Web research and information gathering
  | 'hypothesize'   // Hypothesis generation and testing
  | 'task_convert'  // Convert nodes to actionable tasks
  | 'chat'          // Conversational assistant
  | 'critique'      // Critical analysis and improvement
  | 'connect'       // Find hidden connections between nodes
  | 'visualize';    // Suggest visual improvements

export interface AgentConfig {
  type: AgentType;
  name: string;
  description: string;
  icon: string;
  color: string;
  defaultModel: ModelTier;
  maxTokens: number;
  temperature: number;
  topP?: number;
  topK?: number;
  requiredTools: string[];
  optionalTools: string[];
  systemPromptKey: string;
  supportsCaching: boolean;
  supportsStreaming: boolean;
  estimatedDuration: string;   // e.g., "2-5s", "10-30s"
  capabilities: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// TOOL TYPES (Claude Tool Use)
// ═══════════════════════════════════════════════════════════════════════════

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, ToolPropertySchema>;
    required: string[];
  };
  category: ToolCategory;
  cacheable: boolean;
  strict?: boolean;  // Structured Outputs - guaranteed schema
}

export type ToolCategory = 
  | 'map_manipulation'    // Create, update, delete nodes/edges
  | 'map_analysis'        // Analyze map structure
  | 'task_management'     // Create, update tasks
  | 'search'              // Web search and information retrieval
  | 'organization'        // Auto-layout, clustering
  | 'data_extraction'     // Extract structured data
  | 'visualization';      // Chart/diagram suggestions

export interface ToolPropertySchema {
  type: string;
  description?: string;
  enum?: string[];
  items?: ToolPropertySchema;
  properties?: Record<string, ToolPropertySchema>;
  required?: string[];
  default?: any;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, any>;
}

export interface ToolResult {
  tool_use_id: string;
  type: 'tool_result';
  content: string | ToolResultContent[];
  is_error?: boolean;
}

export interface ToolResultContent {
  type: 'text' | 'image';
  text?: string;
  source?: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE TYPES (Claude Messages API)
// ═══════════════════════════════════════════════════════════════════════════

export interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result' | 'image' | 'document';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, any>;
  source?: ImageSource | DocumentSource;
  cache_control?: CacheControl;
  citations?: CitationConfig;
}

export interface ImageSource {
  type: 'base64' | 'url';
  media_type?: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  data?: string;
  url?: string;
}

export interface DocumentSource {
  type: 'base64' | 'text' | 'url';
  media_type?: 'application/pdf' | 'text/plain';
  data?: string;
  url?: string;
}

export interface CacheControl {
  type: 'ephemeral';
  ttl?: '5m' | '1h';
}

export interface CitationConfig {
  enabled: boolean;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

/** Alias for Message — used across the AI engine */
export type ConversationMessage = Message;

export interface SystemPrompt {
  text: string;
  cache_control?: CacheControl;
}

// ═══════════════════════════════════════════════════════════════════════════
// API REQUEST/RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ClaudeRequestConfig {
  model: ModelId;
  max_tokens: number;
  messages: Message[];
  system?: string | SystemPrompt[];
  tools?: ToolDefinition[];
  tool_choice?: ToolChoice;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stream?: boolean;
  metadata?: RequestMetadata;
  stop_sequences?: string[];
}

export type ToolChoice = 
  | { type: 'auto' }
  | { type: 'any' }
  | { type: 'none' }
  | { type: 'tool'; name: string };

export interface RequestMetadata {
  user_id?: string;
}

export interface ClaudeResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: ContentBlock[];
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use';
  usage: TokenUsage;
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// ORCHESTRATOR TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface OrchestratorInput {
  agentType: AgentType;
  mapId: string;
  userId: string;
  input: Record<string, any>;
  options: AgentExecutionOptions;
}

export interface AgentExecutionOptions {
  model?: ModelTier | 'auto';
  maxTokens?: number;
  temperature?: number;
  enableCaching?: boolean;
  enableCitations?: boolean;
  enableWebSearch?: boolean;
  enableStreaming?: boolean;
  enableChainOfThought?: boolean;
  enableGuardrails?: boolean;
  conversationId?: string;
  parentRunId?: string;
  priority?: 'low' | 'normal' | 'high';
  timeout?: number;
  retryCount?: number;
  [key: string]: any;
}

export interface OrchestratorResult {
  runId: string;
  agentType: AgentType;
  status: 'completed' | 'failed' | 'cancelled' | 'timeout';
  suggestions?: any[];
  summary?: string;
  response?: string;
  analysis?: AnalysisResult;
  connections?: ConnectionResult[];
  tasks?: TaskResult[];
  tokensInput: number;
  tokensOutput: number;
  tokensCached: number;
  durationMs: number;
  modelUsed: string;
  modelTier: ModelTier;
  estimatedCost: number;
  chainOfThought?: string;
  citations?: Citation[];
  error?: string;
  metadata?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYSIS & INTELLIGENCE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface AnalysisResult {
  patterns: Pattern[];
  clusters: Cluster[];
  gaps: Gap[];
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  overallScore: number;        // 0-100
  recommendations: Recommendation[];
}

export interface Pattern {
  type: 'theme' | 'hierarchy' | 'cycle' | 'convergence' | 'divergence';
  description: string;
  involvedNodeIds: string[];
  confidence: number;          // 0-1
}

export interface Cluster {
  id: string;
  name: string;
  nodeIds: string[];
  centroidLabel: string;
  cohesion: number;            // 0-1
  description: string;
}

export interface Gap {
  type: 'missing_topic' | 'missing_connection' | 'underdeveloped' | 'isolated_node';
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestedAction: string;
  relatedNodeIds: string[];
}

export interface Recommendation {
  type: 'add' | 'remove' | 'connect' | 'reorganize' | 'expand' | 'merge';
  priority: 'low' | 'medium' | 'high';
  description: string;
  impact: string;
  effort: 'minimal' | 'moderate' | 'significant';
}

export interface ConnectionResult {
  sourceNodeId: string;
  targetNodeId: string;
  type: 'causal' | 'temporal' | 'hierarchical' | 'associative' | 'contradictory';
  strength: number;            // 0-1
  description: string;
  evidence: string;
}

export interface TaskResult {
  nodeId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHours: number;
  tags: string[];
  checklist: ChecklistItem[];
  suggestedAssigneeId?: string;
  dependencies: string[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// CITATION TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Citation {
  type: 'char_location' | 'page_location' | 'web_search_result';
  cited_text: string;
  document_title?: string;
  url?: string;
  start_index?: number;
  end_index?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// STREAMING TYPES (SSE Events)
// ═══════════════════════════════════════════════════════════════════════════

export type StreamEventType = 
  | 'thinking_start'       // Agent starts thinking
  | 'thinking_update'      // Chain-of-thought update
  | 'thinking_complete'    // Thinking phase done
  | 'model_selected'       // Auto model selection info
  | 'text_start'           // Text generation begins
  | 'text_delta'           // Incremental text
  | 'text_complete'        // Text block complete
  | 'tool_start'           // Tool call begins
  | 'tool_input_delta'     // Tool input streaming
  | 'tool_complete'        // Tool call complete
  | 'tool_result'          // Tool execution result
  | 'progress'             // Progress update
  | 'plan_update'          // Execution plan update
  | 'cost_update'          // Cost tracking update
  | 'complete'             // Entire response complete
  | 'error'                // Error occurred
  | 'done';                // Stream finished

export interface StreamEvent {
  type: StreamEventType;
  data: any;
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// MEMORY & CONTEXT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ConversationContext {
  id: string;
  mapId: string;
  userId: string;
  messages: Message[];
  totalTokens: number;
  createdAt: Date;
  lastActivityAt: Date;
  metadata: Record<string, any>;
}

export interface ContextWindow {
  maxTokens: number;
  usedTokens: number;
  availableTokens: number;
  cachedTokens: number;
  segments: ContextSegment[];
}

export interface ContextSegment {
  type: 'system' | 'history' | 'map_context' | 'tool_results' | 'user_input';
  tokens: number;
  priority: number;           // Higher = keep when truncating
  content: string;
  cached: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// GUARDRAIL TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface GuardrailResult {
  passed: boolean;
  flags: GuardrailFlag[];
  sanitizedInput?: string;
  blockedReason?: string;
}

export interface GuardrailFlag {
  type: 'harmful_content' | 'pii_detected' | 'injection_attempt' | 'off_topic' | 'excessive_length';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  action: 'allow' | 'warn' | 'sanitize' | 'block';
}

// ═══════════════════════════════════════════════════════════════════════════
// COST TRACKING TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  inputCost: number;
  outputCost: number;
  cacheSavings: number;
  totalCost: number;
  currency: 'USD';
}

export interface UsageStats {
  period: string;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCachedTokens: number;
  totalCost: number;
  avgDuration: number;
  byAgent: Record<AgentType, number>;
  byModel: Record<string, number>;
  cacheSavings: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// BETA FEATURES FLAGS
// ═══════════════════════════════════════════════════════════════════════════

export type BetaFeature =
  | 'prompt-caching-2024-07-31'
  | 'token-efficient-tools-2025-02-19'
  | 'output-128k-2025-02-19'
  | 'extended-cache-ttl-2025-04-11'
  | 'interleaved-thinking-2025-05-14'
  | 'code-execution-2025-05-22'
  | 'mcp-client-2025-11-20'
  | 'fast-mode-2026-02-01';

export interface BetaConfig {
  enabledFeatures: BetaFeature[];
  experimentalFlags: Record<string, boolean>;
}
