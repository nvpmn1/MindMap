# NeuralMap - Documentação de Arquitetura

## Visão Geral

NeuralMap é uma plataforma de mapeamento mental colaborativo com integração avançada de IA, construída com as tecnologias mais modernas do ecossistema React.

## Stack Tecnológica

### Frontend
- **React 18** - Framework UI com hooks e concurrent features
- **Vite 5** - Build tool ultra-rápido com HMR
- **TypeScript 5** - Tipagem estática para melhor DX
- **TailwindCSS 3** - Utility-first CSS framework
- **@xyflow/react** - Canvas interativo para mind maps
- **Framer Motion** - Animações fluidas e gestos
- **Zustand** - State management minimalista
- **React Query** - Server state e caching

### Backend
- **Node.js 20** - Runtime JavaScript
- **Express 4** - Framework web minimalista
- **TypeScript 5** - Tipagem no servidor
- **Anthropic SDK** - Integração com Claude AI

### Database & Auth
- **Supabase** - PostgreSQL + Auth + Realtime
- **Row Level Security** - Políticas de acesso

### Deploy
- **Vercel** - Frontend (SSR/SSG)
- **Render** - Backend API
- **Supabase Cloud** - Database

## Estrutura de Pastas

```
frontend/
├── src/
│   ├── components/
│   │   ├── ai/              # Componentes de IA
│   │   │   └── AIAgentPanel.tsx
│   │   ├── mindmap/         # Componentes do mind map
│   │   │   └── NeuralNode.tsx
│   │   ├── ui/              # Componentes base
│   │   │   ├── AnimatedCards.tsx
│   │   │   ├── button.tsx
│   │   │   └── ...
│   │   └── layout/          # Layouts
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── MapEditorPage.tsx
│   │   ├── KanbanPage.tsx
│   │   └── ...
│   ├── services/
│   │   └── aiAgent.ts       # Serviço de IA
│   ├── stores/              # Zustand stores
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilitários
│   └── types/               # TypeScript types

backend/
├── src/
│   ├── ai/
│   │   ├── orchestrator.ts  # Orquestrador de agentes IA
│   │   └── prompts.ts       # Templates de prompts
│   ├── routes/
│   │   ├── ai.ts
│   │   ├── auth.ts
│   │   ├── maps.ts
│   │   └── ...
│   ├── services/
│   │   └── supabase.ts
│   └── utils/
```

## Componentes Principais

### NeuralNode
Componente customizado para nós do mind map com:
- 7 tipos: root, idea, task, note, reference, data, process
- Animações de hover e seleção
- Indicadores de progresso, tags e colaboradores
- Ações rápidas (adicionar, expandir, editar, deletar)
- Badge para nós gerados por IA

### AIAgentPanel
Painel lateral para interação com IA:
- 7 agentes especializados (gerar, expandir, resumir, etc)
- Chat conversacional
- Histórico de mensagens
- Preview de sugestões
- Aplicação em batch

### AnimatedCards
Sistema de cards com:
- GlassCard - Card com efeito glassmorphism
- TiltCard - Card com efeito 3D
- StatsCard - Card de estatísticas
- MapCard - Card de mapa mental
- FeatureCard - Card de feature
- ActionCard - Card de ação

## Fluxo de Dados

```
User Action
    ↓
React Component
    ↓
Zustand Store / React Query
    ↓
API Client (lib/api.ts)
    ↓
Backend Express
    ↓
Supabase PostgreSQL
```

## AI Integration

### Agentes Disponíveis

| Agente | Função | Endpoint |
|--------|--------|----------|
| Generate | Gera novas ideias | POST /api/ai/generate |
| Expand | Expande um nó | POST /api/ai/expand |
| Summarize | Resume o mapa | POST /api/ai/summarize |
| ToTasks | Converte em tarefas | POST /api/ai/to-tasks |
| Chat | Conversa livre | POST /api/ai/chat |
| Analyze | Analisa padrões | POST /api/ai/chat |
| Organize | Reorganiza mapa | POST /api/ai/chat |

### Fluxo de IA

```
User Input → AI Agent Service → Backend API → Claude API
                                     ↓
                              Parse Response
                                     ↓
                              Apply to Map
```

## Autenticação

Supabase Auth com:
- Magic Link (email)
- OAuth (Google, GitHub)
- JWT tokens
- Refresh automático

## Realtime

Supabase Realtime para:
- Sincronização de nós
- Presença de colaboradores
- Chat em tempo real
- Notificações

## Performance

- Code splitting por rota
- Lazy loading de componentes
- Memoização com useMemo/useCallback
- Virtualização para listas longas
- Debounce em auto-save

## Segurança

- CORS configurado
- Rate limiting
- Validação com Zod
- RLS no Supabase
- Sanitização de inputs
