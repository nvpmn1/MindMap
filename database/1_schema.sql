-- ============================================
-- MindMap Hub - Database Schema (Compatível com o backend atual)
-- Execute este arquivo no Supabase SQL Editor
-- ============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABELA: workspaces
-- ============================================
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    description TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workspaces_name ON workspaces(name);
COMMENT ON TABLE workspaces IS 'Espaços de trabalho compartilhados entre membros';

-- ============================================
-- 2. TABELA: workspace_members
-- ============================================
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'editor', 'viewer', 'admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
COMMENT ON TABLE workspace_members IS 'Relacionamento entre usuários e workspaces';

-- ============================================
-- 3. TABELA: profiles
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(100),
    avatar_url TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
COMMENT ON TABLE profiles IS 'Perfil visual do usuário (nome, avatar, cor)';

-- ============================================
-- 4. TABELA: maps
-- ============================================
CREATE TABLE IF NOT EXISTS maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    is_template BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maps_workspace ON maps(workspace_id);
CREATE INDEX idx_maps_created_by ON maps(created_by);
COMMENT ON TABLE maps IS 'Mapas mentais do workspace';

-- ============================================
-- 5. TABELA: nodes
-- ============================================
CREATE TABLE IF NOT EXISTS nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
    type VARCHAR(30) DEFAULT 'idea' CHECK (type IN ('idea', 'task', 'note', 'reference', 'image', 'group', 'research', 'data', 'question')),
    label VARCHAR(500) NOT NULL,
    content TEXT,
    position_x FLOAT NOT NULL DEFAULT 0,
    position_y FLOAT NOT NULL DEFAULT 0,
    width FLOAT,
    height FLOAT,
    style JSONB DEFAULT '{}',
    data JSONB DEFAULT '{}',
    collapsed BOOLEAN DEFAULT FALSE,
    version INT DEFAULT 1,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nodes_map ON nodes(map_id);
CREATE INDEX idx_nodes_parent ON nodes(parent_id);
COMMENT ON TABLE nodes IS 'Nós (elementos) do mindmap';

-- ============================================
-- 6. TABELA: edges
-- ============================================
CREATE TABLE IF NOT EXISTS edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    type VARCHAR(30) DEFAULT 'default' CHECK (type IN ('default', 'step', 'smoothstep', 'straight', 'bezier')),
    label VARCHAR(100),
    style JSONB DEFAULT '{}',
    animated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_id, target_id)
);

CREATE INDEX idx_edges_map ON edges(map_id);
CREATE INDEX idx_edges_source ON edges(source_id);
CREATE INDEX idx_edges_target ON edges(target_id);
COMMENT ON TABLE edges IS 'Conexões visuais (linhas) entre nós';

-- ============================================
-- 7. TABELA: node_links
-- ============================================
CREATE TABLE IF NOT EXISTS node_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    link_type VARCHAR(50) DEFAULT 'related' CHECK (link_type IN ('reference', 'related', 'blocks', 'blocked_by')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_node_links_source ON node_links(source_node_id);
CREATE INDEX idx_node_links_target ON node_links(target_node_id);
COMMENT ON TABLE node_links IS 'Conexões semânticas entre nós';

-- ============================================
-- 8. TABELA: tasks
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'in_progress', 'review', 'done')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date DATE,
    assigned_to UUID REFERENCES profiles(id),
    tags TEXT[] DEFAULT '{}',
    checklist JSONB DEFAULT '{}',
    order_index INT DEFAULT 0,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_node ON tasks(node_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
COMMENT ON TABLE tasks IS 'Tarefas atribuíveis derivadas de nós';

-- ============================================
-- 9. TABELA: comments
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mentions UUID[] DEFAULT '{}',
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_node ON comments(node_id);
CREATE INDEX idx_comments_user ON comments(user_id);
COMMENT ON TABLE comments IS 'Comentários em nós do mapa';

-- ============================================
-- 10. TABELA: notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('task_assigned', 'comment_mention', 'map_shared', 'deadline_reminder', 'ai_complete')),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read = FALSE;
COMMENT ON TABLE notifications IS 'Notificações para usuários';

-- ============================================
-- 11. TABELA: activity_events
-- ============================================
CREATE TABLE IF NOT EXISTS activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    map_id UUID REFERENCES maps(id) ON DELETE CASCADE,
    node_id UUID REFERENCES nodes(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id),
    event_type VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_workspace ON activity_events(workspace_id, created_at DESC);
CREATE INDEX idx_activity_map ON activity_events(map_id, created_at DESC);
CREATE INDEX idx_activity_user ON activity_events(user_id);
COMMENT ON TABLE activity_events IS 'Log de atividades para auditoria';

-- ============================================
-- 12. TABELA: ai_runs
-- ============================================
CREATE TABLE IF NOT EXISTS ai_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    agent_type VARCHAR(50) NOT NULL,
    input_context JSONB NOT NULL,
    output_result JSONB,
    model_used VARCHAR(100),
    tokens_input INT,
    tokens_output INT,
    duration_ms INT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_ai_runs_map ON ai_runs(map_id);
CREATE INDEX idx_ai_runs_status ON ai_runs(status);
COMMENT ON TABLE ai_runs IS 'Log de execuções de IA';

-- ============================================
-- 13. TABELA: references
-- ============================================
CREATE TABLE IF NOT EXISTS "references" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    type VARCHAR(30) DEFAULT 'url' CHECK (type IN ('url', 'file', 'image', 'video', 'document')),
    url TEXT NOT NULL,
    title VARCHAR(255),
    description TEXT,
    thumbnail_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_references_node ON "references"(node_id);
COMMENT ON TABLE "references" IS 'Referências e links externos anexados a nós';

-- ============================================
-- TRIGGERS: auto_update_timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_workspaces
    BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_maps
    BEFORE UPDATE ON maps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_nodes
    BEFORE UPDATE ON nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_tasks
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_comments
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- TRIGGER: increment_node_version
-- ============================================
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_node_version
    BEFORE UPDATE ON nodes
    FOR EACH ROW EXECUTE FUNCTION increment_version();

-- ============================================
-- TRIGGER: notify_task_delegation
-- ============================================
CREATE OR REPLACE FUNCTION notify_task_delegation()
RETURNS TRIGGER AS $$
DECLARE
    node_title TEXT;
    assigner_name TEXT;
BEGIN
    IF NEW.assigned_to IS NOT NULL AND 
       (OLD IS NULL OR NEW.assigned_to != COALESCE(OLD.assigned_to, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
        
        SELECT label INTO node_title FROM nodes WHERE id = NEW.node_id;
        SELECT display_name INTO assigner_name FROM profiles WHERE id = NEW.created_by;
        
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
            NEW.assigned_to,
            'task_assigned',
            'Nova tarefa atribuída',
            COALESCE(assigner_name, 'Alguém') || ' atribuiu a tarefa "' || NEW.title || '"',
            jsonb_build_object('task_id', NEW.id, 'node_id', NEW.node_id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_task_delegation
    AFTER INSERT OR UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION notify_task_delegation();

-- ============================================
-- TRIGGER: notify_comment_mention
-- ============================================
CREATE OR REPLACE FUNCTION notify_comment_mention()
RETURNS TRIGGER AS $$
DECLARE
    mentioned_user UUID;
    author_name TEXT;
    node_label TEXT;
BEGIN
    SELECT display_name INTO author_name FROM profiles WHERE id = NEW.user_id;
    SELECT label INTO node_label FROM nodes WHERE id = NEW.node_id;
    
    FOREACH mentioned_user IN ARRAY NEW.mentions LOOP
        IF mentioned_user != NEW.user_id THEN
            INSERT INTO notifications (user_id, type, title, message, data)
            VALUES (
                mentioned_user,
                'comment_mention',
                'Você foi mencionado',
                COALESCE(author_name, 'Alguém') || ' mencionou você em "' || COALESCE(node_label, 'um nó') || '"',
                jsonb_build_object('comment_id', NEW.id, 'node_id', NEW.node_id)
            );
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_comment_mention
    AFTER INSERT ON comments
    FOR EACH ROW
    WHEN (array_length(NEW.mentions, 1) > 0)
    EXECUTE FUNCTION notify_comment_mention();

-- ============================================
-- Setup inicial
-- ============================================
INSERT INTO workspaces (id, name, slug, description) VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'MindLab',
    'mindlab',
    'Workspace padrão do sistema'
) ON CONFLICT DO NOTHING;

ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE maps DISABLE ROW LEVEL SECURITY;
ALTER TABLE nodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE edges DISABLE ROW LEVEL SECURITY;
ALTER TABLE node_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE "references" DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    EXECUTE 'GRANT USAGE ON SCHEMA public TO service_role';
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role';
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role';
    EXECUTE 'GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role';
END $$;

-- ============================================
-- FIM DO SCHEMA
-- ============================================
