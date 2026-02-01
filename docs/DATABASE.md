# 🗄️ Modelo de Dados - MindMap Hub

## 1. Diagrama de Entidade-Relacionamento

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   workspaces    │       │workspace_members│       │    profiles     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │◀──────│ workspace_id    │       │ id (PK)         │
│ name            │       │ user_id (FK)────│──────▶│ user_id (FK)    │
│ created_at      │       │ role            │       │ display_name    │
│ created_by      │       │ joined_at       │       │ avatar_url      │
└─────────────────┘       └─────────────────┘       │ color           │
        │                                           │ preferences     │
        │                                           └─────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      maps       │       │     nodes       │       │     edges       │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │◀──────│ map_id (FK)     │       │ id (PK)         │
│ workspace_id    │       │ id (PK)         │◀──────│ map_id (FK)     │
│ title           │       │ parent_id (FK)──│──┐    │ source_id (FK)  │
│ template_type   │       │ title           │  │    │ target_id (FK)  │
│ status          │       │ content         │  │    │ label           │
│ created_by      │       │ position_x      │◀─┘    │ type            │
│ created_at      │       │ position_y      │       │ created_at      │
│ updated_at      │       │ color           │       └─────────────────┘
└─────────────────┘       │ icon            │
        │                 │ status          │
        │                 │ tags            │
        │ 1:N             │ created_by      │
        ▼                 │ created_at      │
┌─────────────────┐       │ updated_at      │
│     tasks       │       │ version         │
├─────────────────┤       └─────────────────┘
│ id (PK)         │               │
│ map_id (FK)     │               │ 1:N (opcional)
│ node_id (FK)────│───────────────┘
│ title           │
│ description     │       ┌─────────────────┐
│ status          │       │    comments     │
│ priority        │       ├─────────────────┤
│ type            │       │ id (PK)         │
│ assignee_id     │       │ node_id (FK)    │
│ due_date        │       │ author_id (FK)  │
│ created_by      │       │ content         │
│ created_at      │       │ mentions        │
│ updated_at      │       │ created_at      │
└─────────────────┘       │ updated_at      │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  notifications  │       │ activity_events │       │    ai_runs      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ user_id (FK)    │       │ workspace_id    │       │ map_id (FK)     │
│ type            │       │ map_id          │       │ action_type     │
│ title           │       │ node_id         │       │ input           │
│ body            │       │ user_id         │       │ output          │
│ data            │       │ action          │       │ diffs           │
│ read_at         │       │ metadata        │       │ tokens_used     │
│ created_at      │       │ created_at      │       │ created_by      │
└─────────────────┘       └─────────────────┘       │ created_at      │
                                                    └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│   node_links    │       │   references    │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ map_id (FK)     │       │ node_id (FK)    │
│ source_id (FK)  │       │ url             │
│ target_id (FK)  │       │ title           │
│ link_type       │       │ citation        │
│ strength        │       │ notes           │
│ created_at      │       │ created_at      │
└─────────────────┘       └─────────────────┘
```

---

## 2. Definição de Tabelas

### 2.1 workspaces

Espaço de trabalho compartilhado (apenas "MindLab" no MVP).

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | ID único |
| `name` | varchar(255) | NOT NULL | Nome do workspace |
| `description` | text | | Descrição |
| `created_by` | uuid | FK auth.users | Criador |
| `created_at` | timestamptz | DEFAULT now() | Criação |
| `updated_at` | timestamptz | DEFAULT now() | Atualização |

### 2.2 workspace_members

Membros do workspace com seus papéis.

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | ID único |
| `workspace_id` | uuid | FK workspaces, NOT NULL | Workspace |
| `user_id` | uuid | FK auth.users, NOT NULL | Usuário |
| `role` | varchar(20) | NOT NULL, CHECK | Papel (owner/editor/viewer) |
| `joined_at` | timestamptz | DEFAULT now() | Data de entrada |

**Unique:** (workspace_id, user_id)

### 2.3 profiles

Perfil visual e preferências do usuário.

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | ID único |
| `user_id` | uuid | FK auth.users, UNIQUE, NOT NULL | Usuário |
| `display_name` | varchar(100) | NOT NULL | Nome de exibição |
| `avatar_url` | text | | URL do avatar |
| `color` | varchar(7) | DEFAULT '#6366f1' | Cor do usuário (hex) |
| `preferences` | jsonb | DEFAULT '{}' | Preferências |
| `created_at` | timestamptz | DEFAULT now() | Criação |
| `updated_at` | timestamptz | DEFAULT now() | Atualização |

### 2.4 maps

Mapas mentais.

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | ID único |
| `workspace_id` | uuid | FK workspaces, NOT NULL | Workspace |
| `title` | varchar(255) | NOT NULL | Título do mapa |
| `description` | text | | Descrição |
| `template_type` | varchar(50) | | Tipo de template usado |
| `status` | varchar(20) | DEFAULT 'active' | Status (active/archived) |
| `settings` | jsonb | DEFAULT '{}' | Config do mapa |
| `created_by` | uuid | FK auth.users | Criador |
| `created_at` | timestamptz | DEFAULT now() | Criação |
| `updated_at` | timestamptz | DEFAULT now() | Atualização |

### 2.5 nodes

Nós do mindmap.

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | ID único |
| `map_id` | uuid | FK maps, NOT NULL | Mapa pai |
| `parent_id` | uuid | FK nodes | Nó pai (NULL = root) |
| `title` | varchar(500) | NOT NULL | Título do nó |
| `content` | text | | Conteúdo/descrição |
| `position_x` | float | NOT NULL DEFAULT 0 | Posição X no canvas |
| `position_y` | float | NOT NULL DEFAULT 0 | Posição Y no canvas |
| `width` | float | DEFAULT 200 | Largura do nó |
| `height` | float | DEFAULT 80 | Altura do nó |
| `color` | varchar(7) | | Cor do nó (hex) |
| `icon` | varchar(50) | | Ícone (nome do lucide) |
| `node_type` | varchar(30) | DEFAULT 'default' | Tipo (default/task/note/etc) |
| `status` | varchar(20) | DEFAULT 'open' | Status do nó |
| `tags` | text[] | DEFAULT '{}' | Tags/labels |
| `metadata` | jsonb | DEFAULT '{}' | Dados extras |
| `order_index` | int | DEFAULT 0 | Ordem entre irmãos |
| `is_collapsed` | boolean | DEFAULT false | Subárvore colapsada |
| `created_by` | uuid | FK auth.users | Criador |
| `created_at` | timestamptz | DEFAULT now() | Criação |
| `updated_at` | timestamptz | DEFAULT now() | Atualização |
| `version` | int | DEFAULT 1 | Versão (para conflitos) |

**Indexes:**
- `idx_nodes_map_id` ON (map_id)
- `idx_nodes_parent_id` ON (parent_id)

### 2.6 edges

Conexões visuais entre nós.

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | ID único |
| `map_id` | uuid | FK maps, NOT NULL | Mapa |
| `source_id` | uuid | FK nodes, NOT NULL | Nó origem |
| `target_id` | uuid | FK nodes, NOT NULL | Nó destino |
| `label` | varchar(100) | | Label na conexão |
| `edge_type` | varchar(30) | DEFAULT 'default' | Tipo (default/dashed/etc) |
| `color` | varchar(7) | | Cor da linha |
| `animated` | boolean | DEFAULT false | Animação |
| `created_at` | timestamptz | DEFAULT now() | Criação |

**Unique:** (source_id, target_id)

### 2.7 node_links

Conexões semânticas (sem linha visual) - "rede neural".

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | ID único |
| `map_id` | uuid | FK maps, NOT NULL | Mapa |
| `source_id` | uuid | FK nodes, NOT NULL | Nó origem |
| `target_id` | uuid | FK nodes, NOT NULL | Nó destino |
| `link_type` | varchar(50) | DEFAULT 'related' | Tipo de relação |
| `strength` | float | DEFAULT 1.0 | Força da conexão (0-1) |
| `notes` | text | | Notas sobre a relação |
| `created_by` | uuid | FK auth.users | Criador |
| `created_at` | timestamptz | DEFAULT now() | Criação |

### 2.8 tasks

Tarefas derivadas de nós.

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | ID único |
| `map_id` | uuid | FK maps, NOT NULL | Mapa |
| `node_id` | uuid | FK nodes | Nó relacionado (opcional) |
| `title` | varchar(500) | NOT NULL | Título da tarefa |
| `description` | text | | Descrição detalhada |
| `status` | varchar(20) | DEFAULT 'backlog' | Status (backlog/doing/waiting/done) |
| `priority` | varchar(20) | DEFAULT 'medium' | Prioridade (low/medium/high/urgent) |
| `task_type` | varchar(30) | DEFAULT 'task' | Tipo (task/research/review/decision) |
| `assignee_id` | uuid | FK auth.users | Responsável |
| `due_date` | date | | Data limite |
| `completed_at` | timestamptz | | Data de conclusão |
| `order_index` | int | DEFAULT 0 | Ordem no kanban |
| `created_by` | uuid | FK auth.users | Criador |
| `created_at` | timestamptz | DEFAULT now() | Criação |
| `updated_at` | timestamptz | DEFAULT now() | Atualização |

**Indexes:**
- `idx_tasks_map_id` ON (map_id)
- `idx_tasks_assignee_id` ON (assignee_id)
- `idx_tasks_status` ON (status)

### 2.9 comments

Comentários em nós.

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | ID único |
| `node_id` | uuid | FK nodes, NOT NULL | Nó |
| `author_id` | uuid | FK auth.users, NOT NULL | Autor |
| `content` | text | NOT NULL | Conteúdo |
| `mentions` | uuid[] | DEFAULT '{}' | Users mencionados |
| `created_at` | timestamptz | DEFAULT now() | Criação |
| `updated_at` | timestamptz | DEFAULT now() | Atualização |

### 2.10 notifications

Notificações para usuários.

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | ID único |
| `user_id` | uuid | FK auth.users, NOT NULL | Destinatário |
| `type` | varchar(30) | NOT NULL | Tipo (delegation/comment/mention/etc) |
| `title` | varchar(255) | NOT NULL | Título |
| `body` | text | | Corpo |
| `data` | jsonb | DEFAULT '{}' | Dados extras (map_id, node_id, etc) |
| `read_at` | timestamptz | | Data de leitura |
| `created_at` | timestamptz | DEFAULT now() | Criação |

**Indexes:**
- `idx_notifications_user_id` ON (user_id)
- `idx_notifications_unread` ON (user_id) WHERE read_at IS NULL

### 2.11 activity_events

Log de atividades (audit trail).

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | ID único |
| `workspace_id` | uuid | FK workspaces | Workspace |
| `map_id` | uuid | FK maps | Mapa |
| `node_id` | uuid | FK nodes | Nó |
| `user_id` | uuid | FK auth.users | Usuário |
| `action` | varchar(50) | NOT NULL | Ação (create/update/delete/etc) |
| `entity_type` | varchar(30) | NOT NULL | Tipo de entidade |
| `entity_id` | uuid | NOT NULL | ID da entidade |
| `metadata` | jsonb | DEFAULT '{}' | Dados da ação |
| `created_at` | timestamptz | DEFAULT now() | Timestamp |

### 2.12 ai_runs

Execuções de ações de IA.

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | ID único |
| `map_id` | uuid | FK maps, NOT NULL | Mapa |
| `node_id` | uuid | FK nodes | Nó (se aplicável) |
| `action_type` | varchar(50) | NOT NULL | Tipo (generate/expand/summarize/etc) |
| `input` | jsonb | NOT NULL | Input da ação |
| `output` | jsonb | | Output da IA |
| `diffs` | jsonb | | Mudanças aplicadas |
| `status` | varchar(20) | DEFAULT 'pending' | Status (pending/completed/failed) |
| `tokens_input` | int | | Tokens de input |
| `tokens_output` | int | | Tokens de output |
| `model` | varchar(50) | | Modelo usado |
| `duration_ms` | int | | Duração em ms |
| `error` | text | | Erro se falhou |
| `created_by` | uuid | FK auth.users | Quem executou |
| `created_at` | timestamptz | DEFAULT now() | Criação |
| `completed_at` | timestamptz | | Conclusão |

### 2.13 references

Referências/links externos em nós.

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | ID único |
| `node_id` | uuid | FK nodes, NOT NULL | Nó |
| `url` | text | NOT NULL | URL |
| `title` | varchar(255) | | Título |
| `citation` | text | | Citação formatada |
| `notes` | text | | Notas |
| `type` | varchar(30) | DEFAULT 'link' | Tipo (link/paper/book/etc) |
| `created_by` | uuid | FK auth.users | Criador |
| `created_at` | timestamptz | DEFAULT now() | Criação |

### 2.14 files (Storage)

Arquivos são gerenciados pelo Supabase Storage, não por tabela.

**Buckets:**
- `attachments` - Arquivos anexados a nós
- `avatars` - Avatares de usuários

**Path convention:**
- `attachments/{map_id}/{node_id}/{filename}`
- `avatars/{user_id}/{filename}`

---

## 3. Enums e Constraints

### 3.1 Status de Nó
```
'open' | 'in_progress' | 'completed' | 'blocked'
```

### 3.2 Status de Task
```
'backlog' | 'doing' | 'waiting' | 'done'
```

### 3.3 Prioridade
```
'low' | 'medium' | 'high' | 'urgent'
```

### 3.4 Tipo de Task
```
'task' | 'research' | 'review' | 'decision' | 'execution'
```

### 3.5 Role no Workspace
```
'owner' | 'editor' | 'viewer'
```

### 3.6 Tipo de Notificação
```
'delegation' | 'comment' | 'mention' | 'task_done' | 'ai_complete'
```

### 3.7 Templates de Mapa
```
'research' | 'paper_reading' | 'project_plan' | 'decision' |
'brainstorm' | 'study' | 'writing' | 'mitigation' | 'network' | 'custom'
```

---

## 4. Views Úteis (opcional)

### 4.1 my_tasks

Tasks atribuídas ao usuário atual.

```sql
CREATE VIEW my_tasks AS
SELECT t.*, m.title as map_title, n.title as node_title
FROM tasks t
JOIN maps m ON t.map_id = m.id
LEFT JOIN nodes n ON t.node_id = n.id
WHERE t.assignee_id = auth.uid();
```

### 4.2 recent_activity

Atividade recente no workspace.

```sql
CREATE VIEW recent_activity AS
SELECT *
FROM activity_events
WHERE workspace_id IN (
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
)
ORDER BY created_at DESC
LIMIT 50;
```

---

## 5. Functions e Triggers

### 5.1 auto_update_timestamp

Atualiza `updated_at` automaticamente.

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em todas as tabelas com updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### 5.2 notify_on_task_delegation

Cria notificação ao delegar task.

```sql
CREATE OR REPLACE FUNCTION notify_task_delegation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assignee_id IS NOT NULL AND NEW.assignee_id != OLD.assignee_id THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.assignee_id,
      'delegation',
      'Nova tarefa delegada',
      'Você recebeu a tarefa: ' || NEW.title,
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
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_delegation();
```

### 5.3 increment_node_version

Incrementa versão ao atualizar nó.

```sql
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_node_version
  BEFORE UPDATE ON nodes
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();
```

---

## 6. Índices para Performance

```sql
-- Busca de nós por mapa (mais frequente)
CREATE INDEX idx_nodes_map_id ON nodes(map_id);
CREATE INDEX idx_nodes_parent_id ON nodes(parent_id);

-- Tasks por assignee e status
CREATE INDEX idx_tasks_assignee_status ON tasks(assignee_id, status);
CREATE INDEX idx_tasks_map_status ON tasks(map_id, status);

-- Notificações não lidas
CREATE INDEX idx_notifications_unread ON notifications(user_id) 
  WHERE read_at IS NULL;

-- Activity por workspace e data
CREATE INDEX idx_activity_workspace_time ON activity_events(workspace_id, created_at DESC);

-- Comentários por nó
CREATE INDEX idx_comments_node_id ON comments(node_id);
```

---

## 7. Configuração Realtime

Habilitar Realtime nas tabelas que precisam de sync:

```sql
-- No Supabase Dashboard ou via API
ALTER PUBLICATION supabase_realtime ADD TABLE nodes;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

---

## 8. Seed Data (MVP)

```sql
-- Workspace MindLab
INSERT INTO workspaces (id, name, description)
VALUES ('11111111-1111-1111-1111-111111111111', 'MindLab', 'Workspace de pesquisa colaborativa');

-- Os 3 usuários iniciais serão criados via Magic Link
-- Profiles serão inseridos após primeiro login
```
