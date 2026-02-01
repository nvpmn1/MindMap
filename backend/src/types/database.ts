/**
 * Auto-generated Supabase Database Types
 * This should be regenerated with `npx supabase gen types typescript`
 * after any schema changes
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: 'admin' | 'member' | 'viewer';
          invited_by: string | null;
          joined_at: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role?: 'admin' | 'member' | 'viewer';
          invited_by?: string | null;
          joined_at?: string;
        };
        Update: {
          workspace_id?: string;
          user_id?: string;
          role?: 'admin' | 'member' | 'viewer';
          invited_by?: string | null;
          joined_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          color: string;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          color?: string;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          color?: string;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      maps: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          is_template: boolean;
          settings: Json;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          title: string;
          description?: string | null;
          thumbnail_url?: string | null;
          is_template?: boolean;
          settings?: Json;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          title?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          is_template?: boolean;
          settings?: Json;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      nodes: {
        Row: {
          id: string;
          map_id: string;
          parent_id: string | null;
          type: 'idea' | 'task' | 'note' | 'reference' | 'image' | 'group';
          label: string;
          content: string | null;
          position_x: number;
          position_y: number;
          width: number | null;
          height: number | null;
          style: Json;
          data: Json;
          collapsed: boolean;
          version: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          map_id: string;
          parent_id?: string | null;
          type?: 'idea' | 'task' | 'note' | 'reference' | 'image' | 'group';
          label: string;
          content?: string | null;
          position_x?: number;
          position_y?: number;
          width?: number | null;
          height?: number | null;
          style?: Json;
          data?: Json;
          collapsed?: boolean;
          version?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          map_id?: string;
          parent_id?: string | null;
          type?: 'idea' | 'task' | 'note' | 'reference' | 'image' | 'group';
          label?: string;
          content?: string | null;
          position_x?: number;
          position_y?: number;
          width?: number | null;
          height?: number | null;
          style?: Json;
          data?: Json;
          collapsed?: boolean;
          version?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      edges: {
        Row: {
          id: string;
          map_id: string;
          source_id: string;
          target_id: string;
          type: 'default' | 'step' | 'smoothstep' | 'straight' | 'bezier';
          label: string | null;
          style: Json;
          animated: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          map_id: string;
          source_id: string;
          target_id: string;
          type?: 'default' | 'step' | 'smoothstep' | 'straight' | 'bezier';
          label?: string | null;
          style?: Json;
          animated?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          map_id?: string;
          source_id?: string;
          target_id?: string;
          type?: 'default' | 'step' | 'smoothstep' | 'straight' | 'bezier';
          label?: string | null;
          style?: Json;
          animated?: boolean;
          created_at?: string;
        };
      };
      node_links: {
        Row: {
          id: string;
          source_node_id: string;
          target_node_id: string;
          link_type: 'reference' | 'related' | 'blocks' | 'blocked_by';
          created_at: string;
        };
        Insert: {
          id?: string;
          source_node_id: string;
          target_node_id: string;
          link_type?: 'reference' | 'related' | 'blocks' | 'blocked_by';
          created_at?: string;
        };
        Update: {
          id?: string;
          source_node_id?: string;
          target_node_id?: string;
          link_type?: 'reference' | 'related' | 'blocks' | 'blocked_by';
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          node_id: string;
          title: string;
          description: string | null;
          status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          due_date: string | null;
          assigned_to: string | null;
          tags: string[];
          checklist: Json;
          order_index: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          node_id: string;
          title: string;
          description?: string | null;
          status?: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          due_date?: string | null;
          assigned_to?: string | null;
          tags?: string[];
          checklist?: Json;
          order_index?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          node_id?: string;
          title?: string;
          description?: string | null;
          status?: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          due_date?: string | null;
          assigned_to?: string | null;
          tags?: string[];
          checklist?: Json;
          order_index?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          node_id: string;
          user_id: string;
          content: string;
          mentions: string[];
          parent_comment_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          node_id: string;
          user_id: string;
          content: string;
          mentions?: string[];
          parent_comment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          node_id?: string;
          user_id?: string;
          content?: string;
          mentions?: string[];
          parent_comment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'task_assigned' | 'comment_mention' | 'map_shared' | 'deadline_reminder' | 'ai_complete';
          title: string;
          message: string;
          data: Json;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'task_assigned' | 'comment_mention' | 'map_shared' | 'deadline_reminder' | 'ai_complete';
          title: string;
          message: string;
          data?: Json;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'task_assigned' | 'comment_mention' | 'map_shared' | 'deadline_reminder' | 'ai_complete';
          title?: string;
          message?: string;
          data?: Json;
          read?: boolean;
          created_at?: string;
        };
      };
      activity_events: {
        Row: {
          id: string;
          workspace_id: string;
          map_id: string | null;
          node_id: string | null;
          user_id: string;
          event_type: string;
          description: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          map_id?: string | null;
          node_id?: string | null;
          user_id: string;
          event_type: string;
          description: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          map_id?: string | null;
          node_id?: string | null;
          user_id?: string;
          event_type?: string;
          description?: string;
          metadata?: Json;
          created_at?: string;
        };
      };
      ai_runs: {
        Row: {
          id: string;
          map_id: string;
          user_id: string;
          agent_type: 'generate' | 'expand' | 'summarize' | 'to_tasks' | 'chat';
          input_context: Json;
          output_result: Json | null;
          model_used: string;
          tokens_input: number | null;
          tokens_output: number | null;
          duration_ms: number | null;
          status: 'pending' | 'running' | 'completed' | 'failed';
          error_message: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          map_id: string;
          user_id: string;
          agent_type: 'generate' | 'expand' | 'summarize' | 'to_tasks' | 'chat';
          input_context: Json;
          output_result?: Json | null;
          model_used: string;
          tokens_input?: number | null;
          tokens_output?: number | null;
          duration_ms?: number | null;
          status?: 'pending' | 'running' | 'completed' | 'failed';
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          map_id?: string;
          user_id?: string;
          agent_type?: 'generate' | 'expand' | 'summarize' | 'to_tasks' | 'chat';
          input_context?: Json;
          output_result?: Json | null;
          model_used?: string;
          tokens_input?: number | null;
          tokens_output?: number | null;
          duration_ms?: number | null;
          status?: 'pending' | 'running' | 'completed' | 'failed';
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      references: {
        Row: {
          id: string;
          node_id: string;
          type: 'url' | 'file' | 'image' | 'video' | 'document';
          url: string;
          title: string | null;
          description: string | null;
          thumbnail_url: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          node_id: string;
          type: 'url' | 'file' | 'image' | 'video' | 'document';
          url: string;
          title?: string | null;
          description?: string | null;
          thumbnail_url?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          node_id?: string;
          type?: 'url' | 'file' | 'image' | 'video' | 'document';
          url?: string;
          title?: string | null;
          description?: string | null;
          thumbnail_url?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_workspace_member: {
        Args: { workspace_uuid: string };
        Returns: boolean;
      };
      can_edit_workspace: {
        Args: { workspace_uuid: string };
        Returns: boolean;
      };
      get_map_workspace: {
        Args: { map_uuid: string };
        Returns: string;
      };
      get_node_map: {
        Args: { node_uuid: string };
        Returns: string;
      };
    };
    Enums: {
      workspace_role: 'admin' | 'member' | 'viewer';
      node_type: 'idea' | 'task' | 'note' | 'reference' | 'image' | 'group';
      edge_type: 'default' | 'step' | 'smoothstep' | 'straight' | 'bezier';
      link_type: 'reference' | 'related' | 'blocks' | 'blocked_by';
      task_status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
      task_priority: 'low' | 'medium' | 'high' | 'urgent';
      notification_type: 'task_assigned' | 'comment_mention' | 'map_shared' | 'deadline_reminder' | 'ai_complete';
      reference_type: 'url' | 'file' | 'image' | 'video' | 'document';
      ai_agent_type: 'generate' | 'expand' | 'summarize' | 'to_tasks' | 'chat';
      ai_run_status: 'pending' | 'running' | 'completed' | 'failed';
    };
  };
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
