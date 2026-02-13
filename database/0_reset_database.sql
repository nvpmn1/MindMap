-- ============================================
-- RESET COMPLETO DO DATABASE
-- ⚠️ CUIDADO: Isso apaga TUDO!
-- Execute SOMENTE em desenvolvimento ou para recriar do zero
-- ============================================

-- Desabilitar RLS temporariamente
ALTER TABLE IF EXISTS workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS maps DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS nodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS edges DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS node_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "references" DISABLE ROW LEVEL SECURITY;

-- Dropar policies existentes
DROP POLICY IF EXISTS "workspaces_select_member" ON workspaces;
DROP POLICY IF EXISTS "workspaces_insert_authenticated" ON workspaces;
DROP POLICY IF EXISTS "workspaces_update_owner" ON workspaces;
DROP POLICY IF EXISTS "workspaces_delete_owner" ON workspaces;

DROP POLICY IF EXISTS "workspace_members_select_member" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert_owner_or_first" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members_update_owner" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete_owner" ON workspace_members;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;

DROP POLICY IF EXISTS "maps_select_member" ON maps;
DROP POLICY IF EXISTS "maps_insert_editor" ON maps;
DROP POLICY IF EXISTS "maps_update_editor" ON maps;
DROP POLICY IF EXISTS "maps_delete_creator_or_owner" ON maps;

DROP POLICY IF EXISTS "nodes_select_member" ON nodes;
DROP POLICY IF EXISTS "nodes_insert_editor" ON nodes;
DROP POLICY IF EXISTS "nodes_update_editor" ON nodes;
DROP POLICY IF EXISTS "nodes_delete_editor" ON nodes;

DROP POLICY IF EXISTS "edges_select_member" ON edges;
DROP POLICY IF EXISTS "edges_insert_editor" ON edges;
DROP POLICY IF EXISTS "edges_update_editor" ON edges;
DROP POLICY IF EXISTS "edges_delete_editor" ON edges;

DROP POLICY IF EXISTS "node_links_select_member" ON node_links;
DROP POLICY IF EXISTS "node_links_insert_editor" ON node_links;
DROP POLICY IF EXISTS "node_links_update_editor" ON node_links;
DROP POLICY IF EXISTS "node_links_delete_editor" ON node_links;

DROP POLICY IF EXISTS "tasks_select_member" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_editor" ON tasks;
DROP POLICY IF EXISTS "tasks_update_editor_or_assignee" ON tasks;
DROP POLICY IF EXISTS "tasks_delete_editor" ON tasks;

DROP POLICY IF EXISTS "comments_select_member" ON comments;
DROP POLICY IF EXISTS "comments_insert_member" ON comments;
DROP POLICY IF EXISTS "comments_update_author" ON comments;
DROP POLICY IF EXISTS "comments_delete_author_or_editor" ON comments;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_system" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;

DROP POLICY IF EXISTS "activity_events_select_member" ON activity_events;
DROP POLICY IF EXISTS "activity_events_insert_system" ON activity_events;

DROP POLICY IF EXISTS "ai_runs_select_member" ON ai_runs;
DROP POLICY IF EXISTS "ai_runs_insert_editor" ON ai_runs;
DROP POLICY IF EXISTS "ai_runs_update_system" ON ai_runs;

DROP POLICY IF EXISTS "references_select_member" ON "references";
DROP POLICY IF EXISTS "references_insert_editor" ON "references";
DROP POLICY IF EXISTS "references_update_creator_or_editor" ON "references";
DROP POLICY IF EXISTS "references_delete_creator_or_editor" ON "references";

-- Dropar triggers
DROP TRIGGER IF EXISTS set_updated_at_workspaces ON workspaces;
DROP TRIGGER IF EXISTS set_updated_at_profiles ON profiles;
DROP TRIGGER IF EXISTS set_updated_at_maps ON maps;
DROP TRIGGER IF EXISTS set_updated_at_nodes ON nodes;
DROP TRIGGER IF EXISTS set_updated_at_tasks ON tasks;
DROP TRIGGER IF EXISTS set_updated_at_comments ON comments;
DROP TRIGGER IF EXISTS increment_node_version ON nodes;
DROP TRIGGER IF EXISTS validate_edges_node_map_trigger ON edges;
DROP TRIGGER IF EXISTS on_task_delegation ON tasks;
DROP TRIGGER IF EXISTS on_comment_mention ON comments;

-- Dropar funções
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS increment_version() CASCADE;
DROP FUNCTION IF EXISTS validate_edges_node_map() CASCADE;
DROP FUNCTION IF EXISTS notify_task_delegation() CASCADE;
DROP FUNCTION IF EXISTS notify_comment_mention() CASCADE;
DROP FUNCTION IF EXISTS is_workspace_member(uuid) CASCADE;
DROP FUNCTION IF EXISTS can_edit_workspace(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_map_workspace(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_node_map(uuid) CASCADE;

-- Dropar tabelas (ordem reversa das dependências)
DROP TABLE IF EXISTS "references" CASCADE;
DROP TABLE IF EXISTS ai_runs CASCADE;
DROP TABLE IF EXISTS activity_events CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS node_links CASCADE;
DROP TABLE IF EXISTS edges CASCADE;
DROP TABLE IF EXISTS nodes CASCADE;
DROP TABLE IF EXISTS maps CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS workspace_members CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;

-- ============================================
-- RESET COMPLETO ✅
-- Agora execute: 1_schema.sql e depois 2_rls_policies.sql
-- ============================================
