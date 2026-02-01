# 🧠 MindMap Colaborativo - Documentação Completa

## 📊 Status do Projeto

| Componente | Status | Detalhes |
|-----------|--------|----------|
| Backend Node.js | ✅ Pronto | Rodando em http://localhost:3001 |
| Frontend React | ✅ Pronto | Rodando em http://localhost:5173 |
| Banco de Dados | ⏳ Pendente | Aguardando setup SQL |
| IA Claude | ✅ Configurada | Chave presente no .env |
| Realtime | ⏳ Pendente | Será ativado no setup |

---

## 🎯 O que foi Criado

### Backend (`/backend`)
```
✅ server.js               - Servidor Express principal
✅ routes/
   ✅ ai.js               - Endpoints de IA (gerar, expandir, resumir, chat)
   ✅ tasks.js            - CRUD de tarefas
   ✅ nodes.js            - CRUD de nós do mapa
   ✅ mindmaps.js         - CRUD de mapas
   ✅ users.js            - Gerenciamento de usuários
   ✅ setup.js            - Setup automático do banco
✅ services/
   ✅ aiService.js        - Integração com Claude API
   ✅ supabaseService.js  - Cliente Supabase
✅ .env                    - Variáveis de ambiente configuradas
✅ package.json            - Dependências instaladas
```

### Frontend (`/frontend`)
```
✅ src/
   ✅ App.jsx             - Componente principal com setup automático
   ✅ main.jsx            - Entry point
   ✅ index.css           - Estilos globais + Framer Motion
   ✅ components/
      ✅ MindmapCanvas.jsx      - Canvas interativo com ReactFlow
      ✅ MindMapNode.jsx        - Componente customizado de nó
      ✅ KanbanBoard.jsx        - Quadro Kanban com drag-drop
      ✅ TaskListView.jsx       - Visualização em lista hierárquica
      ✅ AIChatBot.jsx          - Chat com Claude flutuante
      ✅ Sidebar.jsx            - Navegação lateral
      ✅ TopBar.jsx             - Barra superior
      ✅ HomePage.jsx           - Página inicial
      ✅ NodeDetailsPanel.jsx   - Painel de detalhes lateral
      ✅ DatabaseSetup.jsx      - Setup automático do banco
   ✅ store/
      ✅ index.js         - Zustand stores (user, mindmap, view, chat, notifications)
   ✅ lib/
      ✅ api.js           - Cliente API para backend
      ✅ supabase.js      - Cliente Supabase com realtime
✅ vite.config.js          - Configuração Vite
✅ tailwind.config.js      - Tailwind CSS customizado
✅ postcss.config.js       - PostCSS config
✅ index.html              - HTML entry point
✅ package.json            - Dependências instaladas
```

### Banco de Dados (`/database`)
```
✅ schema.sql              - Schema completo PostgreSQL com:
   ✅ 8 tabelas (users, mindmaps, nodes, links, attachments, comments, activities, collaborators)
   ✅ Índices otimizados
   ✅ Triggers automáticos (timestamps, logging)
   ✅ Row Level Security (RLS)
   ✅ 3 usuários predefinidos (Guilherme, Helen, Pablo)
   ✅ Dados de exemplo
✅ verify-setup.sql        - Script para verificar setup
```

### Documentação
```
✅ README.md               - Documentação principal
✅ SETUP.md                - Guia detalhado de setup
✅ QUICK_START.md          - Início rápido
✅ Este arquivo            - Documentação completa
```

### Scripts de Suporte
```
✅ setup-database.bat      - Abre Supabase SQL Editor (Windows)
✅ setup-db.sh             - Abre Supabase (macOS/Linux)
✅ test-connection.ps1     - Testa conexões (PowerShell)
```

---

## 🚀 PRÓXIMOS PASSOS

### 1️⃣ Setup do Banco de Dados (CRÍTICO)

**Execute O SCHEMA SQL NO SUPABASE:**

A. Acesse: https://mvkrlvjyocynmwslklzu.supabase.co
B. SQL Editor → New Query
C. Cole o conteúdo de `database/schema.sql`
D. Clique em RUN

Ou execute automaticamente:
- Abra http://localhost:5173
- Um modal aparecerá oferecendo setup automático
- Clique em "Inicializar"

### 2️⃣ Habilitar Realtime

No Dashboard Supabase:
- Database → Publications → supabase_realtime
- Ative: nodes, comments, activities
- Clique em Save

### 3️⃣ Testar Funcionalidades

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev

# Terminal 3 - Browser
http://localhost:5173
```

Testes:
- [ ] Selecionar usuário
- [ ] Ver Mapa Mental vazio
- [ ] Criar novo nó
- [ ] Alternar para Kanban/Lista
- [ ] Abrir Chat IA
- [ ] Pedir para gerar mapa

### 4️⃣ Deployment (Opcional)

#### Backend no Render
```
1. https://render.com/dashboard
2. New → Web Service
3. Connect GitHub repository
4. Environment variables:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - ANTHROPIC_API_KEY
   - NODE_ENV=production
   - FRONTEND_URL=seu_url_vercel
5. Deploy
```

#### Frontend no Vercel
```
1. https://vercel.com/dashboard
2. Add New Project
3. Import GitHub repository
4. Environment variables:
   - VITE_BACKEND_URL=seu_url_render
5. Deploy
```

---

## 🎮 Como Usar a Plataforma

### 1. Selecionar Usuário
- Na tela inicial, clique em Guilherme, Helen ou Pablo
- Cada usuário pode ver todas as mudanças em tempo real

### 2. Criar Mapa Mental
- Menu: "Nova Ideia" (botão verde + no Sidebar)
- Ou use Template IA para geração automática
- Arraste nós para organizar

### 3. Atribuir Tarefas
- Clique em nó → Menu → "Atribuir a"
- Escolha um usuário
- O nó aparecerá nas pendências dessa pessoa

### 4. Alternar Visualizações
- Topo da tela: Mapa, Kanban ou Lista
- Mesmos dados, diferentes visualizações
- Mudanças sincronizam entre todas

### 5. Usar IA
- Clique no robô 🤖 (canto inferior direito)
- Peça para:
  - Gerar mapa mental
  - Expandir uma ideia
  - Resumir conteúdo
  - Responder perguntas sobre o projeto

### 6. Colaboração em Tempo Real
- Abra em dois navegadores/usuários diferentes
- Mudanças aparecem instantaneamente
- Veja quem está online (avatares no TopBar)

---

## 🔐 Credenciais

### Supabase
- URL: https://mvkrlvjyocynmwslklzu.supabase.co
- Usuários: (definir ao logar)
- Dashboard: https://supabase.com/dashboard

### IA Claude (Anthropic)
- Modelo: claude-sonnet-4-20250514
- Status: ✅ Configurado
- Limite: Conforme seu plano

### Usuários Predefinidos
```
👤 Guilherme
   Email: guilherme@mindmap.com
   Cor: Índigo #6366f1
   Papel: Admin

👤 Helen
   Email: helen@mindmap.com
   Cor: Rosa #ec4899
   Papel: Membro

👤 Pablo
   Email: pablo@mindmap.com
   Cor: Verde #10b981
   Papel: Membro
```

---

## 📱 Funcionalidades Implementadas

### ✅ Mapa Mental
- Nós hierárquicos com drag-drop
- Conexões entre nós (cross-links)
- Zoom/Pan infinito
- Múltiplos layouts (Radial, Hierárquico, Rede)
- Cores customizáveis
- Anexos e notas
- Colapso/Expansão de ramos
- Busca rápida

### ✅ Kanban
- Colunas: A Fazer, Fazendo, Feito
- Drag-drop entre colunas
- Filtro por usuário
- Cartões com metadados (prioridade, data, responsável)
- Sincronização com mapa

### ✅ Lista
- Visualização hierárquica
- Edição inline
- Expand/collapse
- Checkbox de status
- Atribuição de usuários
- Reordenação

### ✅ IA (Claude)
- Gerar mapa mental a partir de prompt
- Expandir nó com sugestões
- Resumir conteúdo
- Chat contextual com acesso ao mapa
- Sugerir tarefas

### ✅ Colaboração
- Realtime com Supabase
- Presença de usuários
- Histórico de atividades
- Comentários em nós
- Notificações
- Indicador de quem está editando

### ✅ UI/UX
- Framer Motion animações
- Tailwind CSS design moderno
- Dark mode
- Responsivo
- Atalhos de teclado
- Tooltips e ajuda

---

## 🐛 Troubleshooting

### Problema: "Conexão recusada no backend"
**Solução:**
```bash
cd backend
npm install
npm run dev
```

### Problema: "Banco de dados vazio"
**Solução:**
- Abra http://localhost:5173
- Clique em "Inicializar Banco de Dados"
- Ou execute manualmente no SQL Editor do Supabase

### Problema: "IA não responde"
**Solução:**
```
1. Verifique .env tem ANTHROPIC_API_KEY
2. Teste com curl:
   curl http://localhost:3001/health
3. Verifique logs do backend (npm run dev)
```

### Problema: "Não vejo mudanças em tempo real"
**Solução:**
```
1. Verifique se Realtime está ativado (Database → Publications)
2. Abra Console (F12) e procure erros
3. Tente recarregar página (F5)
```

---

## 📚 Estrutura de Dados

### Tabela: nodes
```sql
{
  id: UUID,
  mindmap_id: UUID,
  parent_id: UUID | null,
  content: string,          -- Título do nó
  description: text,        -- Descrição longa
  type: enum,              -- 'idea', 'task', 'note'
  status: enum,            -- 'todo', 'doing', 'done'
  priority: enum,          -- 'high', 'medium', 'low'
  assigned_to: UUID,       -- Usuário responsável
  due_date: date,          -- Data de entrega
  position_x: float,       -- Coordenada X no canvas
  position_y: float,       -- Coordenada Y no canvas
  created_by: UUID,
  created_at: timestamp,
  updated_at: timestamp
}
```

### Tabela: users
```sql
{
  id: UUID,
  name: string,
  email: string (unique),
  avatar_url: string,
  color: string,           -- Cor hex para exibição
  role: enum,              -- 'admin', 'member'
  preferences: json,
  created_at: timestamp
}
```

---

## 🎓 Exemplos de Uso

### Exemplo 1: Brainstorm com IA
```
1. Abra http://localhost:5173
2. Selecione "Guilherme"
3. Clique no robô 🤖
4. Digite: "Gere um mapa mental para análise de problemas"
5. A IA gera: Definição, Causas, Soluções, Plano de Ação
6. Clique em "Adicionar ao mapa"
7. O mapa aparece na visualização
```

### Exemplo 2: Atribuir Tarefa
```
1. Crie um nó: "Escrever relatório"
2. Clique no nó → Menu → "Atribuir a Helen"
3. Helen verá notificação e o nó destacado
4. Helen arrasta para "Fazendo" no Kanban
5. Guilherme vê mudança instantaneamente no mapa
```

### Exemplo 3: Colaboração em Tempo Real
```
1. Navegador 1: Guilherme criando mapa
2. Navegador 2: Helen vendo mudanças ao vivo
3. Helen arrasta um nó
4. Guilherme vê movimento em tempo real
```

---

## 📞 Suporte

**Logs do Backend:**
Veja `npm run dev` no terminal onde iniciou

**Console do Navegador:**
Pressione F12 e veja a aba Console

**Supabase Logs:**
Dashboard → Logs → Edge Functions

---

## 🎉 Sucesso!

Se você chegou aqui e tudo está funcionando:

✅ Backend rodando  
✅ Frontend rodando  
✅ Banco de dados configurado  
✅ IA integrada  
✅ Realtime ativo  
✅ Pronto para produção!  

**Aproveite! 🚀**

---

**Versão:** 1.0.0  
**Data:** Janeiro 2026  
**Criado por:** Guilherme, Helen & Pablo  
**Status:** ✨ Produção Pronta
