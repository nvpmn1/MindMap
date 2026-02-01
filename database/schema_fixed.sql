-- ============================================
-- MindMap Hub - Database Schema (CORRIGIDO)
-- Execute este arquivo no Supabase SQL Editor
-- ============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABELA: users (Estendendo auth.users)
-- Dados adicionais do usuário
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    avatar_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_id ON users(id);

COMMENT ON TABLE users IS 'Dados adicionais do usuário autenticado';

-- ============================================
-- 2. TABELA: maps
-- Mapas mentais
-- ============================================
CREATE TABLE IF NOT EXISTS maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maps_owner ON maps(owner_id);
CREATE INDEX idx_maps_archived ON maps(is_archived);
CREATE INDEX idx_maps_favorite ON maps(is_favorite);

COMMENT ON TABLE maps IS 'Mapas mentais principais';

-- ============================================
-- 3. TABELA: map_collaborators
-- Colaboradores em um mapa
-- ============================================
CREATE TABLE IF NOT EXISTS map_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'editor' CHECK (role IN ('viewer', 'editor', 'owner')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(map_id, user_id)
);

CREATE INDEX idx_map_collaborators_map ON map_collaborators(map_id);
CREATE INDEX idx_map_collaborators_user ON map_collaborators(user_id);

COMMENT ON TABLE map_collaborators IS 'Colaboradores compartilhados em um mapa';

-- ============================================
-- 4. TABELA: nodes
-- Nós do mindmap
-- ============================================
CREATE TABLE IF NOT EXISTS nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
    node_type VARCHAR(30) DEFAULT 'idea' CHECK (node_type IN ('idea', 'task', 'note')),
    content TEXT NOT NULL,
    position_x FLOAT DEFAULT 0,
    position_y FLOAT DEFAULT 0,
    color VARCHAR(7),
    emoji VARCHAR(10),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nodes_map ON nodes(map_id);
CREATE INDEX idx_nodes_parent ON nodes(parent_id);

COMMENT ON TABLE nodes IS 'Nós (elementos) do mindmap';

-- ============================================
-- 5. TABELA: edges
-- Conexões visuais entre nós
-- ============================================
CREATE TABLE IF NOT EXISTS edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    edge_type VARCHAR(30) DEFAULT 'smoothstep',
    label VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_id, target_id)
);

CREATE INDEX idx_edges_map ON edges(map_id);
CREATE INDEX idx_edges_source ON edges(source_id);
CREATE INDEX idx_edges_target ON edges(target_id);

COMMENT ON TABLE edges IS 'Conexões visuais entre nós';

-- ============================================
-- 6. TABELA: tasks
-- Tarefas derivadas de nós
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'in_progress', 'review', 'done')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assignee_id UUID REFERENCES auth.users(id),
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_map ON tasks(map_id);
CREATE INDEX idx_tasks_node ON tasks(node_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);

COMMENT ON TABLE tasks IS 'Tarefas derivadas de nós';

-- ============================================
-- 7. TABELA: comments
-- Comentários em nós
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mentions UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_map ON comments(map_id);
CREATE INDEX idx_comments_node ON comments(node_id);
CREATE INDEX idx_comments_author ON comments(author_id);

COMMENT ON TABLE comments IS 'Comentários em nós';

-- ============================================
-- 8. TABELA: notifications
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
-- 9. TABELA: ai_runs
-- Execuções de ações de IA
-- ============================================
CREATE TABLE IF NOT EXISTS ai_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    input JSONB NOT NULL,
    output JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    tokens_input INT,
    tokens_output INT,
    model VARCHAR(50),
    error TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_ai_runs_map ON ai_runs(map_id);
CREATE INDEX idx_ai_runs_status ON ai_runs(status);

COMMENT ON TABLE ai_runs IS 'Log de execuções de IA';

-- ============================================
-- 10. TABELA: activity_events
-- Log de atividades (audit trail)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_id UUID REFERENCES maps(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(30) NOT NULL,
    entity_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_map ON activity_events(map_id, created_at DESC);
CREATE INDEX idx_activity_user ON activity_events(user_id);

COMMENT ON TABLE activity_events IS 'Log de atividades para auditoria';

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

CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON users
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
-- TRIGGER: Notificar delegação de tarefa
-- ============================================
CREATE OR REPLACE FUNCTION notify_task_delegation()
RETURNS TRIGGER AS $$
DECLARE
    map_name TEXT;
    assignee_name TEXT;
BEGIN
    IF NEW.assignee_id IS NOT NULL AND 
       (OLD IS NULL OR NEW.assignee_id != COALESCE(OLD.assignee_id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
        
        SELECT m.name INTO map_name FROM maps m WHERE m.id = NEW.map_id;
        SELECT u.name INTO assignee_name FROM users u WHERE u.id = NEW.assignee_id;
        
        INSERT INTO notifications (user_id, type, title, body, data)
        VALUES (
            NEW.assignee_id,
            'delegation',
            'Nova tarefa delegada',
            'Você foi designado para a tarefa: ' || COALESCE(NEW.title, 'Sem título'),
            jsonb_build_object(
                'task_id', NEW.id,
                'map_id', NEW.map_id,
                'node_id', NEW.node_id
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
-- TRIGGER: Notificar menção em comentário
-- ============================================
CREATE OR REPLACE FUNCTION notify_comment_mention()
RETURNS TRIGGER AS $$
DECLARE
    mentioned_user UUID;
    author_name TEXT;
BEGIN
    SELECT u.name INTO author_name FROM users u WHERE u.id = NEW.author_id;
    
    IF array_length(NEW.mentions, 1) > 0 THEN
        FOREACH mentioned_user IN ARRAY NEW.mentions LOOP
            IF mentioned_user != NEW.author_id THEN
                INSERT INTO notifications (user_id, type, title, body, data)
                VALUES (
                    mentioned_user,
                    'mention',
                    'Você foi mencionado',
                    COALESCE(author_name, 'Alguém') || ' mencionou você em um comentário',
                    jsonb_build_object(
                        'comment_id', NEW.id,
                        'node_id', NEW.node_id,
                        'map_id', NEW.map_id
                    )
                );
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_comment_mention
    AFTER INSERT ON comments
    FOR EACH ROW EXECUTE FUNCTION notify_comment_mention();

-- ============================================
-- Enable Realtime (Supabase específico)
-- ============================================
ALTER TABLE maps REPLICA IDENTITY FULL;
ALTER TABLE nodes REPLICA IDENTITY FULL;
ALTER TABLE edges REPLICA IDENTITY FULL;
ALTER TABLE comments REPLICA IDENTITY FULL;
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- ============================================
-- RLS (Row Level Security) - Opcional mas recomendado
-- ============================================

-- Habilitar RLS nas tabelas
ALTER TABLE maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy para mapas: proprietário e colaboradores podem acessar
CREATE POLICY "Users can view own or shared maps"
    ON maps
    FOR SELECT
    USING (
        owner_id = auth.uid() OR
        id IN (SELECT map_id FROM map_collaborators WHERE user_id = auth.uid()) OR
        is_public = TRUE
    );

CREATE POLICY "Users can create maps"
    ON maps
    FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own maps"
    ON maps
    FOR UPDATE
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Policy para nós
CREATE POLICY "Users can view nodes in accessible maps"
    ON nodes
    FOR SELECT
    USING (
        map_id IN (
            SELECT id FROM maps WHERE owner_id = auth.uid() OR
            id IN (SELECT map_id FROM map_collaborators WHERE user_id = auth.uid()) OR
            is_public = TRUE
        )
    );

-- Policy para notificações
CREATE POLICY "Users can view own notifications"
    ON notifications
    FOR SELECT
    USING (user_id = auth.uid());

-- ============================================
-- FIM DO SCHEMA CORRIGIDO
-- ============================================
