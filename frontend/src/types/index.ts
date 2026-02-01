// ============================================================================
// MindMap Hub - TypeScript Types
// ============================================================================
// Tipos compartilhados para toda a aplicação
// ============================================================================

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

// ============================================================================
// Workspace Types
// ============================================================================

export interface Workspace {
  id: string
  name: string
  slug: string
  owner_id: string
  settings?: WorkspaceSettings
  created_at: string
  updated_at: string
}

export interface WorkspaceSettings {
  default_theme?: 'light' | 'dark' | 'system'
  features?: {
    ai_enabled?: boolean
    realtime_enabled?: boolean
  }
}

export interface WorkspaceMember {
  workspace_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  user?: User
  joined_at: string
}

// ============================================================================
// MindMap Types
// ============================================================================

export interface MindMap {
  id: string
  workspace_id: string
  owner_id: string
  name: string
  description?: string
  is_public: boolean
  is_favorite: boolean
  is_archived: boolean
  settings?: MindMapSettings
  node_count?: number
  collaborators?: MapCollaborator[]
  created_at: string
  updated_at: string
}

export interface MindMapSettings {
  theme?: string
  layout?: 'radial' | 'tree' | 'force'
  background?: string
  grid_enabled?: boolean
  snap_to_grid?: boolean
  auto_save?: boolean
}

export interface MapCollaborator {
  map_id: string
  user_id: string
  role: 'editor' | 'commenter' | 'viewer'
  user?: User
  invited_at: string
}

export interface CreateMapInput {
  name: string
  description?: string
  workspace_id?: string
  is_public?: boolean
  settings?: MindMapSettings
}

export interface UpdateMapInput {
  name?: string
  description?: string
  is_public?: boolean
  is_favorite?: boolean
  is_archived?: boolean
  settings?: MindMapSettings
}

// ============================================================================
// Node Types
// ============================================================================

export type NodeType = 'idea' | 'task' | 'note'

export interface MindMapNode {
  id: string
  map_id: string
  parent_id?: string | null
  node_type: NodeType
  content: string
  position_x: number
  position_y: number
  color?: string
  emoji?: string
  metadata?: NodeMetadata
  children?: MindMapNode[]
  created_at: string
  updated_at: string
}

export interface NodeMetadata {
  // Common
  description?: string
  labels?: string[]
  
  // Task specific
  status?: TaskStatus
  priority?: Priority
  due_date?: string
  assignee?: string
  completed?: boolean
  completed_at?: string
  subtasks?: Subtask[]
  
  // Note specific
  collapsed?: boolean
  pinned?: boolean
  
  // AI
  ai_generated?: boolean
  ai_expanded?: boolean
  
  // Custom
  [key: string]: unknown
}

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface Subtask {
  id: string
  content: string
  completed: boolean
}

export interface CreateNodeInput {
  node_type: NodeType
  content: string
  parent_id?: string
  position_x?: number
  position_y?: number
  color?: string
  emoji?: string
  metadata?: NodeMetadata
}

export interface UpdateNodeInput {
  content?: string
  position_x?: number
  position_y?: number
  color?: string
  emoji?: string
  metadata?: NodeMetadata
  parent_id?: string | null
}

// ============================================================================
// Edge Types
// ============================================================================

export interface MindMapEdge {
  id: string
  source: string
  target: string
  type?: string
  animated?: boolean
  style?: Record<string, unknown>
}

// ============================================================================
// View Types
// ============================================================================

export type ViewMode = 'map' | 'kanban' | 'list'

// ============================================================================
// Comment Types
// ============================================================================

export interface Comment {
  id: string
  node_id: string
  user_id: string
  content: string
  user?: User
  created_at: string
  updated_at: string
}

// ============================================================================
// Activity Types
// ============================================================================

export interface Activity {
  id: string
  map_id: string
  user_id: string
  action: ActivityAction
  target_type: 'map' | 'node' | 'comment'
  target_id: string
  metadata?: Record<string, unknown>
  user?: User
  created_at: string
}

export type ActivityAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'moved'
  | 'commented'
  | 'shared'
  | 'archived'
  | 'restored'

// ============================================================================
// Realtime Types
// ============================================================================

export interface RealtimePresence {
  user_id: string
  user_name: string
  color: string
  cursor_x?: number
  cursor_y?: number
  selected_node_id?: string
  online_at: string
}

export interface RealtimeCursor {
  userId: string
  userName: string
  color: string
  x: number
  y: number
}

// ============================================================================
// API Response Types
// ============================================================================

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface APIResponse<T> {
  data: T
  message?: string
}

export interface APIError {
  message: string
  code: string
  status: number
  details?: Record<string, unknown>
}
