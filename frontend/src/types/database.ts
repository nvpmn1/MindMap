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
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          color?: string;
          preferences?: Json;
        };
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          slug: string;
          owner_id: string;
          settings?: Json;
        };
        Update: {
          name?: string;
          slug?: string;
          settings?: Json;
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
          workspace_id: string;
          title: string;
          description?: string | null;
          is_template?: boolean;
          settings?: Json;
          created_by: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          is_template?: boolean;
          settings?: Json;
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
          width: number;
          height: number;
          style: Json;
          data: Json;
          collapsed: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          map_id: string;
          parent_id?: string | null;
          type?: 'idea' | 'task' | 'note' | 'reference' | 'image' | 'group';
          label: string;
          content?: string | null;
          position_x?: number;
          position_y?: number;
          width?: number;
          height?: number;
          style?: Json;
          data?: Json;
          collapsed?: boolean;
          created_by: string;
        };
        Update: {
          parent_id?: string | null;
          type?: 'idea' | 'task' | 'note' | 'reference' | 'image' | 'group';
          label?: string;
          content?: string | null;
          position_x?: number;
          position_y?: number;
          width?: number;
          height?: number;
          style?: Json;
          data?: Json;
          collapsed?: boolean;
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
        };
        Update: {
          title?: string;
          description?: string | null;
          status?: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          due_date?: string | null;
          assigned_to?: string | null;
          tags?: string[];
          checklist?: Json;
          order_index?: number;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
