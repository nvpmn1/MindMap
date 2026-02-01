-- ============================================
-- MINDMAP COLABORATIVO COM IA - SCHEMA SQL
-- Para Supabase/PostgreSQL
-- ============================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: users (Usuários)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'member',
    color VARCHAR(7),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA: mindmaps (Mapas Mentais)
-- ============================================
CREATE TABLE IF NOT EXISTS mindmaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    is_public BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{
        "layout": "hierarchical",
        "theme": "default",
        "showMinimap": true
    }',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA: nodes (Nós do Mapa)
-- ============================================
CREATE TABLE IF NOT EXISTS nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mindmap_id UUID NOT NULL REFERENCES mindmaps(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'idea',
    
    -- Task properties
    status VARCHAR(20) CHECK (status IN ('todo', 'doing', 'done')),
    priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    
    -- Visual properties
    position_x FLOAT DEFAULT 0,
    position_y FLOAT DEFAULT 0,
    color VARCHAR(7),
    icon VARCHAR(50),
    order_index INTEGER DEFAULT 0,
    is_expanded BOOLEAN DEFAULT true,
    
    -- Metadata
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA: node_links (Conexões entre nós)
-- ============================================
CREATE TABLE IF NOT EXISTS node_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    link_type VARCHAR(50) DEFAULT 'relation',
    label TEXT,
    color VARCHAR(7),
    style VARCHAR(20) DEFAULT 'solid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(source_id, target_id)
);

-- ============================================
-- TABELA: attachments (Anexos)
-- ============================================
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA: comments (Comentários)
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA: activities (Histórico de Atividades)
-- ============================================
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mindmap_id UUID REFERENCES mindmaps(id) ON DELETE CASCADE,
    node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA: mindmap_collaborators (Colaboradores)
-- ============================================
CREATE TABLE IF NOT EXISTS mindmap_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mindmap_id UUID NOT NULL REFERENCES mindmaps(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'editor' CHECK (role IN ('viewer', 'editor', 'admin')),
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(mindmap_id, user_id)
);

-- ============================================
-- ÍNDICES
-- ============================================

-- Nodes
CREATE INDEX IF NOT EXISTS idx_nodes_mindmap ON nodes(mindmap_id);
CREATE INDEX IF NOT EXISTS idx_nodes_parent ON nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_nodes_assigned ON nodes(assigned_to);
CREATE INDEX IF NOT EXISTS idx_nodes_status ON nodes(status);
CREATE INDEX IF NOT EXISTS idx_nodes_created_at ON nodes(created_at DESC);

-- Links
CREATE INDEX IF NOT EXISTS idx_links_source ON node_links(source_id);
CREATE INDEX IF NOT EXISTS idx_links_target ON node_links(target_id);

-- Comments
CREATE INDEX IF NOT EXISTS idx_comments_node ON comments(node_id);

-- Activities
CREATE INDEX IF NOT EXISTS idx_activities_mindmap ON activities(mindmap_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);

-- ============================================
-- TRIGGERS: Atualização automática de updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mindmaps_updated_at
    BEFORE UPDATE ON mindmaps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nodes_updated_at
    BEFORE UPDATE ON nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNÇÃO: Registrar atividade automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION log_node_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO activities (mindmap_id, node_id, user_id, action, details)
        VALUES (NEW.mindmap_id, NEW.id, NEW.created_by, 'created', 
            jsonb_build_object('content', NEW.content, 'type', NEW.type));
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO activities (mindmap_id, node_id, user_id, action, details)
            VALUES (NEW.mindmap_id, NEW.id, NEW.assigned_to, 'status_changed',
                jsonb_build_object('from', OLD.status, 'to', NEW.status));
        ELSIF OLD.content IS DISTINCT FROM NEW.content THEN
            INSERT INTO activities (mindmap_id, node_id, user_id, action, details)
            VALUES (NEW.mindmap_id, NEW.id, NEW.created_by, 'updated',
                jsonb_build_object('old_content', OLD.content, 'new_content', NEW.content));
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO activities (mindmap_id, node_id, user_id, action, details)
        VALUES (OLD.mindmap_id, NULL, OLD.created_by, 'deleted',
            jsonb_build_object('content', OLD.content));
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_node_changes
    AFTER INSERT OR UPDATE OR DELETE ON nodes
    FOR EACH ROW
    EXECUTE FUNCTION log_node_activity();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindmap_collaborators ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para desenvolvimento
-- Em produção, ajuste conforme necessário

CREATE POLICY "Allow all for users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for mindmaps" ON mindmaps FOR ALL USING (true);
CREATE POLICY "Allow all for nodes" ON nodes FOR ALL USING (true);
CREATE POLICY "Allow all for node_links" ON node_links FOR ALL USING (true);
CREATE POLICY "Allow all for attachments" ON attachments FOR ALL USING (true);
CREATE POLICY "Allow all for comments" ON comments FOR ALL USING (true);
CREATE POLICY "Allow all for activities" ON activities FOR ALL USING (true);
CREATE POLICY "Allow all for mindmap_collaborators" ON mindmap_collaborators FOR ALL USING (true);

-- ============================================
-- DADOS INICIAIS: Usuários predefinidos
-- ============================================

INSERT INTO users (id, name, email, color, role) VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Guilherme', 'guilherme@mindmap.com', '#6366f1', 'admin'),
    ('22222222-2222-2222-2222-222222222222', 'Helen', 'helen@mindmap.com', '#ec4899', 'member'),
    ('33333333-3333-3333-3333-333333333333', 'Pablo', 'pablo@mindmap.com', '#10b981', 'member')
ON CONFLICT (email) DO UPDATE SET 
    name = EXCLUDED.name,
    color = EXCLUDED.color,
    role = EXCLUDED.role;

-- ============================================
-- DADOS INICIAIS: Mapa de exemplo
-- ============================================

INSERT INTO mindmaps (id, name, description, created_by) VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
     'Projeto MindMap', 
     'Mapa mental para organização do projeto colaborativo',
     '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- Nó raiz
INSERT INTO nodes (id, mindmap_id, content, type, position_x, position_y, created_by) VALUES 
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'Projeto MindMap Colaborativo',
     'central',
     400, 300,
     '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- Sub-nós
INSERT INTO nodes (id, mindmap_id, parent_id, content, type, position_x, position_y, status, created_by) VALUES 
    ('cccccccc-cccc-cccc-cccc-cccccccccccc',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
     'Backend API',
     'idea',
     200, 150,
     'doing',
     '11111111-1111-1111-1111-111111111111'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
     'Frontend React',
     'idea',
     600, 150,
     'doing',
     '22222222-2222-2222-2222-222222222222'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
     'Integração IA',
     'idea',
     400, 450,
     'todo',
     '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

-- Adicionar colaboradores ao mapa
INSERT INTO mindmap_collaborators (mindmap_id, user_id, role, invited_by) VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'editor', '11111111-1111-1111-1111-111111111111'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'editor', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- ============================================
-- ENABLE REALTIME
-- ============================================

-- Habilitar realtime para tabelas principais
ALTER PUBLICATION supabase_realtime ADD TABLE nodes;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
