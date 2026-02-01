-- ============================================
-- MindMap Hub - Seed Data
-- Execute APÓS schema.sql e rls_policies.sql
-- ============================================

-- ============================================
-- NOTA IMPORTANTE:
-- Este seed cria o workspace "MindLab" que será
-- usado pelos 3 usuários iniciais.
-- 
-- Os usuários serão criados automaticamente
-- quando fizerem login via Magic Link.
-- Após o primeiro login, execute o script
-- abaixo para adicionar os membros ao workspace.
-- ============================================

-- Criar workspace MindLab
INSERT INTO workspaces (id, name, description)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'MindLab',
    'Workspace de pesquisa colaborativa para Guilherme, Helen e Pablo'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- APÓS os 3 usuários fazerem primeiro login,
-- execute o script abaixo substituindo os UUIDs
-- reais dos usuários:
-- ============================================

/*
-- Substituir USER_ID_GUILHERME, USER_ID_HELEN, USER_ID_PABLO
-- pelos IDs reais obtidos da tabela auth.users

-- Adicionar Guilherme como owner
INSERT INTO workspace_members (workspace_id, user_id, role)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'USER_ID_GUILHERME',
    'owner'
);

-- Adicionar Helen como editor
INSERT INTO workspace_members (workspace_id, user_id, role)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'USER_ID_HELEN',
    'editor'
);

-- Adicionar Pablo como editor
INSERT INTO workspace_members (workspace_id, user_id, role)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'USER_ID_PABLO',
    'editor'
);

-- Criar profiles (após login)
INSERT INTO profiles (user_id, display_name, color)
VALUES 
    ('USER_ID_GUILHERME', 'Guilherme', '#6366f1'),
    ('USER_ID_HELEN', 'Helen', '#ec4899'),
    ('USER_ID_PABLO', 'Pablo', '#10b981');
*/

-- ============================================
-- TEMPLATES DE MAPAS (opcional)
-- ============================================

-- Template de estrutura para referência
-- Estes são exemplos que a IA usará como base

/*
-- Exemplo de mapa de pesquisa
INSERT INTO maps (id, workspace_id, title, template_type, status)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '[TEMPLATE] Pesquisa Científica',
    'research',
    'active'
);

-- Nó raiz
INSERT INTO nodes (id, map_id, title, position_x, position_y, icon, node_type)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    'Pergunta Central',
    400, 100,
    'target',
    'default'
);

-- Sub-nós do template
INSERT INTO nodes (map_id, parent_id, title, position_x, position_y, icon, order_index)
VALUES 
    ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Hipótese 1', 200, 250, 'lightbulb', 0),
    ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Hipótese 2', 400, 250, 'lightbulb', 1),
    ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Riscos', 600, 250, 'alert-triangle', 2);
*/

-- ============================================
-- FIM DO SEED
-- ============================================
