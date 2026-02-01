-- MindMap Database Schema for Supabase
-- Copy and paste this entire script in the SQL Editor of your Supabase dashboard
-- Project: https://app.supabase.com/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  avatar_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mindmaps table
CREATE TABLE IF NOT EXISTS mindmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'draft',
  visibility VARCHAR(20) DEFAULT 'shared',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  view_count INTEGER DEFAULT 0,
  thumbnail_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nodes table
CREATE TABLE IF NOT EXISTS nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mindmap_id UUID NOT NULL REFERENCES mindmaps(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  node_type VARCHAR(50) DEFAULT 'text',
  type VARCHAR(50) DEFAULT 'text',
  x FLOAT DEFAULT 0,
  y FLOAT DEFAULT 0,
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  width FLOAT DEFAULT 200,
  height FLOAT DEFAULT 100,
  color VARCHAR(7) DEFAULT '#3B82F6',
  font_size INTEGER DEFAULT 14,
  font_weight VARCHAR(20) DEFAULT 'normal',
  is_collapsed BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Node Links table (for connections between nodes)
CREATE TABLE IF NOT EXISTS node_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mindmap_id UUID NOT NULL REFERENCES mindmaps(id) ON DELETE CASCADE,
  from_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  label VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100),
  file_url VARCHAR(500) NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activities table (for tracking changes)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mindmap_id UUID NOT NULL REFERENCES mindmaps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  changes JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mindmap Collaborators table
CREATE TABLE IF NOT EXISTS mindmap_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mindmap_id UUID NOT NULL REFERENCES mindmaps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'viewer',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(mindmap_id, user_id)
);

-- Insert sample users
INSERT INTO users (name, email, avatar_url, status) VALUES
  ('Guilherme', 'guilherme@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guilherme', 'active'),
  ('Helen', 'helen@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Helen', 'active'),
  ('Pablo', 'pablo@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pablo', 'active')
ON CONFLICT (email) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mindmaps_owner_id ON mindmaps(owner_id);
CREATE INDEX IF NOT EXISTS idx_nodes_mindmap_id ON nodes(mindmap_id);
CREATE INDEX IF NOT EXISTS idx_nodes_parent_id ON nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_node_id ON comments(node_id);
CREATE INDEX IF NOT EXISTS idx_activities_mindmap_id ON activities(mindmap_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_mindmap_id ON mindmap_collaborators(mindmap_id);
CREATE INDEX IF NOT EXISTS idx_attachments_node_id ON attachments(node_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mindmaps_updated_at BEFORE UPDATE ON mindmaps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nodes_updated_at BEFORE UPDATE ON nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for mindmaps
CREATE POLICY "Users can view own mindmaps and public ones" ON mindmaps FOR SELECT 
  USING (auth.uid() = owner_id OR is_public = TRUE);
CREATE POLICY "Users can create mindmaps" ON mindmaps FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own mindmaps" ON mindmaps FOR UPDATE 
  USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own mindmaps" ON mindmaps FOR DELETE 
  USING (auth.uid() = owner_id);

-- RLS Policies for nodes
CREATE POLICY "Users can view nodes in accessible mindmaps" ON nodes FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM mindmaps WHERE id = nodes.mindmap_id 
    AND (auth.uid() = owner_id OR is_public = TRUE)
  ));
CREATE POLICY "Users can manage nodes in own mindmaps" ON nodes FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM mindmaps WHERE id = nodes.mindmap_id 
    AND auth.uid() = owner_id
  ));
CREATE POLICY "Users can update nodes in own mindmaps" ON nodes FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM mindmaps WHERE id = nodes.mindmap_id 
    AND auth.uid() = owner_id
  ));
CREATE POLICY "Users can delete nodes in own mindmaps" ON nodes FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM mindmaps WHERE id = nodes.mindmap_id 
    AND auth.uid() = owner_id
  ));

-- Schema migration complete!
-- Your database is now ready for the MindMap application.
