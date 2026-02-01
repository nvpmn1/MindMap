-- ============================================
-- MindMap Hub - Database Schema
-- Execute este arquivo no Supabase SQL Editor
-- ============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABELA: workspaces
-- Espaço de trabalho compartilhado
-- ============================================
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE workspaces IS 'Espaços de trabalho compartilhados entre membros';

-- ============================================
-- 2. TABELA: workspace_members
-- Membros do workspace com papéis
-- ============================================
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);

COMMENT ON TABLE workspace_members IS 'Relacionamento entre usuários e workspaces';

-- ============================================
-- 3. TABELA: profiles
-- Perfil visual e preferências do usuário
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_user ON profiles(user_id);

COMMENT ON TABLE profiles IS 'Perfil visual do usuário (nome, avatar, cor)';

-- ============================================
-- 4. TABELA: maps
-- Mapas mentais
-- ============================================
CREATE TABLE IF NOT EXISTS maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    settings JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maps_workspace ON maps(workspace_id);
CREATE INDEX idx_maps_status ON maps(status);
CREATE INDEX idx_maps_created_by ON maps(created_by);

COMMENT ON TABLE maps IS 'Mapas mentais do workspace';

-- ============================================
-- 5. TABELA: nodes
-- Nós do mindmap
-- ============================================
CREATE TABLE IF NOT EXISTS nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    position_x FLOAT NOT NULL DEFAULT 0,
    position_y FLOAT NOT NULL DEFAULT 0,
    width FLOAT DEFAULT 200,
    height FLOAT DEFAULT 80,
    color VARCHAR(7),
    icon VARCHAR(50),
    node_type VARCHAR(30) DEFAULT 'default' CHECK (node_type IN ('default', 'task', 'note', 'question', 'idea', 'warning')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'blocked')),
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    order_index INT DEFAULT 0,
    is_collapsed BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INT DEFAULT 1
);

CREATE INDEX idx_nodes_map ON nodes(map_id);
CREATE INDEX idx_nodes_parent ON nodes(parent_id);
CREATE INDEX idx_nodes_status ON nodes(status);

COMMENT ON TABLE nodes IS 'Nós (elementos) do mindmap';

-- ============================================
-- 6. TABELA: edges
-- Conexões visuais entre nós
-- ============================================
CREATE TABLE IF NOT EXISTS edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    label VARCHAR(100),
    edge_type VARCHAR(30) DEFAULT 'default' CHECK (edge_type IN ('default', 'dashed', 'dotted', 'bold')),
    color VARCHAR(7),
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
-- Conexões semânticas (sem linha visual)
-- ============================================
CREATE TABLE IF NOT EXISTS node_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    link_type VARCHAR(50) DEFAULT 'related' CHECK (link_type IN ('related', 'depends_on', 'blocks', 'contradicts', 'supports')),
    strength FLOAT DEFAULT 1.0 CHECK (strength >= 0 AND strength <= 1),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_id, target_id, link_type)
);

CREATE INDEX idx_node_links_map ON node_links(map_id);

COMMENT ON TABLE node_links IS 'Conexões semânticas entre nós (rede neural)';

-- ============================================
-- 8. TABELA: tasks
-- Tarefas derivadas de nós
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    node_id UUID REFERENCES nodes(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'backlog' CHECK (status IN ('backlog', 'doing', 'waiting', 'done')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    task_type VARCHAR(30) DEFAULT 'task' CHECK (task_type IN ('task', 'research', 'review', 'decision', 'execution')),
    assignee_id UUID REFERENCES auth.users(id),
    due_date DATE,
    completed_at TIMESTAMPTZ,
    order_index INT DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_map ON tasks(map_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_node ON tasks(node_id);

COMMENT ON TABLE tasks IS 'Tarefas atribuíveis derivadas de nós';

-- ============================================
-- 9. TABELA: comments
-- Comentários em nós
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    mentions UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_node ON comments(node_id);
CREATE INDEX idx_comments_author ON comments(author_id);

COMMENT ON TABLE comments IS 'Comentários em nós do mapa';

-- ============================================
-- 10. TABELA: notifications
-- Notificações para usuários
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('delegation', 'comment', 'mention', 'task_done', 'ai_complete', 'system')),
    title VARCHAR(255) NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;

COMMENT ON TABLE notifications IS 'Notificações para usuários';

-- ============================================
-- 11. TABELA: activity_events
-- Log de atividades (audit trail)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    map_id UUID REFERENCES maps(id) ON DELETE CASCADE,
    node_id UUID REFERENCES nodes(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(30) NOT NULL,
    entity_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_workspace ON activity_events(workspace_id, created_at DESC);
CREATE INDEX idx_activity_map ON activity_events(map_id, created_at DESC);
CREATE INDEX idx_activity_user ON activity_events(user_id);

COMMENT ON TABLE activity_events IS 'Log de atividades para auditoria';

-- ============================================
-- 12. TABELA: ai_runs
-- Execuções de ações de IA
-- ============================================
CREATE TABLE IF NOT EXISTS ai_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    node_id UUID REFERENCES nodes(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
        'generate_map', 'expand_node', 'summarize', 'to_tasks',
        'find_gaps', 'suggest_links', 'experiment', 'report', 'chat'
    )),
    input JSONB NOT NULL,
    output JSONB,
    diffs JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    tokens_input INT,
    tokens_output INT,
    model VARCHAR(50),
    duration_ms INT,
    error TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_ai_runs_map ON ai_runs(map_id);
CREATE INDEX idx_ai_runs_status ON ai_runs(status);

COMMENT ON TABLE ai_runs IS 'Log de execuções de IA com rastreabilidade';

-- ============================================
-- 13. TABELA: references
-- Referências/links externos em nós
-- ============================================
CREATE TABLE IF NOT EXISTS "references" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title VARCHAR(255),
    citation TEXT,
    notes TEXT,
    type VARCHAR(30) DEFAULT 'link' CHECK (type IN ('link', 'paper', 'book', 'video', 'other')),
    created_by UUID REFERENCES auth.users(id),
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

-- Aplicar trigger em tabelas com updated_at
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
    map_title TEXT;
    node_title TEXT;
    creator_name TEXT;
BEGIN
    -- Só notifica se assignee mudou e não é null
    IF NEW.assignee_id IS NOT NULL AND 
       (OLD IS NULL OR NEW.assignee_id != COALESCE(OLD.assignee_id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
        
        -- Buscar informações para a notificação
        SELECT m.title INTO map_title FROM maps m WHERE m.id = NEW.map_id;
        SELECT n.title INTO node_title FROM nodes n WHERE n.id = NEW.node_id;
        SELECT p.display_name INTO creator_name FROM profiles p WHERE p.user_id = NEW.created_by;
        
        INSERT INTO notifications (user_id, type, title, body, data)
        VALUES (
            NEW.assignee_id,
            'delegation',
            'Nova tarefa delegada',
            COALESCE(creator_name, 'Alguém') || ' delegou "' || NEW.title || '" para você',
            jsonb_build_object(
                'task_id', NEW.id,
                'map_id', NEW.map_id,
                'node_id', NEW.node_id,
                'map_title', map_title,
                'node_title', node_title
            )
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
    n_title TEXT;
    m_id UUID;
BEGIN
    -- Buscar info
    SELECT p.display_name INTO author_name FROM profiles p WHERE p.user_id = NEW.author_id;
    SELECT n.title, n.map_id INTO n_title, m_id FROM nodes n WHERE n.id = NEW.node_id;
    
    -- Notificar cada mencionado
    FOREACH mentioned_user IN ARRAY NEW.mentions LOOP
        IF mentioned_user != NEW.author_id THEN
            INSERT INTO notifications (user_id, type, title, body, data)
            VALUES (
                mentioned_user,
                'mention',
                'Você foi mencionado',
                COALESCE(author_name, 'Alguém') || ' mencionou você em "' || COALESCE(n_title, 'um nó') || '"',
                jsonb_build_object(
                    'comment_id', NEW.id,
                    'node_id', NEW.node_id,
                    'map_id', m_id
                )
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
-- FIM DO SCHEMA
-- ============================================
