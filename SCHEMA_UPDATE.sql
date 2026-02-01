-- ATUALIZAÇÃO: Adicionar colunas faltantes à tabela nodes
-- Se o schema anterior foi criado, execute isto para atualizar

ALTER TABLE nodes ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'text';
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS position_x FLOAT DEFAULT 0;
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS position_y FLOAT DEFAULT 0;
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Adicionar coluna visibility à tabela mindmaps
ALTER TABLE mindmaps ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'shared';

-- Pronto! Agora o banco de dados está com todas as colunas necessárias.
