# 🔐 Segurança e Row Level Security - MindMap Hub

## 1. Princípios de Segurança

### 1.1 Defense in Depth

```
┌─────────────────────────────────────────────────────────────┐
│                    Camadas de Segurança                      │
├─────────────────────────────────────────────────────────────┤
│  1. HTTPS (TLS)          - Criptografia em trânsito         │
│  2. Auth (JWT)           - Identidade verificada            │
│  3. CORS                 - Origem controlada                │
│  4. Rate Limiting        - Proteção contra abuso            │
│  5. Input Validation     - Dados sanitizados                │
│  6. RLS (Postgres)       - Acesso por linha                 │
│  7. Helmet Headers       - Proteção contra ataques web      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Regras de Ouro

| ❌ NUNCA | ✅ SEMPRE |
|----------|-----------|
| Expor service_role no frontend | Usar apenas anon key no frontend |
| Expor CLAUDE_API_KEY no frontend | Chamar Claude apenas pelo backend |
| Commitar .env com secrets | Usar .env.example sem valores reais |
| Desabilitar RLS em tabelas | RLS habilitado em TODAS as tabelas |
| Confiar em dados do cliente | Validar TUDO no backend |
| Usar anon sem verificação | Verificar JWT em rotas protegidas |

---

## 2. Autenticação (Supabase Auth)

### 2.1 Fluxo Magic Link

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User    │    │ Frontend │    │ Supabase │    │  Email   │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     │ 1. Email      │               │               │
     │──────────────▶│               │               │
     │               │ 2. signInWithOtp               │
     │               │──────────────▶│               │
     │               │               │ 3. Gera token │
     │               │               │──────────────▶│
     │               │               │  Envia email  │
     │               │  4. "Check"   │               │
     │◀──────────────│               │               │
     │                               │               │
     │ 5. Click link/código         │               │
     │───────────────────────────────│──────────────▶│
     │                               │ 6. Valida     │
     │                               │◀──────────────│
     │               │ 7. Session    │               │
     │               │◀──────────────│               │
     │               │               │               │
     │◀──────────────│ 8. Redirect   │               │
     │               │               │               │
```

### 2.2 Configuração de Redirect URLs

No Supabase Dashboard → Authentication → URL Configuration:

```
Site URL: https://mind-map-three-blue.vercel.app

Redirect URLs:
- http://localhost:5173/auth/callback
- http://localhost:5173/
- https://mind-map-three-blue.vercel.app/auth/callback
- https://mind-map-three-blue.vercel.app/
```

### 2.3 JWT Verification no Backend

```typescript
// middleware/auth.ts
import { createClient } from '@supabase/supabase-js';

export async function verifyAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token verification failed' });
  }
}
```

---

## 3. Row Level Security (RLS)

### 3.1 Conceito

RLS permite definir **políticas de acesso por linha** diretamente no Postgres.
Cada SELECT, INSERT, UPDATE, DELETE passa pela política antes de executar.

```sql
-- Exemplo: usuário só vê seus próprios dados
CREATE POLICY "Users see own data" ON profiles
  FOR SELECT
  USING (auth.uid() = user_id);
```

### 3.2 Helper Functions

```sql
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

-- Verifica se usuário é owner/editor do workspace
CREATE OR REPLACE FUNCTION can_edit_workspace(ws_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'editor')
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
```

---

## 4. Políticas RLS por Tabela

### 4.1 workspaces

```sql
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- SELECT: apenas membros veem
CREATE POLICY "Members can view workspace"
  ON workspaces FOR SELECT
  USING (is_workspace_member(id));

-- INSERT: qualquer autenticado pode criar
CREATE POLICY "Authenticated can create workspace"
  ON workspaces FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: apenas owner
CREATE POLICY "Owner can update workspace"
  ON workspaces FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- DELETE: apenas owner
CREATE POLICY "Owner can delete workspace"
  ON workspaces FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );
```

### 4.2 workspace_members

```sql
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- SELECT: membros veem outros membros
CREATE POLICY "Members can view members"
  ON workspace_members FOR SELECT
  USING (is_workspace_member(workspace_id));

-- INSERT: apenas owner pode adicionar
CREATE POLICY "Owner can add members"
  ON workspace_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = NEW.workspace_id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
    OR
    -- Primeiro membro (criador)
    NOT EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = NEW.workspace_id
    )
  );

-- DELETE: owner pode remover (exceto a si mesmo)
CREATE POLICY "Owner can remove members"
  ON workspace_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspace_members.workspace_id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
    AND user_id != auth.uid()
  );
```

### 4.3 profiles

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: todos autenticados veem (para presença)
CREATE POLICY "Authenticated can view profiles"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: apenas próprio perfil
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: apenas próprio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

### 4.4 maps

```sql
ALTER TABLE maps ENABLE ROW LEVEL SECURITY;

-- SELECT: membros do workspace
CREATE POLICY "Members can view maps"
  ON maps FOR SELECT
  USING (is_workspace_member(workspace_id));

-- INSERT: editors podem criar
CREATE POLICY "Editors can create maps"
  ON maps FOR INSERT
  WITH CHECK (can_edit_workspace(workspace_id));

-- UPDATE: editors podem editar
CREATE POLICY "Editors can update maps"
  ON maps FOR UPDATE
  USING (can_edit_workspace(workspace_id));

-- DELETE: apenas criador ou owner
CREATE POLICY "Creator/owner can delete maps"
  ON maps FOR DELETE
  USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = maps.workspace_id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );
```

### 4.5 nodes

```sql
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;

-- SELECT: membros do workspace do mapa
CREATE POLICY "Members can view nodes"
  ON nodes FOR SELECT
  USING (is_workspace_member(get_map_workspace(map_id)));

-- INSERT: editors
CREATE POLICY "Editors can create nodes"
  ON nodes FOR INSERT
  WITH CHECK (can_edit_workspace(get_map_workspace(map_id)));

-- UPDATE: editors
CREATE POLICY "Editors can update nodes"
  ON nodes FOR UPDATE
  USING (can_edit_workspace(get_map_workspace(map_id)));

-- DELETE: editors
CREATE POLICY "Editors can delete nodes"
  ON nodes FOR DELETE
  USING (can_edit_workspace(get_map_workspace(map_id)));
```

### 4.6 edges

```sql
ALTER TABLE edges ENABLE ROW LEVEL SECURITY;

-- Mesmas políticas que nodes
CREATE POLICY "Members can view edges"
  ON edges FOR SELECT
  USING (is_workspace_member(get_map_workspace(map_id)));

CREATE POLICY "Editors can create edges"
  ON edges FOR INSERT
  WITH CHECK (can_edit_workspace(get_map_workspace(map_id)));

CREATE POLICY "Editors can update edges"
  ON edges FOR UPDATE
  USING (can_edit_workspace(get_map_workspace(map_id)));

CREATE POLICY "Editors can delete edges"
  ON edges FOR DELETE
  USING (can_edit_workspace(get_map_workspace(map_id)));
```

### 4.7 tasks

```sql
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- SELECT: membros
CREATE POLICY "Members can view tasks"
  ON tasks FOR SELECT
  USING (is_workspace_member(get_map_workspace(map_id)));

-- INSERT: editors
CREATE POLICY "Editors can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (can_edit_workspace(get_map_workspace(map_id)));

-- UPDATE: editors OU assignee
CREATE POLICY "Editors or assignee can update tasks"
  ON tasks FOR UPDATE
  USING (
    can_edit_workspace(get_map_workspace(map_id))
    OR
    assignee_id = auth.uid()
  );

-- DELETE: editors
CREATE POLICY "Editors can delete tasks"
  ON tasks FOR DELETE
  USING (can_edit_workspace(get_map_workspace(map_id)));
```

### 4.8 comments

```sql
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- SELECT: membros (via node → map → workspace)
CREATE POLICY "Members can view comments"
  ON comments FOR SELECT
  USING (is_workspace_member(get_map_workspace(get_node_map(node_id))));

-- INSERT: membros
CREATE POLICY "Members can create comments"
  ON comments FOR INSERT
  WITH CHECK (
    is_workspace_member(get_map_workspace(get_node_map(node_id)))
    AND author_id = auth.uid()
  );

-- UPDATE: apenas autor
CREATE POLICY "Author can update comment"
  ON comments FOR UPDATE
  USING (author_id = auth.uid());

-- DELETE: autor ou editor
CREATE POLICY "Author or editor can delete comment"
  ON comments FOR DELETE
  USING (
    author_id = auth.uid()
    OR
    can_edit_workspace(get_map_workspace(get_node_map(node_id)))
  );
```

### 4.9 notifications

```sql
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- SELECT: apenas próprias
CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: sistema (via trigger ou backend)
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true); -- Controlado por trigger

-- UPDATE: apenas próprias (marcar como lida)
CREATE POLICY "Users can mark own notifications read"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: apenas próprias
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());
```

### 4.10 activity_events

```sql
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

-- SELECT: membros do workspace
CREATE POLICY "Members can view activity"
  ON activity_events FOR SELECT
  USING (is_workspace_member(workspace_id));

-- INSERT: sistema (via trigger)
CREATE POLICY "System can log activity"
  ON activity_events FOR INSERT
  WITH CHECK (true);
```

### 4.11 ai_runs

```sql
ALTER TABLE ai_runs ENABLE ROW LEVEL SECURITY;

-- SELECT: membros
CREATE POLICY "Members can view AI runs"
  ON ai_runs FOR SELECT
  USING (is_workspace_member(get_map_workspace(map_id)));

-- INSERT: editors
CREATE POLICY "Editors can create AI runs"
  ON ai_runs FOR INSERT
  WITH CHECK (can_edit_workspace(get_map_workspace(map_id)));

-- UPDATE: sistema (backend)
CREATE POLICY "System can update AI runs"
  ON ai_runs FOR UPDATE
  USING (true);
```

### 4.12 references

```sql
ALTER TABLE references ENABLE ROW LEVEL SECURITY;

-- SELECT: membros
CREATE POLICY "Members can view references"
  ON references FOR SELECT
  USING (is_workspace_member(get_map_workspace(get_node_map(node_id))));

-- INSERT: editors
CREATE POLICY "Editors can create references"
  ON references FOR INSERT
  WITH CHECK (can_edit_workspace(get_map_workspace(get_node_map(node_id))));

-- UPDATE: criador ou editor
CREATE POLICY "Creator or editor can update references"
  ON references FOR UPDATE
  USING (
    created_by = auth.uid()
    OR can_edit_workspace(get_map_workspace(get_node_map(node_id)))
  );

-- DELETE: criador ou editor
CREATE POLICY "Creator or editor can delete references"
  ON references FOR DELETE
  USING (
    created_by = auth.uid()
    OR can_edit_workspace(get_map_workspace(get_node_map(node_id)))
  );
```

---

## 5. Storage RLS

### 5.1 Bucket: attachments

```sql
-- Inserção: membros do workspace
CREATE POLICY "Members can upload attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'attachments'
    AND is_workspace_member(
      get_map_workspace(
        (storage.foldername(name))[1]::uuid
      )
    )
  );

-- Leitura: membros
CREATE POLICY "Members can read attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'attachments'
    AND is_workspace_member(
      get_map_workspace(
        (storage.foldername(name))[1]::uuid
      )
    )
  );

-- Deleção: quem fez upload ou editor
CREATE POLICY "Uploader or editor can delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'attachments'
    AND (
      owner = auth.uid()
      OR can_edit_workspace(
        get_map_workspace(
          (storage.foldername(name))[1]::uuid
        )
      )
    )
  );
```

### 5.2 Bucket: avatars

```sql
-- Inserção: próprio avatar
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1]::uuid = auth.uid()
  );

-- Leitura: público (qualquer autenticado)
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
  );

-- Deleção: próprio
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1]::uuid = auth.uid()
  );
```

---

## 6. Checklist de Segurança

### 6.1 Antes do Deploy

- [ ] Todas as tabelas têm RLS habilitado
- [ ] Nenhuma tabela usa `FOR ALL` com `USING (true)`
- [ ] Service role key só no backend
- [ ] Anon key no frontend (nunca service)
- [ ] Claude API key só no backend
- [ ] .env.example sem valores reais
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] Helmet headers configurados
- [ ] Redirect URLs configurados no Supabase

### 6.2 Testes de Segurança

```bash
# 1. Tentar acessar dados sem auth
curl https://api.mindmap.com/api/maps
# Esperado: 401 Unauthorized

# 2. Tentar acessar mapa de outro workspace (com token válido)
curl -H "Authorization: Bearer $TOKEN" \
  https://api.mindmap.com/api/maps/outro-workspace-id
# Esperado: 403 Forbidden ou empty array

# 3. Verificar headers de segurança
curl -I https://mind-map-three-blue.vercel.app
# Esperado: X-Content-Type-Options, X-Frame-Options, etc.
```

---

## 7. Resposta a Incidentes

### 7.1 Se Chave Vazou

1. **IMEDIATAMENTE** rotacionar a chave no dashboard
2. Verificar logs de acesso
3. Revogar sessões ativas se necessário
4. Atualizar env vars em todos os ambientes
5. Re-deploy

### 7.2 Chaves a Rotacionar

| Chave | Onde Rotacionar |
|-------|-----------------|
| SUPABASE_SERVICE_ROLE_KEY | Supabase Dashboard → Settings → API |
| SUPABASE_ANON_KEY | Mesmo local (mas é "público") |
| CLAUDE_API_KEY | console.anthropic.com → API Keys |
