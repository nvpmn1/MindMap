-- ============================================
-- MindMap Hub - Row Level Security Policies (CORRIGIDO)
-- Execute APÓS 1_schema.sql
-- ============================================

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Verifica se usuário é membro do workspace
CREATE OR REPLACE FUNCTION is_workspace_member(ws_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_id = ws_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verifica se usuário pode editar (owner ou editor)
CREATE OR REPLACE FUNCTION can_edit_workspace(ws_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_id = ws_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pega workspace_id de um mapa
CREATE OR REPLACE FUNCTION get_map_workspace(m_id uuid)
RETURNS uuid AS $$
    SELECT workspace_id FROM maps WHERE id = m_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Pega map_id de um nó
CREATE OR REPLACE FUNCTION get_node_map(n_id uuid)
RETURNS uuid AS $$
    SELECT map_id FROM nodes WHERE id = n_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- RLS: workspaces
-- ============================================
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspaces_select_member"
    ON workspaces FOR SELECT
    USING (is_workspace_member(id));

CREATE POLICY "workspaces_insert_authenticated"
    ON workspaces FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "workspaces_update_owner"
    ON workspaces FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_id = workspaces.id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "workspaces_delete_owner"
    ON workspaces FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_id = workspaces.id
            AND user_id = auth.uid()
            AND role = 'owner'
        )
    );

-- ============================================
-- RLS: workspace_members
-- ============================================
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members_select_member"
    ON workspace_members FOR SELECT
    USING (is_workspace_member(workspace_id));

CREATE POLICY "workspace_members_insert_owner_or_first"
    ON workspace_members FOR INSERT
    WITH CHECK (
        -- Owner pode adicionar membros
        EXISTS (
            SELECT 1 FROM workspace_members wm
            WHERE wm.workspace_id = workspace_members.workspace_id
            AND wm.user_id = auth.uid()
            AND wm.role IN ('owner', 'admin')
        )
        OR
        -- Primeiro membro (criador do workspace) pode se adicionar
        NOT EXISTS (
            SELECT 1 FROM workspace_members wm
            WHERE wm.workspace_id = workspace_members.workspace_id
        )
    );

CREATE POLICY "workspace_members_update_owner"
    ON workspace_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members wm
            WHERE wm.workspace_id = workspace_members.workspace_id
            AND wm.user_id = auth.uid()
            AND wm.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "workspace_members_delete_owner"
    ON workspace_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members wm
            WHERE wm.workspace_id = workspace_members.workspace_id
            AND wm.user_id = auth.uid()
            AND wm.role IN ('owner', 'admin')
        )
        AND user_id != auth.uid() -- Não pode remover a si mesmo
    );

-- ============================================
-- RLS: profiles
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_authenticated"
    ON profiles FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "profiles_insert_own"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "profiles_delete_own"
    ON profiles FOR DELETE
    USING (auth.uid() = id);

-- ============================================
-- RLS: maps
-- ============================================
ALTER TABLE maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maps_select_member"
    ON maps FOR SELECT
    USING (is_workspace_member(workspace_id));

CREATE POLICY "maps_insert_editor"
    ON maps FOR INSERT
    WITH CHECK (can_edit_workspace(workspace_id));

CREATE POLICY "maps_update_editor"
    ON maps FOR UPDATE
    USING (can_edit_workspace(workspace_id));

CREATE POLICY "maps_delete_creator_or_owner"
    ON maps FOR DELETE
    USING (
        created_by = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_id = maps.workspace_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- ============================================
-- RLS: nodes
-- ============================================
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nodes_select_member"
    ON nodes FOR SELECT
    USING (is_workspace_member(get_map_workspace(map_id)));

CREATE POLICY "nodes_insert_editor"
    ON nodes FOR INSERT
    WITH CHECK (can_edit_workspace(get_map_workspace(map_id)));

CREATE POLICY "nodes_update_editor"
    ON nodes FOR UPDATE
    USING (can_edit_workspace(get_map_workspace(map_id)));

CREATE POLICY "nodes_delete_editor"
    ON nodes FOR DELETE
    USING (can_edit_workspace(get_map_workspace(map_id)));

-- ============================================
-- RLS: edges
-- ============================================
ALTER TABLE edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "edges_select_member"
    ON edges FOR SELECT
    USING (is_workspace_member(get_map_workspace(map_id)));

CREATE POLICY "edges_insert_editor"
    ON edges FOR INSERT
    WITH CHECK (can_edit_workspace(get_map_workspace(map_id)));

CREATE POLICY "edges_update_editor"
    ON edges FOR UPDATE
    USING (can_edit_workspace(get_map_workspace(map_id)));

CREATE POLICY "edges_delete_editor"
    ON edges FOR DELETE
    USING (can_edit_workspace(get_map_workspace(map_id)));

-- ============================================
-- RLS: node_links (CORRIGIDO: usa get_node_map)
-- ============================================
ALTER TABLE node_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "node_links_select_member"
    ON node_links FOR SELECT
    USING (is_workspace_member(get_map_workspace(get_node_map(source_node_id))));

CREATE POLICY "node_links_insert_editor"
    ON node_links FOR INSERT
    WITH CHECK (can_edit_workspace(get_map_workspace(get_node_map(source_node_id))));

CREATE POLICY "node_links_update_editor"
    ON node_links FOR UPDATE
    USING (can_edit_workspace(get_map_workspace(get_node_map(source_node_id))));

CREATE POLICY "node_links_delete_editor"
    ON node_links FOR DELETE
    USING (can_edit_workspace(get_map_workspace(get_node_map(source_node_id))));

-- ============================================
-- RLS: tasks (CORRIGIDO: usa get_node_map e assigned_to)
-- ============================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_member"
    ON tasks FOR SELECT
    USING (is_workspace_member(get_map_workspace(get_node_map(node_id))));

CREATE POLICY "tasks_insert_editor"
    ON tasks FOR INSERT
    WITH CHECK (can_edit_workspace(get_map_workspace(get_node_map(node_id))));

-- Editors OU assignee podem atualizar (CORRIGIDO: assigned_to em vez de assignee_id)
CREATE POLICY "tasks_update_editor_or_assignee"
    ON tasks FOR UPDATE
    USING (
        can_edit_workspace(get_map_workspace(get_node_map(node_id)))
        OR assigned_to = auth.uid()
    );

CREATE POLICY "tasks_delete_editor"
    ON tasks FOR DELETE
    USING (can_edit_workspace(get_map_workspace(get_node_map(node_id))));

-- ============================================
-- RLS: comments (CORRIGIDO: usa get_node_map e user_id)
-- ============================================
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_member"
    ON comments FOR SELECT
    USING (
        is_workspace_member(
            get_map_workspace(get_node_map(node_id))
        )
    );

CREATE POLICY "comments_insert_member"
    ON comments FOR INSERT
    WITH CHECK (
        is_workspace_member(
            get_map_workspace(get_node_map(node_id))
        )
        AND user_id = auth.uid()
    );

-- CORRIGIDO: user_id em vez de author_id
CREATE POLICY "comments_update_author"
    ON comments FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "comments_delete_author_or_editor"
    ON comments FOR DELETE
    USING (
        user_id = auth.uid()
        OR can_edit_workspace(
            get_map_workspace(get_node_map(node_id))
        )
    );

-- ============================================
-- RLS: notifications
-- ============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

-- Insert via trigger (sistema)
CREATE POLICY "notifications_insert_system"
    ON notifications FOR INSERT
    WITH CHECK (true);

CREATE POLICY "notifications_update_own"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_delete_own"
    ON notifications FOR DELETE
    USING (user_id = auth.uid());

-- ============================================
-- RLS: activity_events
-- ============================================
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_events_select_member"
    ON activity_events FOR SELECT
    USING (
        workspace_id IS NULL 
        OR is_workspace_member(workspace_id)
    );

-- Insert via trigger/sistema
CREATE POLICY "activity_events_insert_system"
    ON activity_events FOR INSERT
    WITH CHECK (true);

-- ============================================
-- RLS: ai_runs
-- ============================================
ALTER TABLE ai_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_runs_select_member"
    ON ai_runs FOR SELECT
    USING (is_workspace_member(get_map_workspace(map_id)));

CREATE POLICY "ai_runs_insert_editor"
    ON ai_runs FOR INSERT
    WITH CHECK (can_edit_workspace(get_map_workspace(map_id)));

-- Update via backend (sistema)
CREATE POLICY "ai_runs_update_system"
    ON ai_runs FOR UPDATE
    USING (true);

-- ============================================
-- RLS: references (CORRIGIDO: usa get_node_map, sem created_by)
-- ============================================
ALTER TABLE "references" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "references_select_member"
    ON "references" FOR SELECT
    USING (
        is_workspace_member(
            get_map_workspace(get_node_map(node_id))
        )
    );

CREATE POLICY "references_insert_editor"
    ON "references" FOR INSERT
    WITH CHECK (
        can_edit_workspace(
            get_map_workspace(get_node_map(node_id))
        )
    );

CREATE POLICY "references_update_editor"
    ON "references" FOR UPDATE
    USING (
        can_edit_workspace(
            get_map_workspace(get_node_map(node_id))
        )
    );

CREATE POLICY "references_delete_editor"
    ON "references" FOR DELETE
    USING (
        can_edit_workspace(
            get_map_workspace(get_node_map(node_id))
        )
    );

-- ============================================
-- REALTIME: Habilitar nas tabelas necessárias
-- ============================================
-- Nota: Execute isso no Dashboard do Supabase → Database → Replication
-- ou via SQL Editor:
-- 
-- ALTER PUBLICATION supabase_realtime ADD TABLE nodes;
-- ALTER PUBLICATION supabase_realtime ADD TABLE edges;
-- ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
-- ALTER PUBLICATION supabase_realtime ADD TABLE comments;
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- GRANTS: PostgREST (Supabase API) precisa de permissões de tabela
-- RLS continua sendo o guardrail real de segurança.
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

-- ============================================
-- FIM DAS POLÍTICAS RLS ✅
-- ============================================
