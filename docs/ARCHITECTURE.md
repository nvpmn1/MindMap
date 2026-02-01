# 🏛️ Arquitetura Técnica - MindMap Hub

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                    │
└─────────────────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
    ┌───────────────────────────┐   ┌───────────────────────────┐
    │        VERCEL             │   │        RENDER             │
    │   ┌───────────────────┐   │   │   ┌───────────────────┐   │
    │   │    Frontend       │   │   │   │     Backend       │   │
    │   │   Vite + React    │   │   │   │   Node/Express    │   │
    │   │   TypeScript      │   │   │   │   TypeScript      │   │
    │   └─────────┬─────────┘   │   │   └─────────┬─────────┘   │
    │             │             │   │             │             │
    └─────────────┼─────────────┘   └─────────────┼─────────────┘
                  │                               │
                  │ HTTPS                         │ HTTPS
                  │ (API calls)                   │ (Claude API)
                  │                               │
                  │         ┌─────────────────────┼───────────────┐
                  │         │                     │               │
                  ▼         ▼                     ▼               │
    ┌─────────────────────────────────────┐    ┌─────────────────┴───┐
    │            SUPABASE                 │    │    ANTHROPIC        │
    │  ┌─────────┐ ┌─────────┐ ┌───────┐ │    │  ┌───────────────┐  │
    │  │Postgres │ │  Auth   │ │Realtime│ │    │  │  Claude API   │  │
    │  │   DB    │ │ Magic   │ │Presence│ │    │  │  Opus 4.5     │  │
    │  │  +RLS   │ │  Link   │ │Broadcast│ │    │  └───────────────┘  │
    │  └─────────┘ └─────────┘ └───────┘ │    └─────────────────────┘
    │  ┌─────────┐                       │
    │  │ Storage │                       │
    │  │ (Files) │                       │
    │  └─────────┘                       │
    └─────────────────────────────────────┘
```

---

## 2. Stack Tecnológica Detalhada

### 2.1 Frontend (Vercel)

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Vite** | 5.x | Build tool, dev server, HMR |
| **React** | 18.x | UI library |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 3.x | Utility-first styling |
| **@xyflow/react** | 12.x | Canvas de mindmap (ex-React Flow) |
| **Zustand** | 4.x | State management |
| **@supabase/supabase-js** | 2.x | Cliente Supabase |
| **Framer Motion** | 11.x | Animações |
| **React Router** | 6.x | Roteamento |
| **React Hook Form** | 7.x | Formulários |
| **Zod** | 3.x | Validação |
| **date-fns** | 3.x | Manipulação de datas |
| **Lucide React** | 0.x | Ícones |

### 2.2 Backend (Render)

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Node.js** | 20.x | Runtime |
| **Express** | 4.x | Framework HTTP |
| **TypeScript** | 5.x | Type safety |
| **@supabase/supabase-js** | 2.x | Cliente Supabase (service role) |
| **@anthropic-ai/sdk** | 0.x | SDK Claude |
| **cors** | 2.x | CORS middleware |
| **helmet** | 7.x | Security headers |
| **express-rate-limit** | 7.x | Rate limiting |
| **zod** | 3.x | Validação de input |
| **pino** | 8.x | Logging estruturado |

### 2.3 Database (Supabase)

| Componente | Uso |
|------------|-----|
| **PostgreSQL 15** | Banco relacional principal |
| **Row Level Security** | Controle de acesso por linha |
| **Realtime** | WebSocket para sync |
| **Auth** | Autenticação passwordless |
| **Storage** | Arquivos e anexos |

---

## 3. Fluxos de Dados

### 3.1 Autenticação (Magic Link)

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User    │    │ Frontend │    │ Supabase │    │  Email   │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     │ Enter email   │               │               │
     │──────────────▶│               │               │
     │               │ signInWithOtp │               │
     │               │──────────────▶│               │
     │               │               │ Send email    │
     │               │               │──────────────▶│
     │               │               │               │
     │               │  "Check email"│               │
     │◀──────────────│               │               │
     │                               │               │
     │ Click magic link              │               │
     │───────────────────────────────│──────────────▶│
     │                               │               │
     │               │◀──────────────│ Verify token  │
     │               │  Session      │               │
     │               │               │               │
     │◀──────────────│ Redirect /home│               │
     │               │               │               │
```

### 3.2 Carregamento de Mapa

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User    │    │ Frontend │    │ Supabase │    │ Realtime │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     │ Open map      │               │               │
     │──────────────▶│               │               │
     │               │ SELECT map    │               │
     │               │──────────────▶│               │
     │               │◀──────────────│               │
     │               │ SELECT nodes  │               │
     │               │──────────────▶│               │
     │               │◀──────────────│               │
     │               │ SELECT edges  │               │
     │               │──────────────▶│               │
     │               │◀──────────────│               │
     │               │               │               │
     │               │ Subscribe     │               │
     │               │───────────────│──────────────▶│
     │               │               │               │
     │◀──────────────│ Render map    │               │
     │               │               │               │
     │               │◀──────────────│──────────────▶│
     │               │ Live updates  │  Broadcast    │
     │◀──────────────│               │               │
```

### 3.3 Ação de IA (Expandir Nó)

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User    │    │ Frontend │    │ Backend  │    │ Claude   │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     │ Click Expand  │               │               │
     │──────────────▶│               │               │
     │               │ POST /ai/expand               │
     │               │──────────────▶│               │
     │               │               │ Build prompt  │
     │               │               │──────────────▶│
     │               │               │◀──────────────│
     │               │               │ Parse response│
     │               │               │               │
     │               │               │ INSERT nodes  │
     │               │               │──────[Supabase]
     │               │               │               │
     │               │◀──────────────│ Return nodes  │
     │               │               │               │
     │               │ Realtime sync │               │
     │◀──────────────│ Animate new   │               │
     │               │               │               │
```

---

## 4. Estrutura de Diretórios Detalhada

### 4.1 Frontend

```
frontend/
├── public/
│   ├── favicon.ico
│   └── logo.svg
├── src/
│   ├── main.tsx                 # Entry point
│   ├── App.tsx                  # Root component
│   ├── vite-env.d.ts
│   │
│   ├── components/
│   │   ├── ui/                  # Design system primitivos
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Drawer.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── layout/              # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MainLayout.tsx
│   │   │   └── EditorLayout.tsx
│   │   │
│   │   ├── auth/                # Auth components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── ProfileSelect.tsx
│   │   │   └── AuthGuard.tsx
│   │   │
│   │   ├── map/                 # Mindmap components
│   │   │   ├── MapCanvas.tsx
│   │   │   ├── MapNode.tsx
│   │   │   ├── MapEdge.tsx
│   │   │   ├── MapControls.tsx
│   │   │   ├── MapMinimap.tsx
│   │   │   ├── MapToolbar.tsx
│   │   │   └── NodeContextMenu.tsx
│   │   │
│   │   ├── list/                # List view components
│   │   │   ├── ListView.tsx
│   │   │   ├── ListItem.tsx
│   │   │   └── ListTree.tsx
│   │   │
│   │   ├── kanban/              # Kanban view components
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── KanbanColumn.tsx
│   │   │   └── KanbanCard.tsx
│   │   │
│   │   ├── tasks/               # Task components
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskModal.tsx
│   │   │   └── DelegateModal.tsx
│   │   │
│   │   ├── notifications/       # Notification components
│   │   │   ├── NotificationBell.tsx
│   │   │   ├── NotificationList.tsx
│   │   │   └── NotificationItem.tsx
│   │   │
│   │   ├── ai/                  # AI components
│   │   │   ├── AgentConsole.tsx
│   │   │   ├── AgentButton.tsx
│   │   │   └── AIChat.tsx
│   │   │
│   │   └── presence/            # Realtime presence
│   │       ├── PresenceAvatars.tsx
│   │       ├── Cursor.tsx
│   │       └── SelectionHighlight.tsx
│   │
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── MapEditorPage.tsx
│   │   └── NotFoundPage.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useMap.ts
│   │   ├── useNodes.ts
│   │   ├── useTasks.ts
│   │   ├── useNotifications.ts
│   │   ├── useRealtime.ts
│   │   ├── usePresence.ts
│   │   └── useAI.ts
│   │
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── mapStore.ts
│   │   ├── uiStore.ts
│   │   └── notificationStore.ts
│   │
│   ├── services/
│   │   ├── supabase.ts          # Cliente Supabase
│   │   ├── api.ts               # Cliente API backend
│   │   ├── auth.ts              # Serviço de auth
│   │   ├── maps.ts              # CRUD de mapas
│   │   ├── nodes.ts             # CRUD de nós
│   │   ├── tasks.ts             # CRUD de tarefas
│   │   ├── notifications.ts     # Notificações
│   │   └── ai.ts                # Chamadas de IA
│   │
│   ├── types/
│   │   ├── database.ts          # Types gerados do Supabase
│   │   ├── api.ts               # Types da API
│   │   ├── map.ts               # Types do mindmap
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── cn.ts                # Class names helper
│   │   ├── date.ts              # Date formatting
│   │   ├── mapLayout.ts         # Auto-layout de nós
│   │   └── constants.ts
│   │
│   └── styles/
│       ├── globals.css
│       └── animations.css
│
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── .env.example
└── package.json
```

### 4.2 Backend

```
backend/
├── src/
│   ├── index.ts                 # Entry point
│   ├── app.ts                   # Express app setup
│   │
│   ├── routes/
│   │   ├── index.ts             # Route aggregator
│   │   ├── health.ts            # Health check
│   │   ├── auth.ts              # Auth verification
│   │   ├── maps.ts              # Map operations
│   │   ├── nodes.ts             # Node operations
│   │   ├── tasks.ts             # Task operations
│   │   └── ai.ts                # AI endpoints
│   │
│   ├── controllers/
│   │   ├── mapController.ts
│   │   ├── nodeController.ts
│   │   ├── taskController.ts
│   │   └── aiController.ts
│   │
│   ├── services/
│   │   ├── supabase.ts          # Supabase client (service role)
│   │   ├── mapService.ts
│   │   ├── nodeService.ts
│   │   ├── taskService.ts
│   │   └── notificationService.ts
│   │
│   ├── agents/
│   │   ├── orchestrator.ts      # Agent orchestrator
│   │   ├── planner.ts           # Planning agent
│   │   ├── researcher.ts        # Research agent
│   │   ├── critic.ts            # Validation agent
│   │   ├── projectManager.ts    # Task creation agent
│   │   └── prompts/
│   │       ├── system.ts
│   │       ├── expand.ts
│   │       ├── summarize.ts
│   │       ├── toTasks.ts
│   │       └── templates.ts
│   │
│   ├── middleware/
│   │   ├── auth.ts              # JWT verification
│   │   ├── errorHandler.ts      # Error handling
│   │   ├── rateLimiter.ts       # Rate limiting
│   │   └── validator.ts         # Request validation
│   │
│   ├── types/
│   │   ├── database.ts
│   │   ├── api.ts
│   │   └── ai.ts
│   │
│   └── utils/
│       ├── logger.ts            # Pino logger
│       ├── env.ts               # Environment config
│       └── errors.ts            # Custom errors
│
├── tsconfig.json
├── nodemon.json
├── .env.example
└── package.json
```

---

## 5. Configuração de Ambientes

### 5.1 Frontend (.env.example)

```env
# Supabase (public)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...

# Backend API
VITE_API_URL=https://mindmap-api.onrender.com

# Feature flags
VITE_ENABLE_REALTIME=true
VITE_ENABLE_AI=true
```

### 5.2 Backend (.env.example)

```env
# Server
PORT=3001
NODE_ENV=development

# Supabase (service role - NEVER expose)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Claude API (NEVER expose)
CLAUDE_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-sonnet-4-20250514

# CORS
FRONTEND_URL=http://localhost:5173

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

---

## 6. Endpoints da API

### 6.1 Health & Info

| Method | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Health check |
| GET | `/api/info` | Versão e status |
| GET | `/api/models` | Modelos Claude disponíveis |

### 6.2 Auth (validação)

| Method | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/auth/me` | Retorna user autenticado |
| POST | `/api/auth/verify` | Valida JWT |

### 6.3 Maps

| Method | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/maps` | Lista mapas do workspace |
| GET | `/api/maps/:id` | Detalhes do mapa |
| POST | `/api/maps` | Criar mapa |
| PATCH | `/api/maps/:id` | Atualizar mapa |
| DELETE | `/api/maps/:id` | Deletar mapa |

### 6.4 Nodes

| Method | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/maps/:mapId/nodes` | Lista nós do mapa |
| POST | `/api/maps/:mapId/nodes` | Criar nó |
| PATCH | `/api/nodes/:id` | Atualizar nó |
| DELETE | `/api/nodes/:id` | Deletar nó |
| POST | `/api/nodes/:id/move` | Mover nó (parent) |

### 6.5 Tasks

| Method | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/tasks` | Minhas tasks |
| GET | `/api/maps/:mapId/tasks` | Tasks do mapa |
| POST | `/api/tasks` | Criar task |
| PATCH | `/api/tasks/:id` | Atualizar task |
| DELETE | `/api/tasks/:id` | Deletar task |
| POST | `/api/tasks/:id/delegate` | Delegar task |

### 6.6 AI

| Method | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/ai/generate-map` | Gerar mapa completo |
| POST | `/api/ai/expand-node` | Expandir nó |
| POST | `/api/ai/summarize` | Resumir subárvore |
| POST | `/api/ai/to-tasks` | Converter em tasks |
| POST | `/api/ai/suggest-links` | Sugerir conexões |
| POST | `/api/ai/chat` | Chat com contexto |

---

## 7. Padrões e Convenções

### 7.1 Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componentes | PascalCase | `MapCanvas.tsx` |
| Hooks | camelCase com use | `useMap.ts` |
| Services | camelCase | `mapService.ts` |
| Types | PascalCase | `type MapNode` |
| Constants | UPPER_SNAKE | `MAX_NODES` |
| DB tables | snake_case | `workspace_members` |
| API routes | kebab-case | `/api/ai/expand-node` |

### 7.2 Response Format (API)

**Sucesso:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Erro:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Node title is required"
  }
}
```

### 7.3 Logging

```typescript
// Structured logging com Pino
logger.info({ mapId, nodeCount }, 'Map loaded successfully');
logger.error({ error, userId }, 'Failed to expand node');
```

---

## 8. Considerações de Segurança

### 8.1 Regras de Ouro

1. **NUNCA** expor service_role no frontend
2. **NUNCA** expor CLAUDE_API_KEY no frontend
3. **SEMPRE** validar JWT no backend
4. **SEMPRE** usar RLS no Supabase
5. **SEMPRE** sanitizar inputs
6. **SEMPRE** usar HTTPS

### 8.2 Headers de Segurança (Helmet)

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

### 8.3 Rate Limiting

```typescript
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requests por minuto
  message: { error: 'Too many requests' }
});
```

---

## 9. Monitoramento e Observabilidade

### 9.1 Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2025-02-01T12:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "claude": "available"
  }
}
```

### 9.2 Logs Estruturados

- Request/response logging
- Error stack traces
- AI call metrics (tokens, latency)
- Database query timing

---

## 10. Próximos Passos de Escala (Fase 2+)

- [ ] Redis para caching
- [ ] Queue para jobs de IA (BullMQ)
- [ ] CDN para assets
- [ ] Yjs/CRDT para sync real
- [ ] WebSocket server dedicado
- [ ] Horizontal scaling no Render
