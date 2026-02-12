# 🚀 Guia de Deploy - MindMap Hub

## 1. Visão Geral

```text
┌─────────────────────────────────────────────────────────────┐
│                    Ambiente de Produção                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   Vercel    │    │   Render    │    │  Supabase   │    │
│  │  Frontend   │───▶│  Backend    │───▶│  Database   │    │
│  │             │    │             │    │  Auth/RT    │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│                            │                               │
│                            ▼                               │
│                     ┌─────────────┐                        │
│                     │  Anthropic  │                        │
│                     │  Claude API │                        │
│                     └─────────────┘                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Pré-requisitos

### 2.1 Contas Necessárias

| Serviço   | URL                   | Para quê                 |
| --------- | --------------------- | ------------------------ |
| Supabase  | supabase.com          | Database, Auth, Realtime |
| Vercel    | vercel.com            | Frontend hosting         |
| Render    | render.com            | Backend hosting          |
| Anthropic | console.anthropic.com | Claude API               |
| GitHub    | github.com            | Repositório              |

### 2.2 Ferramentas Locais

```bash
# Node.js 20+
node --version  # v20.x.x

# npm ou yarn
npm --version   # 10.x.x

# Git
git --version   # 2.x.x
```

---

## 3. Setup Supabase

### 3.1 Criar Projeto

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Clique "New Project"
3. Preencha:
   - **Name**: mindmap-hub
   - **Database Password**: (guarde em local seguro!)
   - **Region**: South America (São Paulo) ou mais próximo
4. Aguarde criação (~2 min)

### 3.2 Obter Credenciais

Em **Settings → API**:

```text
Project URL: https://xxxxx.supabase.co
anon (public): eyJhbGci...
service_role: eyJhbGci... (NUNCA EXPOR!)
```

### 3.3 Executar Schema

1. Vá em **SQL Editor**
2. Execute os scripts na ordem:

```sql
-- 1. Primeiro: database/schema.sql
-- (criar tabelas)

-- 2. Segundo: database/rls_policies.sql
-- (criar políticas de segurança)

-- 3. Terceiro: database/seed.sql
-- (dados iniciais)
```

### 3.4 Configurar Auth

Em **Authentication → Providers**:

1. **Email** → Habilitar
2. Desmarcar "Enable email confirmations" (para Magic Link direto)
3. Em **URL Configuration**:
   - Site URL: `https://mindmap-hub.vercel.app`
   - Redirect URLs:

   ```text
     http://localhost:5173
     http://localhost:5173/auth/callback
     https://mindmap-hub.vercel.app
     https://mindmap-hub.vercel.app/auth/callback
   ```

### 3.5 Habilitar Realtime

Em **Database → Replication**:

1. Clique em `supabase_realtime`
2. Adicione as tabelas:
   - `nodes`
   - `edges`
   - `tasks`
   - `comments`
   - `notifications`

### 3.6 Configurar Storage (se necessário)

Em **Storage**:

1. Criar bucket `attachments` (private)
2. Criar bucket `avatars` (public)
3. Aplicar políticas RLS do arquivo `rls_policies.sql`

---

## 4. Setup Render (Backend)

### 4.1 Criar Web Service

1. Acesse [render.com/dashboard](https://render.com/dashboard)
2. Clique "New +" → "Web Service"
3. Conecte seu repositório GitHub
4. Configure:

```yaml
Name: mindmap-api
Root Directory: backend
Environment: Node
Region: Oregon (ou mais próximo)
Branch: main
Build Command: npm install && npm run build
Start Command: npm start
```

### 4.2 Variáveis de Ambiente

Em **Environment**:

```env
NODE_ENV=production
PORT=3001

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (service_role)

# Claude
CLAUDE_API_KEY=sk-ant-api03-...
CLAUDE_MODEL=claude-sonnet-4-20250514

# CORS
FRONTEND_URL=https://mindmap-hub.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

### 4.3 Verificar Deploy

Após deploy, teste:

```bash
curl https://mindmap-hub-api.onrender.com/health
# Esperado: {"status":"ok","timestamp":"..."}
```

### 4.4 Configurações Avançadas

Em **Settings**:

- **Auto-Deploy**: Yes (deploy em cada push)
- **Health Check Path**: `/health`
- **Docker Command**: (deixe vazio, usar Build/Start commands)

---

## 5. Setup Vercel (Frontend)

### 5.1 Importar Projeto

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Clique "Add New..." → "Project"
3. Importe do GitHub
4. Configure:

```yaml
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 5.2 Variáveis de Ambiente

Em **Settings → Environment Variables**:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci... (anon, NÃO service_role!)
VITE_API_URL=https://mindmap-hub-api.onrender.com
```

### 5.3 Configurar Domínio

Em **Settings → Domains**:

- Domínio padrão: `mindmap-hub.vercel.app`
- (Opcional) Adicionar domínio customizado

### 5.4 Verificar Deploy

1. Acesse a URL
2. Faça login com Magic Link
3. Teste criação de mapa

---

## 6. Checklist Pós-Deploy

### 6.1 Funcionalidade

- [ ] Login com Magic Link funciona
- [ ] Email de magic link chega
- [ ] Redirect após login funciona
- [ ] Criar mapa funciona
- [ ] Criar nó funciona
- [ ] Editar nó funciona
- [ ] Deletar nó funciona
- [ ] Expandir com IA funciona
- [ ] Realtime sync entre abas funciona
- [ ] Notificações aparecem
- [ ] Kanban drag & drop funciona

### 6.2 Segurança

- [ ] Service role key NÃO está no frontend
- [ ] Claude API key NÃO está no frontend
- [ ] RLS ativo em todas as tabelas
- [ ] CORS configurado corretamente
- [ ] HTTPS em todas as conexões

### 6.3 Performance

- [ ] Frontend carrega em < 3s
- [ ] Health check responde em < 500ms
- [ ] Mapa com 50 nós renderiza sem lag

---

## 7. Monitoramento

### 7.1 Render Logs

```bash
# Via dashboard ou CLI
render logs --tail mindmap-api
```

### 7.2 Vercel Logs

Em **Deployments → Functions** você vê logs do build.

### 7.3 Supabase Logs

Em **Logs → API** você vê requisições ao banco.

---

## 8. Atualizações (CI/CD)

### 8.1 Fluxo de Deploy

```text
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Dev    │───▶│  Push   │───▶│  Build  │───▶│  Deploy │
│  Local  │    │ GitHub  │    │  Auto   │    │  Auto   │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
```

### 8.2 Comandos

```bash
# Após fazer alterações
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# Vercel e Render detectam automaticamente e fazem deploy
```

### 8.3 Rollback

**Vercel:**

- Vá em Deployments
- Clique nos "..." do deploy anterior
- "Promote to Production"

**Render:**

- Vá em Events
- Clique "Rollback" no deploy anterior

### 8.3.1 Teste de rollback em ambiente real (runbook)

Execute este teste 1x por semana ou antes de release relevante.

1. Identifique o último deploy estável de frontend e backend.
2. Execute smoke atual para baseline:

```bash
npm run quality:gate
SMOKE_FRONTEND_URL=https://mindmap-hub.vercel.app SMOKE_BACKEND_URL=https://mindmap-hub-api.onrender.com npm run smoke:deploy:public
```

1. Provoque rollback controlado:
   - Vercel: promova o deploy anterior para produção.
   - Render: faça rollback para o deploy anterior em `Events`.
2. Aguarde estabilização (2-5 min) e rode smoke autenticado.
3. Critério de aprovação do rollback:
   - `/health` e `/health/detailed` OK
   - auth `/api/auth/me` = 200
   - CRUD de mapa/nó + IA + persistência = OK
   - sem spike critical em Sentry/Logtail por 15 min
4. Retorne ao deploy atual (roll-forward) e repita smoke.

Se qualquer etapa falhar, mantenha a versão estável e abra incidente com RCA.

### 8.4 Automação de Smoke no GitHub Actions

Workflow: `.github/workflows/production-smoke.yml`

Configure em **GitHub → Settings → Secrets and variables → Actions**:

### Variables

- `SMOKE_FRONTEND_URL=https://mindmap-hub.vercel.app`
- `SMOKE_BACKEND_URL=https://mindmap-hub-api.onrender.com`
- `SMOKE_WORKSPACE_ID` (opcional)

### Secrets

- `SMOKE_BEARER_TOKEN` (JWT válido para smoke autenticado)

Com isso, o smoke roda:

- manualmente (`Run workflow`)
- automaticamente a cada 6 horas

---

## 9. Troubleshooting

### 9.1 Erro: "Invalid API Key" (Claude)

```text
Causa: API key inválida ou expirada
Solução:
1. Verifique se a key está correta no Render
2. Regenere a key no console.anthropic.com se necessário
3. Redeploy o backend
```

### 9.2 Erro: "CORS Error"

```text
Causa: FRONTEND_URL não configurado corretamente
Solução:
1. Verifique FRONTEND_URL no Render env vars
2. Deve ser exatamente: https://mindmap-hub.vercel.app
3. Sem barra no final
4. Redeploy o backend
```

### 9.3 Erro: "RLS Policy Violation"

```text
Causa: Políticas de segurança bloqueando
Solução:
1. Verifique se o usuário é membro do workspace
2. Verifique se as políticas RLS estão corretas
3. Use o SQL Editor do Supabase para debug
```

### 9.4 Erro: "Magic Link não chega"

```text
Causa: Configuração de email ou redirect
Solução:
1. Verifique spam/lixo eletrônico
2. Confirme Redirect URLs no Supabase Auth
3. Verifique se o email está correto
```

### 9.5 Erro: "502 Bad Gateway" (Render)

```text
Causa: Backend não iniciou corretamente
Solução:
1. Verifique logs no Render
2. Confirme PORT=3001 nas env vars
3. Verifique se build foi bem-sucedido
4. Verifique health check path
```

---

## 10. Custos Estimados

### 10.1 Planos Gratuitos (MVP)

| Serviço   | Plano         | Limite                      |
| --------- | ------------- | --------------------------- |
| Supabase  | Free          | 500MB DB, 1GB transfer      |
| Vercel    | Hobby         | 100GB bandwidth             |
| Render    | Free          | 750h/mês (sleep após 15min) |
| Anthropic | Pay-as-you-go | ~$3/1M tokens (Sonnet)      |

### 10.2 Estimativa Mensal (3 usuários ativos)

```text
Supabase Free:     $0
Vercel Hobby:      $0
Render Free:       $0
Claude (~100 calls): ~$5-10

Total Estimado: $5-10/mês
```

### 10.3 Escala (se precisar)

| Serviço        | Plano Pago | Preço                 |
| -------------- | ---------- | --------------------- |
| Supabase Pro   | $25/mês    | 8GB DB, 50GB transfer |
| Vercel Pro     | $20/mês    | Unlimited bandwidth   |
| Render Starter | $7/mês     | Always on, no sleep   |

---

## 11. Backup e Recovery

### 11.1 Supabase Backups

- Backup automático diário (Pro plan)
- Point-in-time recovery (Pro plan)
- Export manual via `pg_dump`

### 11.2 Backup Manual

```bash
# Via psql (connection string do Supabase)
pg_dump "postgresql://..." > backup.sql
```

### 11.3 Restore

```bash
# Via psql
psql "postgresql://..." < backup.sql
```

---

## 12. Comandos Úteis

### 12.1 Desenvolvimento Local

```bash
# Clonar
git clone <repo>
cd mindmap-hub

# Backend
cd backend
cp .env.example .env
npm install
npm run dev

# Frontend (outro terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

### 12.2 Build e Test

```bash
# Backend
cd backend
npm run build
npm run test

# Frontend
cd frontend
npm run build
npm run preview
```

### 12.3 Deploy Manual (se necessário)

```bash
# Vercel CLI
npm i -g vercel
cd frontend
vercel --prod

# Render CLI
# (Render não tem CLI oficial, use dashboard)
```
