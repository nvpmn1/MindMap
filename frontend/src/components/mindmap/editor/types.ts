// ============================================================================
// NeuralMap Editor - Core Type Definitions
// ============================================================================

import { Node, Edge } from '@xyflow/react';

// ─── Node Types ─────────────────────────────────────────────────────────────

export type NeuralNodeType = 
  | 'central'    // Root/central topic
  | 'idea'       // Creative ideas
  | 'task'       // Actionable tasks  
  | 'note'       // Text notes
  | 'reference'  // External references/links
  | 'research'   // Research & analysis
  | 'data'       // Data visualization (charts/tables)
  | 'group'      // Container group
  | 'milestone'  // Project milestones
  | 'question'   // Open questions/hypotheses
  | 'decision'   // Decision points
  | 'resource';  // Team/resource allocation

export type NodeStatus = 'draft' | 'active' | 'in_progress' | 'review' | 'completed' | 'archived';
export type NodePriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';
export type ViewMode = 'map' | 'list' | 'kanban' | 'timeline' | 'analytics';
export type ConnectionStyle = 'neural' | 'bezier' | 'straight' | 'step' | 'animated';

// ─── Chart/Data Types ───────────────────────────────────────────────────────

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'radar' | 'area' | 'scatter' | 'gauge';
  title: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}

export interface TableData {
  columns: Array<{ key: string; label: string; type: 'text' | 'number' | 'date' | 'status' | 'avatar' }>;
  rows: Array<Record<string, unknown>>;
}

// ─── Checklist ──────────────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  assignee?: string;
  dueDate?: string;
}

// ─── Attachment ─────────────────────────────────────────────────────────────

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file' | 'link' | 'video';
  size?: number;
  thumbnail?: string;
  uploadedBy?: string;
  uploadedAt?: string;
}

// ─── Comment ────────────────────────────────────────────────────────────────

export interface NodeComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userColor: string;
  content: string;
  createdAt: string;
  reactions?: Array<{ emoji: string; users: string[] }>;
  replies?: NodeComment[];
}

// ─── AI Context ─────────────────────────────────────────────────────────────

export interface AIContext {
  generated: boolean;
  model?: string;
  prompt?: string;
  confidence?: number;
  suggestions?: string[];
  reasoning?: string;
  hypotheses?: Array<{ text: string; probability: number }>;
  sources?: Array<{ title: string; url: string; relevance: number }>;
}

// ─── Node Data ──────────────────────────────────────────────────────────────

export interface NeuralNodeData {
  label: string;
  type: NeuralNodeType;
  description?: string;
  content?: string;
  
  // Status & Progress
  status: NodeStatus;
  priority: NodePriority;
  progress: number; // 0-100
  
  // Metrics
  impact: number;    // 0-100
  effort: number;    // 0-100
  confidence: number; // 0-100
  
  // Visual
  color?: string;
  icon?: string;
  tags: string[];
  collapsed?: boolean;
  pinned?: boolean;
  
  // Rich Content
  chart?: ChartData;
  table?: TableData;
  checklist?: ChecklistItem[];
  attachments?: Attachment[];
  
  // Collaboration
  creator?: CollaboratorInfo;
  owner?: CollaboratorInfo;
  assignees?: CollaboratorInfo[];
  comments?: NodeComment[];
  lastEditedBy?: CollaboratorInfo;
  lastEditedAt?: string;
  
  // AI
  ai?: AIContext;
  
  // Research specific
  sources?: Array<{
    id: string;
    title: string;
    url?: string;
    type: 'paper' | 'article' | 'book' | 'website' | 'video' | 'podcast';
    author?: string;
    date?: string;
    excerpt?: string;
  }>;
  
  // Task specific
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  
  // Question/Decision specific
  options?: Array<{
    id: string;
    text: string;
    votes: number;
    voters: string[];
    pros?: string[];
    cons?: string[];
  }>;
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
  version?: number;
  
  // Computed
  childCount?: number;
  connectionCount?: number;
  commentCount?: number;
  depth?: number;
  
  [key: string]: unknown;
}

// ─── Collaborator ───────────────────────────────────────────────────────────

export interface CollaboratorInfo {
  id: string;
  displayName: string;
  avatarUrl?: string;
  color: string;
  email?: string;
  role?: 'owner' | 'editor' | 'viewer' | 'commenter';
  isOnline?: boolean;
  lastSeen?: string;
  cursor?: { x: number; y: number };
}

// ─── Map Types ──────────────────────────────────────────────────────────────

export type PowerNode = Node<NeuralNodeData>;
export type PowerEdge = Edge<{
  label?: string;
  style?: ConnectionStyle;
  strength?: number;
  animated?: boolean;
  color?: string;
}>;

export interface MapInfo {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  workspaceId?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  isTemplate?: boolean;
  isPublic?: boolean;
  tags?: string[];
  stats?: {
    totalNodes: number;
    totalEdges: number;
    totalComments: number;
    totalCollaborators: number;
    completionRate: number;
    lastActivity: string;
  };
}

// ─── AI Agent Types ─────────────────────────────────────────────────────────

export type AIAgentMode = 'assistant' | 'agent' | 'research' | 'creative' | 'analytical';

export interface AIAgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'agent';
  content: string;
  timestamp: string;
  metadata?: {
    model?: string;
    tokens?: number;
    duration?: number;
    mode?: AIAgentMode;
    actions?: AIAgentAction[];
    reasoning?: string;
    confidence?: number;
    usage?: { input_tokens: number; output_tokens: number };
    todoList?: Array<{ id: string; title: string; status: string; detail?: string }>;
  };
}

export interface AIAgentAction {
  type: 'create_node' | 'update_node' | 'delete_node' | 'create_edge' | 'delete_edge' |
        'batch_create_nodes' | 'batch_update_nodes' |
        'rearrange' | 'analyze' | 'analyze_map' | 'research' | 'generate_chart' | 
        'summarize' | 'expand' | 'suggest' | 'create_tasks' | 'hypothesize' |
        'reorganize_map' | 'find_nodes' | string;
  description: string;
  data?: unknown;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

export interface AIAgentConfig {
  model: string;
  mode: AIAgentMode;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  tools: string[];
  autoExecute: boolean;
}

// ─── Editor State ───────────────────────────────────────────────────────────

export interface EditorSettings {
  showGrid: boolean;
  showMinimap: boolean;
  snapToGrid: boolean;
  gridSize: number;
  isLocked: boolean;
  connectionStyle: ConnectionStyle;
  autoSave: boolean;
  autoSaveInterval: number;
  animateEdges: boolean;
  showNodeStats: boolean;
  compactMode: boolean;
}

export interface EditorState {
  mapInfo: MapInfo | null;
  nodes: PowerNode[];
  edges: PowerEdge[];
  selectedNodeId: string | null;
  viewMode: ViewMode;
  settings: EditorSettings;
  collaborators: CollaboratorInfo[];
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  undoStack: Array<{ nodes: PowerNode[]; edges: PowerEdge[] }>;
  redoStack: Array<{ nodes: PowerNode[]; edges: PowerEdge[] }>;
}

// ─── Event Types ────────────────────────────────────────────────────────────

export interface EditorEvent {
  type: string;
  payload: unknown;
  timestamp: number;
  source: 'user' | 'ai' | 'collaboration' | 'system';
}

export interface MapAnalytics {
  nodesByType: Record<NeuralNodeType, number>;
  nodesByStatus: Record<NodeStatus, number>;
  nodesByPriority: Record<NodePriority, number>;
  completionRate: number;
  averageProgress: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  activeCollaborators: number;
  aiGeneratedNodes: number;
  depthDistribution: Record<number, number>;
  connectionDensity: number;
  mostConnectedNodes: Array<{ id: string; label: string; connections: number }>;
  recentActivity: Array<{
    type: string;
    userId: string;
    userName: string;
    timestamp: string;
    description: string;
  }>;
}
