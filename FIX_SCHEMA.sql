-- =============================================================================
-- FIX_SCHEMA.sql - Execute this in Supabase SQL Editor
-- This script adds missing columns to your existing database
-- =============================================================================

-- Add missing columns to mindmaps table
ALTER TABLE mindmaps 
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'shared';

ALTER TABLE mindmaps 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE mindmaps 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

ALTER TABLE mindmaps 
ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500);

-- Add missing columns to nodes table  
ALTER TABLE nodes 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'text';

ALTER TABLE nodes 
ADD COLUMN IF NOT EXISTS position_x FLOAT DEFAULT 0;

ALTER TABLE nodes 
ADD COLUMN IF NOT EXISTS position_y FLOAT DEFAULT 0;

ALTER TABLE nodes 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

ALTER TABLE nodes 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE nodes 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE nodes 
ADD COLUMN IF NOT EXISTS status VARCHAR(20);

ALTER TABLE nodes 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20);

ALTER TABLE nodes 
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;

ALTER TABLE nodes 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Fix node_links table if it has wrong column names
DO $$
BEGIN
    -- Check if from_node_id exists and rename to source_node_id
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='node_links' AND column_name='from_node_id') THEN
        ALTER TABLE node_links RENAME COLUMN from_node_id TO source_node_id;
    END IF;
    
    -- Check if to_node_id exists and rename to target_node_id  
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='node_links' AND column_name='to_node_id') THEN
        ALTER TABLE node_links RENAME COLUMN to_node_id TO target_node_id;
    END IF;
END $$;

-- Create activities table with timestamp column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='activities' AND column_name='timestamp') THEN
        ALTER TABLE activities ADD COLUMN timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Disable RLS for development (easier testing)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE mindmaps DISABLE ROW LEVEL SECURITY;
ALTER TABLE nodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE node_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE mindmap_collaborators DISABLE ROW LEVEL SECURITY;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_nodes_mindmap_id ON nodes(mindmap_id);
CREATE INDEX IF NOT EXISTS idx_nodes_parent_id ON nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_nodes_assigned_to ON nodes(assigned_to);

-- Done!
SELECT 'Schema fixed successfully!' as message;
