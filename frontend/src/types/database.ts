// ============================================================================
// MindMap Hub - Supabase Database Types
// ============================================================================
// Auto-generated types for Supabase database schema
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          owner_id: string
          settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          owner_id: string
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          owner_id?: string
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      workspace_members: {
        Row: {
          workspace_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          workspace_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          workspace_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
      }
      maps: {
        Row: {
          id: string
          workspace_id: string
          owner_id: string
          name: string
          description: string | null
          is_public: boolean
          is_favorite: boolean
          is_archived: boolean
          settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          owner_id: string
          name: string
          description?: string | null
          is_public?: boolean
          is_favorite?: boolean
          is_archived?: boolean
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          owner_id?: string
          name?: string
          description?: string | null
          is_public?: boolean
          is_favorite?: boolean
          is_archived?: boolean
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      map_collaborators: {
        Row: {
          map_id: string
          user_id: string
          role: string
          invited_at: string
        }
        Insert: {
          map_id: string
          user_id: string
          role?: string
          invited_at?: string
        }
        Update: {
          map_id?: string
          user_id?: string
          role?: string
          invited_at?: string
        }
      }
      nodes: {
        Row: {
          id: string
          map_id: string
          parent_id: string | null
          node_type: string
          content: string
          position_x: number
          position_y: number
          color: string | null
          emoji: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          map_id: string
          parent_id?: string | null
          node_type?: string
          content: string
          position_x?: number
          position_y?: number
          color?: string | null
          emoji?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          map_id?: string
          parent_id?: string | null
          node_type?: string
          content?: string
          position_x?: number
          position_y?: number
          color?: string | null
          emoji?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          node_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          node_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          node_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          map_id: string
          user_id: string
          action: string
          target_type: string
          target_id: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          map_id: string
          user_id: string
          action: string
          target_type: string
          target_id: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          map_id?: string
          user_id?: string
          action?: string
          target_type?: string
          target_id?: string
          metadata?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
