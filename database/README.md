# 🗄️ Setup do Database - MindMap Hub

## ✅ Status: CORRIGIDO e Pronto para Uso

**Última correção:** Ordem de criação das tabelas — `profiles` criada ANTES de `workspaces` (resolvia erro de dependência circular).

---

## Ordem de Execução no Supabase SQL Editor

### 1️⃣ **RESET (se necessário)**

```sql
-- Execute SOMENTE se precisa limpar o banco existente
-- ⚠️ CUIDADO: Apaga TUDO!
```

**Arquivo:** `0_reset_database.sql`  
**Quando usar:** Primeira vez OU se precisar recriar do zero

---

### 2️⃣ **SCHEMA (obrigatório)**

```sql
-- Cria todas as tabelas, triggers, funções
```

**Arquivo:** `1_schema.sql`  
**Cria:** 13 tabelas + triggers + workspace padrão

---

### 3️⃣ **RLS POLICIES (obrigatório)**

```sql
-- Configura as políticas de segurança Row Level Security
```

**Arquivo:** `2_rls_policies.sql`  
**Configura:** Permissões por workspace/role

---

## 📋 Checklist Pós-Execução

Após executar os 3 arquivos SQL, configure no **Supabase Dashboard**:

### Authentication

1. **Auth → Providers → Email**
   - ✅ Enable Email provider
   - ✅ Confirm email: OFF (para Magic Link)
   - ✅ Secure email change: ON

2. **Auth → URL Configuration**
   - Site URL: `https://mindmap-hub.vercel.app`
   - Redirect URLs (adicione):
     - `https://mindmap-hub.vercel.app/auth/callback`
     - `http://localhost:5173/auth/callback` (dev)

### Database Replication (Realtime)

1. **Database → Replication**
2. Habilite as seguintes tabelas:
   - ✅ `nodes`
   - ✅ `edges`
   - ✅ `tasks`
   - ✅ `comments`
   - ✅ `notifications`

### API Settings

1. **Settings → API**
2. Copie as credenciais para usar no backend:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` ⚠️ (nunca exponha no frontend!)

---

## 🔍 Verificação

Execute no SQL Editor para testar:

```sql
-- Ver tabelas criadas
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Ver policies criadas
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Ver workspace padrão
SELECT * FROM workspaces;
```

---

## 🐛 Troubleshooting

### ✅ CORRIGIDO: "relation 'profiles' does not exist"
**Problema anterior:** `workspaces` era criado antes de `profiles`, mas referenciava `profiles.id`  
**Correção aplicada:** Ordem ajustada — `profiles` criado PRIMEIRO, depois `workspaces`  
**Status:** Resolvido no commit `703f128`

### ✅ CORRIGIDO: "relation 'maps' does not exist" em helper functions
**Problema anterior:** Funções RLS helper referenciavam tabelas que ainda não existiam  
**Correção aplicada:** Funções criadas no `2_rls_policies.sql` APÓS as tabelas existirem  
**Status:** Resolvido — sempre executar `1_schema.sql` ANTES de `2_rls_policies.sql`

### Erro: "column does not exist"
✅ **Solução:** Execute `0_reset_database.sql` e recomece do início

### Erro: "policy already exists"
✅ **Solução:** Execute `0_reset_database.sql` primeiro

### RLS bloqueia tudo
✅ **Solução:** Certifique-se que o usuário está autenticado via Supabase Auth e é membro de um workspace

---

## 📊 Estrutura do Banco

```
workspaces (espaços de trabalho)
  ├─ workspace_members (usuários do workspace)
  ├─ maps (mapas mentais)
  │   ├─ nodes (nós do mapa)
  │   │   ├─ tasks (tarefas)
  │   │   ├─ comments (comentários)
  │   │   ├─ references (links externos)
  │   │   └─ node_links (conexões semânticas)
  │   └─ edges (conexões visuais)
  │   └─ ai_runs (histórico IA)
  └─ activity_events (log de atividades)

profiles (perfis de usuário)
notifications (notificações)
```

---

_Última atualização: 08/02/2026_
