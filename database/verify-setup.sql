-- ============================================
-- ENABLE REALTIME PARA COLABORAÇÃO
-- Execute este SQL se o schema.sql não houver funcionado completamente
-- ============================================

-- 1. Garantir extensões habilitadas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Habilitar Realtime para tabelas principais
ALTER PUBLICATION supabase_realtime ADD TABLE nodes;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;

-- 3. Verificar dados iniciais
SELECT COUNT(*) as "Total de Usuários" FROM users;
SELECT COUNT(*) as "Total de Mapas" FROM mindmaps;
SELECT COUNT(*) as "Total de Nós" FROM nodes;

-- Se não houver usuários, inserir os predefinidos:
INSERT INTO users (id, name, email, color, role) VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Guilherme', 'guilherme@mindmap.com', '#6366f1', 'admin'),
    ('22222222-2222-2222-2222-222222222222', 'Helen', 'helen@mindmap.com', '#ec4899', 'member'),
    ('33333333-3333-3333-3333-333333333333', 'Pablo', 'pablo@mindmap.com', '#10b981', 'member')
ON CONFLICT (email) DO UPDATE SET 
    name = EXCLUDED.name,
    color = EXCLUDED.color,
    role = EXCLUDED.role;

-- 4. Verificar se tudo está OK
SELECT 'Usuários' as Entity, COUNT(*) as Count FROM users
UNION ALL
SELECT 'Mapas Mentais', COUNT(*) FROM mindmaps
UNION ALL
SELECT 'Nós', COUNT(*) FROM nodes
UNION ALL
SELECT 'Tabelas OK' as Entity, 
  CASE WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') >= 8 
    THEN COUNT(*)::text 
    ELSE '0' 
  END as Count
FROM information_schema.tables;

-- ✅ Se tudo acima funcionou, o banco está pronto!
