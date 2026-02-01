# 🧠 MindMap - Aplicação de Mapa Mental com IA

Uma aplicação web moderna para visualizar, organizar e colaborar em mapas mentais com integração de IA.

> **Status:** ✅ Pronto para usar | 🚀 Pronto para deploy | 📚 Documentado

## 🚀 Comece Agora (30 segundos)

```bash
# 1. Abra o navegador
http://localhost:5173

# 2. Clique em "Inicializar Banco de Dados"
# Aguarde ~30 segundos

# 3. Selecione um usuário
# (Guilherme, Helen ou Pablo)

# 4. Aproveite! 🎉
```

## 📖 Documentação Rápida

**👉 Leia primeiro:** [INSTRUCOES_AGORA.md](INSTRUCOES_AGORA.md)

## 🌟 Recursos Principais

### 📊 Visualizações
- **Mapa Mental**: Visualização interativa com ReactFlow
- **Kanban**: Quadro de tarefas com drag-and-drop
- **Lista**: Visão hierárquica expandível

### 🤖 Inteligência Artificial (Claude)
- Geração automática de mapas mentais a partir de descrições
- Expansão de ideias com sugestões inteligentes
- Assistente de chat para brainstorming
- Sugestão de tarefas baseada no contexto
- Resumo automático do conteúdo

### 👥 Colaboração em Tempo Real
- Sincronização instantânea via Supabase Realtime
- Indicador de usuários online
- Histórico de atividades
- Comentários em nós

### ✅ Gestão de Tarefas
- Converter ideias em tarefas
- Status (A fazer, Fazendo, Concluído)
- Prioridades (Baixa, Média, Alta)
- Atribuição de responsáveis
- Datas de entrega

## 🏗️ Arquitetura

```
MindMap/
├── backend/                 # API Node.js + Express
│   ├── server.js           # Servidor principal
│   ├── routes/             # Endpoints da API
│   │   ├── ai.js           # Rotas de IA
│   │   ├── mindmaps.js     # CRUD de mapas
│   │   ├── nodes.js        # CRUD de nós
│   │   ├── tasks.js        # Gestão de tarefas
│   │   └── users.js        # Gestão de usuários
│   └── services/
│       ├── aiService.js    # Integração Claude
│       └── supabaseService.js
│
├── frontend/                # React + Vite
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   │   ├── MindmapCanvas.jsx
│   │   │   ├── KanbanBoard.jsx
│   │   │   ├── TaskListView.jsx
│   │   │   ├── AIChatBot.jsx
│   │   │   └── ...
│   │   ├── store/          # Estado global (Zustand)
│   │   └── lib/            # Utilitários
│
└── database/
    └── schema.sql          # Schema PostgreSQL/Supabase
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- Conta Supabase (ou PostgreSQL local)
- Chave API da Anthropic (Claude)

### 1. Configurar o Banco de Dados

```bash
# Execute o schema no Supabase SQL Editor
# ou via psql para PostgreSQL local
psql -U postgres -d mindmap -f database/schema.sql
```

### 2. Configurar Variáveis de Ambiente

```bash
# backend/.env
SUPABASE_URL=sua_url_supabase
SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service
ANTHROPIC_API_KEY=sua_chave_anthropic
PORT=3001
```

### 3. Instalar Dependências e Executar

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (novo terminal)
cd frontend
npm install
npm run dev
```

### 4. Acessar a Aplicação

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 📡 Endpoints da API

### Mapas Mentais
- `GET /api/mindmaps` - Listar todos os mapas
- `POST /api/mindmaps` - Criar novo mapa
- `GET /api/mindmaps/:id` - Obter mapa específico
- `PUT /api/mindmaps/:id` - Atualizar mapa
- `DELETE /api/mindmaps/:id` - Excluir mapa

### Nós
- `GET /api/nodes/mindmap/:id` - Nós de um mapa
- `POST /api/nodes` - Criar nó
- `PUT /api/nodes/:id` - Atualizar nó
- `DELETE /api/nodes/:id` - Excluir nó

### Tarefas
- `GET /api/tasks` - Listar tarefas
- `PUT /api/tasks/:id/status` - Atualizar status
- `PUT /api/tasks/:id/assign` - Atribuir responsável

### IA
- `POST /api/ai/generate-map` - Gerar mapa com IA
- `POST /api/ai/expand-node` - Expandir nó
- `POST /api/ai/summarize` - Resumir conteúdo
- `POST /api/ai/chat` - Chat com assistente
- `POST /api/ai/suggest-tasks` - Sugerir tarefas

## 🎨 Tecnologias

### Frontend
- **React 18** - Framework UI
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **Framer Motion** - Animações
- **ReactFlow** - Visualização de mapas
- **Zustand** - Estado global
- **@dnd-kit** - Drag and drop

### Backend
- **Node.js** - Runtime
- **Express** - Framework web
- **Supabase** - BaaS (Database + Realtime + Auth)
- **Anthropic SDK** - Integração Claude

## 👤 Usuários Predefinidos

| Nome | Email | Cor | Papel |
|------|-------|-----|-------|
| Guilherme | guilherme@mindmap.com | Índigo | Admin |
| Helen | helen@mindmap.com | Rosa | Membro |
| Pablo | pablo@mindmap.com | Verde | Membro |

## 🔧 Configuração do Supabase

1. Criar projeto em [supabase.com](https://supabase.com)
2. Executar `database/schema.sql` no SQL Editor
3. Copiar as chaves da API para o `.env`
4. Habilitar Realtime para as tabelas `nodes`, `comments`, `activities`

## 📝 Licença

MIT License - Use livremente!

---

Desenvolvido com ❤️ por **Guilherme, Helen e Pablo**
